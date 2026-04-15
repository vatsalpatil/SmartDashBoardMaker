from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from pydantic import BaseModel
from models.database import get_db
import uuid

router = APIRouter(prefix="/api/datasets", tags=["datasets"])

class DatasetBase(BaseModel):
    name: str
    original_filename: str
    file_path: str
    file_size: Optional[int] = 0
    row_count: Optional[int] = 0
    columns: str  # JSON string
    is_virtual: Optional[int] = 0
    parent_dataset_id: Optional[str] = None
    sql_query: Optional[str] = None
    source_type: Optional[str] = 'file'
    source_meta: Optional[str] = '{}'

def prepare_dataset_response(d: dict):
    # Parse columns if it's a JSON string
    import json
    import re
    if isinstance(d.get('columns'), str):
        try:
            d['columns'] = json.loads(d['columns'])
        except:
            pass
    
    # Ensure table_name exists for frontend compatibility
    # If not in DB, derive from name
    if not d.get('table_name'):
        d['table_name'] = re.sub(r'[^a-zA-Z0-9_]', '_', d.get('name', 'dataset')).lower()
        
    return d

@router.get("/")
async def list_datasets():
    with get_db() as conn:
        cursor = conn.execute("SELECT * FROM datasets ORDER BY created_at DESC")
        datasets = []
        for row in cursor.fetchall():
            datasets.append(prepare_dataset_response(dict(row)))
        return {"datasets": datasets}

@router.get("/{dataset_id}")
async def get_dataset(dataset_id: str):
    with get_db() as conn:
        cursor = conn.execute("SELECT * FROM datasets WHERE id = ?", (dataset_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Dataset not found")
        return prepare_dataset_response(dict(row))

@router.post("/")
async def create_dataset(dataset: DatasetBase):
    dataset_id = str(uuid.uuid4())
    with get_db() as conn:
        conn.execute("""
            INSERT INTO datasets (
                id, name, original_filename, file_path, file_size, 
                row_count, columns, is_virtual, parent_dataset_id, 
                sql_query, source_type, source_meta
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            dataset_id, dataset.name, dataset.original_filename, dataset.file_path,
            dataset.file_size, dataset.row_count, dataset.columns, dataset.is_virtual,
            dataset.parent_dataset_id, dataset.sql_query, dataset.source_type, dataset.source_meta
        ))
        return {"id": dataset_id, **dataset.dict()}

@router.delete("/{dataset_id}")
async def delete_dataset(dataset_id: str):
    with get_db() as conn:
        conn.execute("DELETE FROM datasets WHERE id = ?", (dataset_id,))
        return {"status": "success"}

from fastapi import UploadFile, File, Form
import os
import shutil
import json

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload")
async def upload_dataset(
    file: UploadFile = File(...),
    name: str = Form(...),
    source_type: str = Form("file"),
    source_meta: str = Form("{}"),
    id: Optional[str] = Form(None)
):
    dataset_id = id or str(uuid.uuid4())
    
    # Save the file
    ext = os.path.splitext(file.filename)[1].lower() or ".csv"
    safe_name = "".join(c for c in name if c.isalnum() or c in (" ", "_", "-")).strip().replace(" ", "_")
    filename = f"{dataset_id[:8]}_{safe_name}{ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    file_size = os.path.getsize(file_path)
    
    # Simple schema detection for CSV
    import polars as pl
    row_count = 0
    cols_meta = []
    
    try:
        if ext == ".csv":
            df = pl.read_csv(file_path, n_rows=100)
            row_count = pl.scan_csv(file_path).select(pl.len()).collect().item()
            cols_meta = [{"name": c, "dtype": str(df[c].dtype)} for c in df.columns]
        elif ext == ".parquet":
            df = pl.read_parquet(file_path, n_rows=100)
            row_count = pl.scan_parquet(file_path).select(pl.len()).collect().item()
            cols_meta = [{"name": c, "dtype": str(df[c].dtype)} for c in df.columns]
    except Exception as e:
        print(f"Schema detection failed: {e}")
        
    with get_db() as db:
        if id:
            # Update existing
            db.execute("""
                UPDATE datasets SET 
                    name = ?, original_filename = ?, file_path = ?, 
                    file_size = ?, row_count = ?, columns = ?,
                    source_type = ?, source_meta = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            """, (name, file.filename, file_path, file_size, row_count, json.dumps(cols_meta), source_type, source_meta, id))
        else:
            # Insert new
            db.execute("""
                INSERT INTO datasets (
                    id, name, original_filename, file_path, file_size, 
                    row_count, columns, source_type, source_meta, is_virtual
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
            """, (dataset_id, name, file.filename, file_path, file_size, row_count, json.dumps(cols_meta), source_type, source_meta))

    return {
        "id": dataset_id,
        "name": name,
        "row_count": row_count,
        "columns": cols_meta,
        "file_path": file_path
    }

@router.get("/{dataset_id}/preview")
async def preview_dataset_endpoint(dataset_id: str, page: int = 1, page_size: int = 50):
    from services.data_service import execute_query_duckdb, resolve_table_reference
    try:
        table_name = resolve_table_reference(dataset_id)
        
        # Get total row count
        count_res = execute_query_duckdb(f"SELECT count(*) FROM {table_name}")
        total_rows = list(count_res['rows'][0].values())[0]
        
        # Get paged data
        offset = (page - 1) * page_size
        paged_sql = f"SELECT * FROM {table_name} LIMIT {page_size} OFFSET {offset}"
        data_res = execute_query_duckdb(paged_sql)
        
        return {
            "columns": data_res["columns"],
            "rows": data_res["rows"],
            "total_rows": total_rows,
            "page": page,
            "page_size": page_size
        }
    except Exception as e:
        print(f"Preview failed: {e}")
        # Return empty data instead of 400 to avoid UI crashes
        return {"columns": [], "rows": [], "total_rows": 0, "error": str(e)}

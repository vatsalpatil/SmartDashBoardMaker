from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from fastapi.responses import FileResponse
from typing import List, Optional
from pydantic import BaseModel
from models.database import get_db
from auth.dependencies import get_current_user
import uuid
import os
from fastapi.responses import FileResponse
from typing import List, Optional
from pydantic import BaseModel
from models.database import get_db
import uuid

router = APIRouter(prefix="/api/queries", tags=["queries"])

class QueryBase(BaseModel):
    id: Optional[str] = None
    name: str
    description: Optional[str] = ""
    sql_text: str
    dataset_id: str
    config: Optional[str] = "{}"

@router.get("/")
def list_queries(dataset_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        if dataset_id:
            cursor = conn.execute("SELECT * FROM saved_queries WHERE dataset_id = ? AND user_id = ?", (dataset_id, current_user["id"]))
        else:
            cursor = conn.execute("SELECT * FROM saved_queries WHERE user_id = ? ORDER BY created_at DESC", (current_user["id"],))
        return {"queries": [dict(row) for row in cursor.fetchall()]}

@router.post("/save")
def save_query(query: QueryBase, current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        # 1. Try to find existing by ID
        existing_id = None
        if hasattr(query, 'id') and query.id:
            cursor = conn.execute("SELECT id FROM saved_queries WHERE id = ? AND user_id = ?", (query.id, current_user["id"]))
            row = cursor.fetchone()
            if row: existing_id = row['id']
            
        # 2. Try to find existing by Name if no ID match
        if not existing_id:
            cursor = conn.execute("SELECT id FROM saved_queries WHERE name = ? AND user_id = ?", (query.name, current_user["id"]))
            row = cursor.fetchone()
            if row: existing_id = row['id']

        if existing_id:
            conn.execute("""
                UPDATE saved_queries 
                SET name = ?, description = ?, sql_text = ?, dataset_id = ?, config = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ? AND user_id = ?
            """, (query.name, query.description, query.sql_text, query.dataset_id, query.config, existing_id, current_user["id"]))
            return {"id": existing_id, **query.dict()}
                
        # 3. Create new if no match
        new_id = getattr(query, 'id', None) or str(uuid.uuid4())
        conn.execute("""
            INSERT INTO saved_queries (id, user_id, name, description, sql_text, dataset_id, config)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (new_id, current_user["id"], query.name, query.description, query.sql_text, query.dataset_id, query.config))
        return {"id": new_id, **query.dict()}

class SaveDatasetRequest(BaseModel):
    name: str
    sql: str
    dataset_id: str

@router.post("/save_dataset")
def save_query_as_dataset(req: SaveDatasetRequest, current_user: dict = Depends(get_current_user)):
    new_dataset_id = str(uuid.uuid4())
    with get_db() as conn:
        conn.execute("""
            INSERT INTO datasets (id, user_id, name, original_filename, file_path, row_count, columns, is_virtual, parent_dataset_id, sql_query, source_type)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (new_dataset_id, current_user["id"], req.name, req.name, "", 0, "[]", 1, req.dataset_id, req.sql, 'query'))
        return {"dataset_id": new_dataset_id}

@router.get("/{query_id}")
def get_query(query_id: str, current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        cursor = conn.execute("SELECT * FROM saved_queries WHERE id = ? AND user_id = ?", (query_id, current_user["id"]))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Query not found")
        return dict(row)

@router.delete("/{query_id}")
def delete_query(query_id: str, current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        conn.execute("DELETE FROM saved_queries WHERE id = ? AND user_id = ?", (query_id, current_user["id"]))
        return {"status": "success"}

class ExecuteRequest(BaseModel):
    sql: str
    dataset_id: Optional[str] = None
    page: Optional[int] = 1
    page_size: Optional[int] = 100

@router.post("/execute")
def execute_query_endpoint(req: ExecuteRequest, current_user: dict = Depends(get_current_user)):
    from services.data_service import execute_query_duckdb
    try:
        # Paging for big results
        offset = (req.page - 1) * req.page_size
        paged_sql = f"SELECT * FROM ({req.sql.strip().rstrip(';')}) AS q LIMIT {req.page_size} OFFSET {offset}"
        
        print(f"DEBUG: Executing Query")
        print(f"SQL: {paged_sql}")
        
        result = execute_query_duckdb(paged_sql, req.dataset_id)
        
        # Get total count if it's the first page
        total = 0
        if req.page == 1:
            count_sql = f"SELECT count(*) FROM ({req.sql.strip().rstrip(';')}) AS q"
            count_res = execute_query_duckdb(count_sql, req.dataset_id)
            total = list(count_res['rows'][0].values())[0]
            
        return {
            "columns": result["columns"],
            "rows": result["rows"],
            "total": total,
            "page": req.page,
            "page_size": req.page_size
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/validate")
def validate_query_endpoint(req: ExecuteRequest, current_user: dict = Depends(get_current_user)):
    from services.data_service import execute_query_duckdb
    try:
        # Just try to explain or run with limit 0
        check_sql = f"SELECT * FROM ({req.sql.strip().rstrip(';')}) AS q LIMIT 0"
        execute_query_duckdb(check_sql, req.dataset_id, skip_refresh=True)
        return {"valid": True}
    except Exception as e:
        return {"valid": False, "error": str(e)}

@router.post("/export")
def export_query(req: ExecuteRequest, background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_user)):
    from services.data_service import export_query_to_csv
    try:
        tmp_path = export_query_to_csv(req.sql, req.dataset_id)
        
        def cleanup():
            if os.path.exists(tmp_path):
                try:
                    os.remove(tmp_path)
                except:
                    pass
                    
        background_tasks.add_task(cleanup)
        
        return FileResponse(
            path=tmp_path,
            filename="query_results.csv",
            media_type="text/csv"
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))

from fastapi import APIRouter, HTTPException
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
async def list_queries(dataset_id: Optional[str] = None):
    with get_db() as conn:
        if dataset_id:
            cursor = conn.execute("SELECT * FROM saved_queries WHERE dataset_id = ?", (dataset_id,))
        else:
            cursor = conn.execute("SELECT * FROM saved_queries ORDER BY created_at DESC")
        return {"queries": [dict(row) for row in cursor.fetchall()]}

@router.post("/save")
async def save_query(query: QueryBase):
    with get_db() as conn:
        if hasattr(query, 'id') and query.id:
            # Check if it exists
            cursor = conn.execute("SELECT id FROM saved_queries WHERE id = ?", (query.id,))
            if cursor.fetchone():
                conn.execute("""
                    UPDATE saved_queries 
                    SET name = ?, description = ?, sql_text = ?, dataset_id = ?, config = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                """, (query.name, query.description, query.sql_text, query.dataset_id, query.config, query.id))
                return {"id": query.id, **query.dict()}
                
        # Generate new ID if not updating
        new_id = getattr(query, 'id', None) or str(uuid.uuid4())
        conn.execute("""
            INSERT INTO saved_queries (id, name, description, sql_text, dataset_id, config)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (new_id, query.name, query.description, query.sql_text, query.dataset_id, query.config))
        return {"id": new_id, **query.dict()}

class SaveDatasetRequest(BaseModel):
    name: str
    sql: str
    dataset_id: str

@router.post("/save_dataset")
async def save_query_as_dataset(req: SaveDatasetRequest):
    new_dataset_id = str(uuid.uuid4())
    with get_db() as conn:
        conn.execute("""
            INSERT INTO datasets (id, name, original_filename, file_path, row_count, columns, is_virtual, parent_dataset_id, sql_query, source_type)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (new_dataset_id, req.name, req.name, "", 0, "[]", 1, req.dataset_id, req.sql, 'query'))
        return {"dataset_id": new_dataset_id}

@router.delete("/{query_id}")
async def delete_query(query_id: str):
    with get_db() as conn:
        conn.execute("DELETE FROM saved_queries WHERE id = ?", (query_id,))
        return {"status": "success"}

class ExecuteRequest(BaseModel):
    sql: str
    dataset_id: Optional[str] = None
    page: Optional[int] = 1
    page_size: Optional[int] = 100

@router.post("/execute")
async def execute_query_endpoint(req: ExecuteRequest):
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
async def validate_query_endpoint(req: ExecuteRequest):
    from services.data_service import execute_query_duckdb
    try:
        # Just try to explain or run with limit 0
        check_sql = f"SELECT * FROM ({req.sql.strip().rstrip(';')}) AS q LIMIT 0"
        execute_query_duckdb(check_sql, req.dataset_id)
        return {"valid": True}
    except Exception as e:
        return {"valid": False, "error": str(e)}

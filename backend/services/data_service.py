import duckdb
import os
import re
import json
from typing import Optional, Dict, Any, List
from models.database import get_db

_duck_conn = None
_RESOLVED_DATASETS = {}  # Cache: {dataset_id: {view_name, mtime, safe_name}}

def get_duckdb():
    global _duck_conn
    if _duck_conn is None:
        _duck_conn = duckdb.connect(database=':memory:', read_only=False)
        _duck_conn.execute("INSTALL httpfs; LOAD httpfs;")
        _duck_conn.execute("PRAGMA memory_limit='2GB'")
        _duck_conn.execute("SET preserve_insertion_order=false")
    return _duck_conn

def resolve_table_reference(dataset_id: str) -> str:
    """Ensures dataset is available in DuckDB and returns the UUID-based view name."""
    global _RESOLVED_DATASETS
    
    with get_db() as db:
        row = db.execute("SELECT id, name, file_path, source_type FROM datasets WHERE id = ?", (dataset_id,)).fetchone()
        if not row:
            raise ValueError(f"Dataset {dataset_id} not found")
    
    d = dict(row)
    file_path = d.get('file_path')
    mtime = os.path.getmtime(file_path) if file_path and os.path.exists(file_path) else 0
    
    # 1. Performance: Use cache if view exists and file hasn't changed
    cached = _RESOLVED_DATASETS.get(dataset_id)
    if cached and cached['mtime'] == mtime:
        return cached['view_name']

    view_name_uuid = f"dataset_{dataset_id.replace('-', '_')}"
    safe_name = re.sub(r'[^a-zA-Z0-9_]', '_', d.get('name', 'dataset')).lower()
    con = get_duckdb()

    def register_views(sql_source):
        con.execute(f"CREATE OR REPLACE VIEW \"{view_name_uuid}\" AS {sql_source}")
        if safe_name and safe_name != view_name_uuid:
            con.execute(f"CREATE OR REPLACE VIEW \"{safe_name}\" AS {sql_source}")

    # 2. Logic: Prioritize local files (handles API exports, uploads, etc)
    if file_path and os.path.exists(file_path):
        # Escape single quotes for SQL
        esc_path = file_path.replace("'", "''")
        if file_path.endswith('.csv'):
            sql = f"SELECT * FROM read_csv_auto('{esc_path}')"
        elif file_path.endswith('.parquet'):
            sql = f"SELECT * FROM read_parquet('{esc_path}')"
        elif file_path.endswith('.json'):
            sql = f"SELECT * FROM read_json_auto('{esc_path}')"
        else:
            sql = f"SELECT * FROM read_csv_auto('{esc_path}')"
        
        register_views(sql)
        _RESOLVED_DATASETS[dataset_id] = {'view_name': view_name_uuid, 'mtime': mtime, 'safe_name': safe_name}
        return view_name_uuid

    # 3. Fallback to external source loader
    source_type = d.get('source_type', 'file')
    if source_type in ['url', 'db']:
        from services.external_source_service import load_url_dataset_to_duckdb, load_db_table_to_duckdb
        try:
            df = load_url_dataset_to_duckdb(dataset_id) if source_type == 'url' else load_db_table_to_duckdb(dataset_id)
            con.register(view_name_uuid, df)
            if safe_name: con.register(safe_name, df)
            _RESOLVED_DATASETS[dataset_id] = {'view_name': view_name_uuid, 'mtime': 0, 'safe_name': safe_name}
            return view_name_uuid
        except Exception as e:
            print(f"Failed to load external source: {e}")
            raise e

    return view_name_uuid

def execute_query_duckdb(sql: str, dataset_id: Optional[str] = None):
    con = get_duckdb()
    
    # Pre-resolve if ID is given
    if dataset_id:
        try:
            resolve_table_reference(dataset_id)
        except Exception as e:
            print(f"Pre-resolve failed: {e}")

    try:
        # Paging logic handled at SQL level if possible, but here we just run it
        res = con.execute(sql)
        cols = [d[0] for d in res.description]
        rows = []
        # Limit total result size to prevent memory issues for large unpaged SELECT *
        for r in res.fetchmany(10000): 
            rows.append(dict(zip(cols, r)))
        return {"columns": cols, "rows": rows}
    except Exception as e:
        error_msg = str(e)
        # Attempt to auto-resolve missing tables if referenced by name/ID
        if "Table with name" in error_msg:
            match = re.search(r"Table with name ([a-zA-Z0-9_\-]+) does not exist", error_msg)
            if match:
                ref = match.group(1)
                # If ref looks like a dataset ID, try resolving it
                potential_id = ref.replace('dataset_', '').replace('_', '-')
                with get_db() as db:
                    ds = db.execute("SELECT id FROM datasets WHERE id = ? OR name = ?", (potential_id, ref)).fetchone()
                    if ds:
                        resolve_table_reference(ds[0])
                        # Try executing one more time
                        try:
                            res = con.execute(sql)
                            cols = [d[0] for d in res.description]
                            rows = [dict(zip(cols, r)) for r in res.fetchmany(10000)]
                            return {"columns": cols, "rows": rows}
                        except: pass
        
        raise Exception(error_msg)

def export_query_to_csv(sql: str, dataset_id: Optional[str] = None) -> str:
    """Executes a query and exports the full result set to a temporary CSV file."""
    con = get_duckdb()
    if dataset_id:
        resolve_table_reference(dataset_id)
    
    import tempfile
    # Create a persistent temp file path
    fd, tmp_path = tempfile.mkstemp(suffix='.csv')
    os.close(fd)
    
    try:
        # Clean the SQL
        clean_sql = sql.strip().rstrip(';')
        # DuckDB native export
        # Use double single quotes for path escaping in DuckDB
        esc_path = tmp_path.replace("'", "''")
        con.execute(f"COPY ({clean_sql}) TO '{esc_path}' (HEADER, DELIMITER ',')")
        return tmp_path
    except Exception as e:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
        raise e

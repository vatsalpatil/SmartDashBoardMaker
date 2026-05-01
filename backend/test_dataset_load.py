import sys
sys.path.insert(0, '.')
from models.database import get_db
from services.data_service import resolve_table_reference, execute_query_duckdb

ds = None
with get_db() as db:
    ds = db.execute("SELECT id, name, file_path, source_type FROM datasets ORDER BY created_at DESC LIMIT 1").fetchone()

if ds:
    print(f"Latest dataset: {dict(ds)}")
    try:
        tn = resolve_table_reference(ds['id'])
        print(f"Resolved table name: {tn}")
        res = execute_query_duckdb(f"SELECT count(*) FROM {tn}")
        print(f"Result: {res}")
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
else:
    print("No datasets found in metadata.db")

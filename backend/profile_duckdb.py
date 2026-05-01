import sys
import time
import duckdb
import os
sys.path.insert(0, '.')

from models.database import get_db

def profile_query():
    print("Fetching dataset info...")
    with get_db() as db:
        ds = db.execute("SELECT id, name, file_path, source_type FROM datasets ORDER BY created_at DESC LIMIT 1").fetchone()
        
    if not ds:
        print("No datasets.")
        return

    print(f"Dataset: {dict(ds)}")
    file_path = ds['file_path']
    esc_path = file_path.replace("\\", "/").replace("'", "''")

    print("Connecting to DuckDB...")
    con = duckdb.connect(':memory:')
    
    t0 = time.time()
    print("Creating view...")
    con.execute(f"CREATE OR REPLACE VIEW my_view AS SELECT * FROM read_csv_auto('{esc_path}')")
    t1 = time.time()
    print(f"View created in {t1-t0:.4f}s")
    
    print("Running COUNT(*)...")
    try:
        res = con.execute("SELECT count(*) FROM my_view").fetchone()
        t2 = time.time()
        print(f"Count {res[0]} computed in {t2-t1:.4f}s")
    except Exception as e:
        print(f"Error computing count: {e}")
        
    t2 = time.time()
    print("Running LIMIT 200...")
    try:
        res = con.execute("SELECT * FROM my_view LIMIT 200").fetchall()
        t3 = time.time()
        print(f"LIMIT 200 returned {len(res)} rows in {t3-t2:.4f}s")
    except Exception as e:
        print(f"Error computing LIMIT: {e}")

if __name__ == "__main__":
    profile_query()

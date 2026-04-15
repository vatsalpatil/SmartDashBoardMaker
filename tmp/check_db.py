import sqlite3
import os

DB_PATH = r"C:\Users\Vatsal\Document\VSCodeFiles\PythonCode\SmartDashBoardMaker\backend\metadata.db"

def check_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    print("--- DATASETS ---")
    rows = cursor.execute("SELECT id, name, is_virtual FROM datasets").fetchall()
    for r in rows:
        print(dict(r))
        
    print("\n--- SAVED QUERIES ---")
    rows = cursor.execute("SELECT id, name FROM saved_queries").fetchall()
    for r in rows:
        print(dict(r))
    
    conn.close()

if __name__ == "__main__":
    check_db()

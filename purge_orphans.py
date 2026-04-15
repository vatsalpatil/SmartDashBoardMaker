import sqlite3
import os

db_path = r"c:\Users\Vatsal\Document\VSCodeFiles\PythonCode\SmartDashBoardMaker\Backend\metadata.db"

if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    # Delete orphan promoted datasets (virtual datasets that don't have a matching saved_query)
    # These are the ones bothering the UI
    cursor = conn.cursor()
    cursor.execute("""
        DELETE FROM datasets 
        WHERE is_virtual = 1 
        AND id NOT IN (SELECT id FROM saved_queries)
    """)
    print(f"Purged {cursor.rowcount} orphan virtual datasets.")
    conn.commit()
    conn.close()
else:
    print("Database not found.")

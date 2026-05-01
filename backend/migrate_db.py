import sqlite3
import os

DB_PATH = "metadata.db"

def migrate():
    if not os.path.exists(DB_PATH):
        print(f"Error: {DB_PATH} not found.")
        return

    conn = sqlite3.connect(DB_PATH)
    try:
        tables = ["datasets", "db_connections", "saved_queries", "visualizations", "dashboards"]
        for table in tables:
            try:
                print(f"Migrating table: {table}")
                conn.execute(f"ALTER TABLE {table} ADD COLUMN user_id TEXT")
            except sqlite3.OperationalError as e:
                if "duplicate column name" in str(e):
                    print(f"Column user_id already exists in {table}")
                else:
                    print(f"Error migrating {table}: {e}")
        
        conn.commit()
        print("Migration completed successfully.")
    except Exception as e:
        print(f"Critical Migration Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()

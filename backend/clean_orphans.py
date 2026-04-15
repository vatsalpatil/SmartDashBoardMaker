import sqlite3

conn = sqlite3.connect('backend/metadata.db')
conn.row_factory = sqlite3.Row

# Find all datasets named 'PNLData' that are virtual but do NOT exist in saved_queries
orphan_datasets = conn.execute("""
    SELECT id FROM datasets 
    WHERE name = 'PNLData' 
      AND is_virtual = 1 
      AND id NOT IN (SELECT id FROM saved_queries)
""").fetchall()

print("Found orphaned PNLData virtual datasets:", len(orphan_datasets))

for row in orphan_datasets:
    print(f"Deleting orphaned dataset {row['id']}")
    conn.execute("DELETE FROM datasets WHERE id = ?", (row['id'],))

conn.commit()
conn.close()

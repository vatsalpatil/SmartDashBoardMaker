import sqlite3

conn = sqlite3.connect('backend/metadata.db')
conn.row_factory = sqlite3.Row

print("ALL SAVED QUERIES:")
for row in conn.execute("SELECT id, name FROM saved_queries").fetchall():
    print(f"'{row['name']}' ({row['id']})")

print("\nALL DATASETS:")
for row in conn.execute("SELECT id, name, is_virtual FROM datasets").fetchall():
    print(f"'{row['name']}' ({row['id']}) virtual={row['is_virtual']}")

conn.close()

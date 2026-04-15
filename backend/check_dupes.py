import sqlite3

conn = sqlite3.connect('backend/metadata.db')
conn.row_factory = sqlite3.Row

print("Datasets:")
for row in conn.execute("SELECT id, name, is_virtual FROM datasets WHERE name = 'PNLData'").fetchall():
    print(dict(row))

print("\nSaved Queries:")
for row in conn.execute("SELECT id, name FROM saved_queries WHERE name = 'PNLData'").fetchall():
    print(dict(row))

conn.close()

import sqlite3
import json

conn = sqlite3.connect('backend/metadata.db')
conn.row_factory = sqlite3.Row

data = {
    'queries': [dict(r) for r in conn.execute("SELECT id, name FROM saved_queries").fetchall()],
    'datasets': [dict(r) for r in conn.execute("SELECT id, name, is_virtual FROM datasets").fetchall()]
}

with open('backend/dump.json', 'w') as f:
    json.dump(data, f, indent=2)

conn.close()

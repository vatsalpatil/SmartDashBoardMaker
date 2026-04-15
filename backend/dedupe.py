import sqlite3
import json

conn = sqlite3.connect('backend/metadata.db')
conn.row_factory = sqlite3.Row

dupes = conn.execute("SELECT id, name, created_at FROM saved_queries WHERE name = 'PNLData' ORDER BY created_at ASC").fetchall()
print("Found", len(dupes), "saved queries named PNLData")

if len(dupes) > 1:
    # Keep the latest, delete the older ones
    for row in dupes[:-1]:
        print("Deleting older duplicate:", row['id'], row['created_at'])
        conn.execute("DELETE FROM saved_queries WHERE id = ?", (row['id'],))
        conn.execute("DELETE FROM datasets WHERE id = ?", (row['id'],))
    
    conn.commit()
    print("Deleted duplicates.")
else:
    print("No duplicates found.")

conn.close()

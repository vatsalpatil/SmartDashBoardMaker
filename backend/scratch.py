import sqlite3

c = sqlite3.connect('metadata.db')
c.row_factory = sqlite3.Row
row = c.execute("SELECT file_path, is_virtual, sql_query FROM datasets WHERE id='e875cefe-c048-4cb4-abbf-61b4809794a8'").fetchone()
print(dict(row))

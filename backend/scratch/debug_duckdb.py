import duckdb
import os
import re

def test_sql():
    con = duckdb.connect(database=':memory:')
    # Create a dummy table
    con.execute("CREATE TABLE test_table (city TEXT, profit DOUBLE)")
    con.execute("INSERT INTO test_table VALUES ('New York', 100), ('London', 200)")
    
    # Try a query similar to what sqlBuilder produces
    # Example: SELECT "city", SUM("profit") AS "Total Profit" FROM test_table GROUP BY "city" ORDER BY "Total Profit" DESC
    sql = 'SELECT "city", SUM("profit") AS "Total Profit" FROM test_table GROUP BY "city" ORDER BY "Total Profit" DESC'
    print(f"Executing: {sql}")
    try:
        res = con.execute(sql).fetchall()
        print(f"Success: {res}")
    except Exception as e:
        print(f"Failed: {e}")

    # Try a query with the subquery wrapping like in queries.py
    paged_sql = f'SELECT * FROM ({sql}) AS q LIMIT 10 OFFSET 0'
    print(f"Executing paged: {paged_sql}")
    try:
        res = con.execute(paged_sql).fetchall()
        print(f"Success: {res}")
    except Exception as e:
        print(f"Failed paged: {e}")

if __name__ == "__main__":
    test_sql()

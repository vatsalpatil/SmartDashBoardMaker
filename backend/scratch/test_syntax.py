import duckdb

def test_sql(sql):
    con = duckdb.connect(database=':memory:')
    con.execute("CREATE TABLE test_table (city TEXT, profit DOUBLE)")
    con.execute("CREATE VIEW dataset_view AS SELECT * FROM test_table")
    print(f"Executing: {sql}")
    try:
        con.execute(sql)
        print("Success")
    except Exception as e:
        print(f"Failed: {e}")

# Test the exact patterns from sqlBuilder
print("--- Test 1: Quoted Alias with same name ---")
test_sql('SELECT "city", SUM("profit") AS "profit" FROM dataset_view GROUP BY "city" ORDER BY "profit" DESC LIMIT 5000')

print("--- Test 2: Multi-Sort ---")
test_sql('SELECT "city", SUM("profit") AS "Profit" FROM dataset_view GROUP BY "city" ORDER BY "city" ASC, "Profit" DESC LIMIT 5000')

print("--- Test 3: ILIKE ---")
test_sql("SELECT * FROM dataset_view WHERE \"city\" ILIKE '%London%' LIMIT 5000")

print("--- Test 4: IN clause ---")
test_sql("SELECT * FROM dataset_view WHERE \"city\" IN ('London', 'New York') LIMIT 5000")

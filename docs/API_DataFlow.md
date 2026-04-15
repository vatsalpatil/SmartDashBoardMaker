# 🔄 API & Data Flow Deep Dive

SmartDashBoard Maker leverages a powerful combination of **FastAPI**, **Polars**, and **DuckDB** to deliver a high-performance analytics experience. This document outlines how data flows through the system.

---

## ⚡ High-Level Data Flow

1. **Upload**: User uploads a `CSV/XLSX` file.
2. **Metadata Capture**: **Polars** scans the file and creates a dataset record in **SQLite**.
3. **Execution**: When a query is run, **DuckDB** registers the physical file path as a virtual table in memory.
4. **Rendering**: Results are returned as JSON, and **Recharts** translates that JSON into a visual SVG chart.

---

## 🛰️ Core API Endpoints

The API is structured into several routers for clarity. All routes are prefixed with `/api`.

### 📂 Datasets Router
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/datasets` | Upload a `CSV/XLSX` file. |
| `GET` | `/api/datasets` | List all available datasets. |
| `GET` | `/api/datasets/:id` | Get dataset metadata (name, type, columns). |
| `GET` | `/api/datasets/:id/preview`| Get a paginated preview of dataset rows. |
| `DELETE` | `/api/datasets/:id` | Delete a dataset and its physical file. |

### ⚡ Queries Router
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/queries/execute` | Execute raw SQL against a dataset via **DuckDB**. |
| `POST` | `/api/queries/save` | Save a SQL query for future use. |
| `GET` | `/api/queries/saved` | List all saved queries. |
| `GET` | `/api/queries/saved/:id` | Retrieve a specific saved query's details. |

### 📊 Visualizations Router
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/visualizations` | Create a new visualization configuration. |
| `GET` | `/api/visualizations` | List all built charts/KPIs. |
| `GET` | `/api/visualizations/:id` | Get a specific visualization config. |
| `PUT` | `/api/visualizations/:id` | Update an existing visualization's settings. |
| `DELETE` | `/api/visualizations/:id` | Delete a visualization. |

### 📟 Dashboards Router
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/dashboards` | Create a new dashboard layout. |
| `GET` | `/api/dashboards` | List all saved dashboards. |
| `GET` | `/api/dashboards/:id` | Get a specific dashboard layout. |
| `PUT` | `/api/dashboards/:id` | Update the positions/sizes of dashboard widgets. |

---

## 🏗️ Data Processing Workflow (The Magic)

### 1. Polars Integration (Ingestion)
When a file is uploaded, the **`data_service.py`** uses Polars:
```python
import polars as pl
df = pl.read_csv(filepath)
# Polars automatically detects types for each column
metadata = {
    "columns": df.columns,
    "dtypes": [str(t) for t in df.dtypes]
}
```

### 2. DuckDB Integration (Querying)
When you run a SQL query, the **`query_service.py`** registers the file as a virtual table:
```python
import duckdb
con = duckdb.connect(database=':memory:')
# Register the CSV file as a table named 'source_table'
con.execute(f"CREATE VIEW source_table AS SELECT * FROM read_csv_auto('{filepath}')")
# Execute user's query
results = con.execute(user_sql).fetchdf()
```
This is **extremely fast** because DuckDB queries the file directly using vectorized execution engines without needing to load the entire dataset into a database server first.

---

## 🔐 Configuration Persistence
All your metadata (dataset info, SQL queries, chart configs, dashboard filters) is saved in a local **SQLite** database (`metadata.db`). This ensures your work is persistent across sessions and requires zero configuration to get started.

---

## 📢 Frontend Communication
The frontend uses **Axios** to communicate with these endpoints. It handles:
1. **JSON Transformation**: Converting raw query results into the format required by **Recharts**.
2. **Error Handling**: Displaying clear, user-friendly error messages if a SQL query fails or an upload is invalid.
3. **State Updates**: Reflecting saved changes immediately in the UI.

# ⚙️ SmartDashBoard Maker Backend

The high-performance core of SmartDashBoard Maker, built with FastAPI, DuckDB, and Polars. This backend is designed for high-concurrency data processing and provides a robust API for the frontend builder.

---

## ⚡ Key Architectural Pillars

### 1. The OLAP Engine (DuckDB + Polars)
Instead of relying on a traditional central database for large datasets, we use:
*   **DuckDB**: An analytical database that runs in-process. It allows us to execute complex SQL queries directly on CSV/Excel files with extreme speed.
*   **Polars**: Used for lightning-fast reading of raw files, automatic schema detection, and data frame manipulations before SQL execution.

### 2. Metadata Persistence (SQLite)
While the analytics happen in DuckDB, all project configurations (Dashboards, Saved Charts, API Configurations, Dataset Registry) are stored in a dedicated SQLite database (`metadata.db`).

### 3. API Proxy Layer
To enable the **API Data Engine** to fetch data from external servers that might not support CORS, the backend includes a dedicated proxy router. This ensures that any public API can be tethered to a dashboard without client-side limitations.

---

## 📂 Deep Dive: Project Structure

```text
backend/
├── models/
│   ├── database.py     # SQLAlchemy engine and session setup
│   └── schemas.py      # Pydantic & SQLAlchemy models for all entities
├── routers/
│   ├── datasets.py     # File upload and dataset registry endpoints
│   ├── queries.py      # Saved SQL queries and execution logic
│   ├── visualizations.py # Chart configuration and data fetching
│   ├── dashboards.py   # Dashboard layout and widget management
│   └── proxy.py        # CORS-bypass for the API Data Engine
├── services/
│   ├── data_service.py # Core logic for parsing CSV/Excel with Polars
│   ├── query_service.py # DuckDB SQL execution logic
│   └── storage_service.py # Handles file writes and directory cleanup
├── uploads/            # Physical storage for data files
└── main.py             # FastAPI entry point & middleware config
```

---

## 🛠️ Technology Stack

| Library | Purpose |
| :--- | :--- |
| **FastAPI** | Fast, asynchronous web framework |
| **DuckDB** | Analytical SQL engine (In-process OLAP) |
| **Polars** | Fast data frames for schema inference |
| **SQLAlchemy** | ORM for metadata storage (SQLite) |
| **Pydantic** | Data validation and documentation |
| **Uvicorn** | High-performance ASGI server |

---

## 🏁 Getting Started

### Prerequisites
- Python 3.9 or higher

### Installation
1.  **Create Virtual Environment**:
    ```bash
    python -m venv .venv
    # Windows: .venv\Scripts\activate
    # Unix: source .venv/bin/activate
    ```
2.  **Install Dependencies**:
    ```bash
    pip install -r requirements.txt
    ```

### Running the Server
```bash
python main.py
```
The server will start on `http://localhost:8000`.

### Interactive API Docs
Visit `http://localhost:8000/docs` to explore and test endpoints directly via Swagger UI.

---

## 🧪 Development & Testing
*   **Database Migrations**: We use auto-initialization for the SQLite database. If you change the `models`, simply delete `metadata.db` and it will be recreated on the next startup.
*   **Adding Routers**: Create a new file in `routers/` and register it in `main.py` using `app.include_router()`.

---
**The Engine for Modern Data Analytics** ⚙️

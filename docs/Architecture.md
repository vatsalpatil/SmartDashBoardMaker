# 🏛️ Architecture & System Design

SmartDashBoard Maker is architected as a modern, decoupled web application. It features a robust Python/FastAPI backend and a highly responsive React frontend.

## 🏗️ Overall Architecture

The application focuses on efficient data processing and metadata management.

```mermaid
graph TD
    User([User]) <--> Frontend[React Frontend (Vite)]
    Frontend <--> API[FastAPI Backend]
    subgraph "Backend Engines"
        API <--> Polars[Polars: Data Parsing]
        API <--> DuckDB[DuckDB: In-Memory SQL]
        API <--> SQLite[SQLite: Metadata Database]
    end
    API <--> Storage[uploads/: CSV/XLSX Files]
```

## 🧱 Key Components

### 1. **React Frontend (Vite)**
- **Routing**: Handled by `react-router-dom` for a smooth, single-page experience.
- **State Management**: Local component state and custom hooks for data fetching.
- **UI Framework**: **Tailwind CSS** for rapid styling and a consistent design system.
- **Visualization Engineering**: **Recharts** for building interactive, responsive SVG charts.
- **Data Grids**: **TanStack Table** for rendering high-performance data previews.

### 2. **FastAPI Backend (Python)**
- **API Framework**: **FastAPI** for its speed, automatic documentation (Swagger), and asynchronous capabilities.
- **Data Processing**:
    - **Polars**: Used for exceptionally fast reading and preliminary analysis of uploaded CSV/XLSX files.
    - **DuckDB**: For executing SQL queries directly against data files in memory. This eliminates the need for a dedicated data warehouse.
- **Configuration & Metadata**: **SQLite** with **SQLAlchemy** is used to persist project definitions, chart configurations, and dashboard layouts.

## 🔄 Data Lifecycle & Flow

1. **Ingestion**:
   - A user uploads a file (`CSV` or `XLSX`).
   - The file is saved to the `backend/uploads/` directory.
   - **Polars** scans the file to detect column types and basic metadata.
   - Dataset metadata is saved to the SQLite `metadata.db`.

2. **Exploration & Querying**:
   - The user selects a dataset.
   - The frontend sends a SQL query to the backend.
   - The backend registers the uploaded file as a temporary **DuckDB View**.
   - The query is executed. Results are returned as JSON.

3. **Visualization**:
   - The user creates a chart configuration (columns to use, aggregation types).
   - This "Visualization Config" is saved in SQLite.
   - When the chart is rendered, the backend executes the corresponding query (SQL or auto-generated aggregation) and returns the data for **Recharts**.

4. **Reporting**:
   - Multiple visualizations are grouped into a "Dashboard".
   - The dashboard's layout (positions, sizes) and its associated widget IDs are saved in SQLite.

## 🐘 Database Schema

The core metadata lives in a SQLite database with the following primary tables:

- **`datasets`**: `id`, `name`, `type`, `filepath`, `created_at`.
- **`saved_queries`**: `id`, `name`, `sql`, `dataset_id`, `created_at`.
- **`visualizations`**: `id`, `name`, `type`, `config` (JSON field), `dataset_id`.
- **`dashboards`**: `id`, `name`, `layout` (JSON field), `created_at`.

---

## 🏗️ Folder Structure Details

See the [Modules & Components Guide](./Modules.md) for a deep dive into each folder's responsibilities.

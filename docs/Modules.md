# 🧱 Modules & Components Breakdown

SmartDashBoard Maker's codebase is organized into several key modules, each with a specific responsibility. This guide breaks down the core folder structure of the backend and frontend.

---

## 🛠️ Backend (Python/FastAPI)

The backend code is designed with a separation of concerns: **Models** for data structures, **Services** for logic, and **Routers** for endpoints.

### 1. `main.py`
- Core FastAPI entry point.
- **Role**: Configures the FastAPI app, manages global CORS settings, and routes HTTP requests.
- **Responsibilities**: Initializing the app and including all the routers.

### 2. `models/`
- **`database.py`**: Manages the SQLite database connection, engine, and session.
- **`schemas.py`**:
    - Defines **Pydantic** models used for API request/response validation.
    - Defines **SQLAlchemy** ORM models for project persistence (metadata storage).
    - **Responsibilities**: Data modeling and type validation.

### 3. `routers/`
- **`datasets.py`**: Handles CSV/Excel uploads, dataset deletions, and metadata retrieval.
- **`queries.py`**: Manages saved queries and coordinates SQL execution.
- **`visualizations.py`**: CRUD operations for managing chart configurations.
- **`dashboards.py`**: Manages dashboard layout creation and updates.

### 4. `services/`
- **`data_service.py`**:
    - The heart of data handling.
    - Uses **Polars** to read data files and infer schemas.
- **`query_service.py`**:
    - Executes SQL using **DuckDB**.
    - Registers uploaded files as virtual tables dynamically.
- **`storage_service.py`**:
    - Manages file system interactions (`uploads/` folder).
    - Handles SQLAlchemy-based persistence for all your project metadata.

---

## 🏗️ Frontend (React/Vite)

The frontend is a modern React application with a component-based architecture.

### 1. `App.jsx`
- The central navigation and layout hub.
- Defines all the application routes using `react-router-dom`.
- Connects global layout components like the `Sidebar` and `Header`.

### 2. `components/`
Small, reusable bits of UI:
- **`layout/`**: Header, Sidebar, and other global UI containers.
- **`datasets/`**: Components for file uploading, data grid previews, and dataset selection.
- **`visualizations/`**: The "Chart Builder" engine, including real-time chart previews (using Recharts).
- **`dashboard/`**: The grid container and widget wrappers for layout management.
- **`query/`**: The SQL workbench components (editor, result table, saved query list).

### 3. `pages/`
Each page corresponds to a main route in the application:
- **`UploadPage.jsx`**: The starting point for users to add new data.
- **`DatasetListPage.jsx`**: A portal to manage and explore all your uploaded datasets.
- **`DatasetDetailPage.jsx`**: A detailed view of a single dataset with preview capabilities.
- **`QueryPage.jsx`**: The dedicated SQL workbench for power users.
- **`VisualizationPage.jsx`**: The interactive chart-building workspace.
- **`DashboardPage.jsx`**: The final view for assembling and viewing your reports.

### 4. `lib/`
- **`api.js`**: Contains the Axios API client configuration, handling all outgoing requests to the backend.
- **`utils.js`**: Reusable helper functions for data formatting, date handling, etc.

---

## 📦 Root Level Files

- **`metadata.db`**: The SQLite database where all project metadata (dataset info, saved charts, dashboard layouts) is stored.
- **`uploads/`**: A storage directory where raw data files (CSV, XLSX) are kept.
- **`sample_sales.csv`**: A demonstration file for testing the system.

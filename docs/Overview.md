# 📖 Project Overview

**SmartDashBoard Maker** is a comprehensive, open-source data analytics and visualization platform designed for modern data workflows. It bridges the gap between raw data files and beautiful, interactive dashboards.

## 🎯 Our Mission

- **Simplicity**: Make data visualization accessible to non-technical users.
- **Power**: Provide advanced SQL capabilities for data enthusiasts and analysts.
- **Speed**: Leverage **Polars** and **DuckDB** for exceptionally fast in-memory query processing.

## 🔥 Key Components

### 1. 📂 Data Ingestion (Datasets)
Upload raw data files (CSV, XLSX) directly.
- **Smart Schema Detection**: Polars automatically infer data types (numbers, dates, strings).
- **Virtual Tables**: Your files are instantly registered as virtual tables in a DuckDB session for SQL querying.

### 2. ⚡ SQL Workbench (Queries)
A playground for those who love to write code.
- **CodeMirror Integration**: Full syntax highlighting and a sleek, developer-friendly editor.
- **Persistence**: Save your favorite queries for reuse or for powering future visualizations.

### 3. 🏗️ Visualization Builder (Charts)
Transform query results into stunning visual reports.
- **No-Code Interface**: Select column mappings and aggregations (SUM, AVG, etc.) with simple dropdowns.
- **Recharts Integration**: Beautiful, interactive charts including Bar, Line, Area, Pie, and KPI cards.
- **Preview Mode**: See your chart come to life in real-time as you tweak configurations.

### 4. 📟 Dashboard Engine
Assemble your visualizations into cohesive, meaningful layouts.
- **Grid Layout**: Fully customizable, drag-and-drop dashboard grid (powered by `react-grid-layout`).
- **Global Context**: Interactive filters and cross-widget coordination to explore data deeply.

## 🏛️ High-Level Architecture

```mermaid
graph TD
    A[Frontend (React/Vite)] -- API Calls --> B[Backend (FastAPI)]
    B -- Data Handling --> C[Polars Engine]
    B -- SQL Execution --> D[DuckDB Session]
    B -- Configuration Persistence --> E[SQLite (metadata.db)]
    A -- Visualization Rendering --> F[Recharts UI]
```

## 🛠️ Tech Stack Roundup

- **Frontend**: React, Vite, Tailwind CSS, Recharts, TanStack Table, CodeMirror.
- **Backend**: Python, FastAPI, Polars, DuckDB.
- **Database**: SQLite (SQLAlchemy).
- **Tooling**: Axios, Pydantic, Vite.

---

## ⏭️ Next Steps

- [🏗️ Deep Dive into Architecture](./Architecture.md)
- [🛠️ Setup and Installation](./Setup_Installation.md)
- [📈 Usage Guide](./Usage_Guide.md)

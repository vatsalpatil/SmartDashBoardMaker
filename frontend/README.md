# ⚛️ SmartDashBoard Maker Frontend

A high-performance, responsive React application built with Vite and Tailwind CSS. This frontend serves as the command center for the SmartDashBoard Maker ecosystem, providing a seamless interface for data ingestion, SQL analysis, and visual storytelling.

---

## 🎨 Design Philosophy
*   **Premium Aesthetics**: Dark-mode first design with vibrant accents (Emerald, Violet, Accent-Blue).
*   **Glassmorphism**: Subtle backgrounds and overlays for a modern, industry-standard feel.
*   **Micro-interactions**: Smooth transitions and animations powered by Framer Motion and custom CSS animations.
*   **Responsive Layout**: Fully adaptive sidebar and grid layouts that work on any screen size.

---

## 🏗️ Core Frontend Modules

### 🔌 API Data Engine Panel
A self-contained workflow panel that handles complex API integrations:
*   **Playground Component**: A professional request builder (Methods, Auth, Headers, Params).
*   **Response Viewer**: An interactive JSON explorer with automated path extraction logic.
*   **Schema Mapper**: A drag-and-drop interface to refine columns and data types.
*   **Data Explorer**: Real-time filtering and sorting engine for previewing transformed data.

### 📊 Visualization Builder
The engine behind the dashboard widgets:
*   **Dynamic Chart Configurator**: Real-time chart generation using **Recharts**.
*   **Smart Aggregation Logic**: Automatic calculation of metrics (SUM, AVG, COUNT) within the UI.
*   **Theming**: Synchronized color palettes across all visualizations for a cohesive dashboard look.

### 📋 SQL Workbench
A powerhouse for data analysts:
*   **CodeMirror 6 Integration**: High-performance editor with SQL syntax highlighting and auto-completion.
*   **Result Grids**: Powered by **TanStack Table** for virtualization and fast rendering of large query results.

---

## 📂 Project Structure (Frontend Deep Dive)

```text
src/
├── components/
│   ├── api/            # Professional API Data Engine modules
│   ├── layout/         # Sidebar, Header, and Page wrappers
│   ├── ui/             # Reusable Atoms (Button, Input, Card, Modal, Toast)
│   ├── visualizations/ # Chart Builders and KPI Widgets
│   └── dashboards/     # Grid layout and persistence logic
├── pages/
│   ├── DatasetsPage.jsx      # Central hub for data management
│   ├── QueryPage.jsx         # SQL Workbench interface
│   ├── VisualizationPage.jsx # The chart builder workspace
│   └── DashboardPage.jsx     # The final report composer
├── lib/
│   ├── api.js          # Axios configuration and API endpoints
│   ├── ThemeContext.js # Global state for theming
│   └── utils.js        # Formatting, math, and data helpers
└── App.jsx             # Main router and provider configuration
```

---

## 🛠️ Technology Stack

| Library | Purpose |
| :--- | :--- |
| **Vite** | Blazing fast build tool and HMR server |
| **React 18** | UI framework with Concurrent Mode support |
| **Tailwind CSS** | Styling engine with custom design tokens |
| **Recharts** | Composable SVG chart library |
| **TanStack Table** | Headless data grid utility |
| **Lucide React** | Consistent, beautiful iconography |
| **React Router** | Client-side routing with clean URLs |

---

## ⚡ Setup & Development

### Installation
```bash
npm install
```

### Run Locally
```bash
npm run dev
```
The app will be available at `http://localhost:5173`.

### Environment Context
The frontend expects the FastAPI backend to be running at `http://localhost:8000`. If you use the provided **API Proxy** in the Data Engine, it will tunnel requests through the backend to avoid CORS limitations.

---

## 🚀 Building for Production
To generate a production-ready bundle:
```bash
npm run build
```
The output will be in the `/dist` directory.

---
**Powered by React & Designed for Insight** ⚡

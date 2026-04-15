# 🏗️ Front End Components (React/Vite)

This folder contains the reusable UI bits that make up SmartDashBoard Maker. Each subfolder describes a specific functional area.

---

## 📂 Folder Breakdown

### 1. `layout/`
- **`Header.jsx`**: Global top-level navigation and logo.
- **`Sidebar.jsx`**: Primary sidebar for navigating between pages.
- **`Layout.jsx`**: Main wrapper that determines the application's overall structure.

### 2. `datasets/`
- **`UploadArea.jsx`**: Drag-and-drop file upload zone.
- **`DatasetList.jsx`**: List or grid of all available data files.
- **`DataPreview.jsx`**: A high-performance table for examining dataset rows.

### 3. `query/`
- **`SqlEditor.jsx`**: The CodeMirror-based SQL workbench.
- **`ResultTable.jsx`**: The interactive results view for queries.
- **`SavedQueryList.jsx`**: A sidebar component for managing favorite SQL snippets.

### 4. `visualizations/`
- **`ChartBuilder.jsx`**: The "no-code" interactive workspace for creating charts.
- **`ChartPreview.jsx`**: A dynamic Recharts-based chart viewer.
- **`KpiCard.jsx`**: A simple, high-level metric card for important numbers.

### 5. `dashboard/`
- **`DashboardGrid.jsx`**: The responsive grid container for visualization layouts.
- **`WidgetWrapper.jsx`**: A draggable, resizable box that holds individual charts.
- **`FilterBar.jsx`**: Global filters for exploring data across the entire dashboard.

---

## 🏛️ Component Principles

- **Reusability**: Components should be generic enough to be used across different pages where appropriate.
- **Responsiveness**: Use **Tailwind CSS** utility classes to ensure every component looks great on all screen sizes.
- **Interactive**: Add hover states, loading skeletons, and clear feedback for user actions.

# 🛠️ Developer Guide (Contributing & Extending)

Welcome to the development guide for SmartDashBoard Maker! We're excited to have you as part of our community.

---

## 🏗️ Core Principles

- **Speed**: Use **Polars** and **DuckDB** for all data-heavy operations.
- **Simplicity**: Keep the UI clean and intuitive. Avoid adding unnecessary complexity to the user experience.
- **Performance**: Optimize for the frontend (Vite/React) and avoid re-rendering unnecessary components.

---

## 🏗️ Architecture Roundup

1. **Frontend**: Vite + React, Tailwind CSS, Recharts, TanStack Table.
2. **Backend**: FastAPI (Python), SQL Alchemy (SQLite).
3. **Data Engines**: Polars for reading/processing, DuckDB for executing SQL queries directly on files.

---

## 🏁 Setting Up the Project for Development

### 1. **Backend Development**
- **Virtual Environment**: Use `venv` or `conda` to manage Python packages.
- **Hot Reload**: Start the server with `uvicorn main:app --reload` to auto-restart when you change code.
- **Dependencies**: Any new libraries should be added to `requirements.txt`.

### 2. **Frontend Development**
- **Vite**: Use the development server (`npm run dev`) for instantaneous HMR (Hot Module Replacement).
- **Environment Variables**: Use `.env` files for managing API endpoints and other configurations.
- **Styling**: All styling should be done via **Tailwind CSS** utility classes.

---

## 🏗️ How to Extend SmartDashBoard Maker

### 🎨 Adding a New Chart Type
To add a new visualization (e.g., Radar Chart, Treemap):
1. **Frontend**:
    - Update the **Chart Builder** to include the new type in the selection dropdown.
    - Create a new component in `src/components/visualizations/` that renders the appropriate **Recharts** chart.
2. **Backend**:
    - Update the `schemas.py` if the new chart requires unique configuration fields.

### ⚡ Adding a New SQL Functionality
To add a new feature to the SQL workbench (e.g., data export, scheduled reports):
1. **Frontend**:
    - Update the `src/pages/QueryPage.jsx` to include the new button or UI element.
2. **Backend**:
    - Create an endpoint in `routers/queries.py` and a corresponding function in `services/query_service.py`.

---

## 🤝 How to Contribute

- **Report Bugs**: Use GitHub Issues to let us know if something isn't working as expected.
- **Suggest Features**: Share your ideas for new charts, data engines, or UI improvements.
- **Submit Pull Requests**:
    - Fork the repository.
    - Create a new branch for your feature or bug fix.
    - Write clean, documented code.
    - Submit your PR with a clear description of the changes.

---

## 🏛️ Project Maintenance

- **Formatting**: We follow standard Python (Black/PEP8) and JavaScript (Prettier/ESLint) formatting guidelines.
- **Testing**: We're currently building out our automated test suite. High-quality PRs with tests are always appreciated.

---

## 🏁 Happy Coding!

If you have any questions, feel free to reach out to the project maintainers.

# 🛠️ FAQs & Troubleshooting

Find answers to common questions and solutions to general issues encountered while using SmartDashBoard Maker.

---

## ❓ Frequently Asked Questions (FAQs)

### 1. **What file formats are supported?**
SmartDashBoard Maker currently supports:
- **CSV** (.csv)
- **Excel** (.xlsx, .xls)
- *Note: Support for JSON and Parquet is planned.*

### 2. **Is there a file size limit?**
The default recommended limit is **200MB**. Large files (e.g., 500MB+) may lead to performance issues in the browser, but our **Polars/DuckDB** backend handles them efficiently.

### 3. **Can I use SQL on my uploaded files?**
Yes! Once a file is uploaded, it is registered as a virtual table. You can use the **SQL Workbench** to write standard SQL queries against it.

### 4. **Is my data stored securely?**
Currently, data is stored **locally** on the machine running the backend. The metadata (configurations) is saved in a local SQLite file. We do not transmit your data to any external cloud services.

### 5. **Can I share my dashboards?**
As of now, dashboards are local to the installation. We are working on a multi-user, multi-tenant version with role-based access control.

---

## 🛠️ Troubleshooting

### ❌ Problem: The application won't start.
- **Solution**:
    - Ensure both the **Backend (Python)** and **Frontend (Node.js)** are running simultaneously.
    - Check that ports **8000** and **5173** are not being used by other applications.
    - Ensure you've installed all requirements with `pip install -r requirements.txt` and `npm install`.

### ❌ Problem: Uploaded file is showing "Invalid Schema" or "Cannot Parse."
- **Solution**:
    - Ensure your CSV has a **header row**.
    - Check for special characters in column names (e.g., emojis, unusual symbols).
    - If it's an Excel file, ensure the first sheet contains the data you wish to analyze.

### ❌ Problem: SQL query returns "Internal Server Error."
- **Solution**:
    - Use `source_table` as the table name in your queries.
    - Ensure column names in your SQL match the data's headers exactly (including case-sensitivity).
    - Check the backend console for more detailed error messages from **DuckDB**.

### ❌ Problem: Charts are not rendering correctly.
- **Solution**:
    - Confirm you have selected numeric columns for the **Y-Axis**.
    - Ensure there are no null or non-numeric values in the columns used for aggregation.
    - Try refreshing the page and re-selecting the dataset.

---

## 🏗️ Still Have Issues?

- **Contact Support**: Reach out to the project maintainers via the GitHub Issue tracker.
- **Community Forum**: Join our community discussions to ask questions and share your feedback.

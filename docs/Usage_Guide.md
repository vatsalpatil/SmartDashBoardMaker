# 📉 Usage Guide

Follow this step-by-step guide to create your first stunning dashboard with SmartDashBoard Maker.

---

## ⚡ Step 1: Upload Your Data

1. Click on **"Add Dataset"** in the sidebar.
2. Drag and drop your `CSV` or `Excel` file.
3. Once uploaded, you'll see a **Data Preview**.
4. Review the columns and ensure everything looks correct.
5. Your dataset is now registered and ready to be explored.

---

## ⚡ Step 2: Explore Your Data (Optional)

1. Go to the **"Datasets"** page and select your file.
2. Click on **"Explore"** to see a more detailed view of the first 500 rows.
3. Use the search and filter features to get a feel for your data's schema.

---

## ⚡ Step 3: Write Your First SQL Query

1. Click on **"SQL Workbench"** in the sidebar.
2. Select your dataset from the dropdown.
3. Write a standard SQL query:
   ```sql
   SELECT product_category, SUM(revenue) as total_revenue
   FROM source_table
   GROUP BY product_category
   ORDER BY total_revenue DESC
   ```
4. Click **"Run"** to see the results.
5. Save your query by giving it a name (e.g., "Revenue by Category").

---

## ⚡ Step 4: Build a Visualization (Chart)

1. Navigate to the **"Create Chart"** page.
2. Select the dataset or a saved query as your source.
3. Choose a **Chart Type** (Bar, Line, Area, Pie, or KPI).
4. **Configure Your Axes**:
   - **X-Axis**: Select a categorical column (e.g., `Date` or `Category`).
   - **Y-Axis**: Select a numeric column (e.g., `Sales`).
   - **Aggregation**: Choose `SUM`, `AVG`, `COUNT`, `MIN`, or `MAX`.
5. Preview your chart in real-time.
6. Click **"Save Chart"** to add it to your library.

---

## ⚡ Step 5: Assemble Your Dashboard

1. Click on **"Dashboards"** and then **"Create New Dashboard"**.
2. Give your dashboard a title and description.
3. Click **"Add Widget"** and select the charts you created.
4. **Arrange Your Widgets**:
   - Drag widgets to move them.
   - Resize widgets by dragging their bottom-right corner.
5. Click **"Save Layout"** to persist your dashboard.

---

## ⚡ Step 6: Share and Explore

1. Open your saved dashboard at any time to see the latest data.
2. Use global filters (if configured) to drill down into specific date ranges or categories.
3. Share your dashboard results with your team!

---

## 🚩 Tips for Success

- **Clean Your Data First**: Ensure your numeric columns don't contain non-numeric characters for the best experience.
- **Start Simple**: Build several small charts before assembling a complex dashboard.
- **Use KPIs**: Add simple KPI cards for high-level metrics like "Total Revenue" or "Average Order Value."

---

## 🕵️ Need Help?

- [🏗️ Troubleshooting & FAQs](./FAQs_Troubleshooting.md)
- [📖 Architecture Overview](./Architecture.md)

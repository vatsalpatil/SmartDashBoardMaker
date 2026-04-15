# 🛠️ Setup & Installation Guide

This guide will walk you through setting up SmartDashBoard Maker on your local machine for development or personal use.

---

## 🏗️ Prerequisites

Ensure you have the following installed:
- **Python 3.10+** (Recommend using a virtual environment)
- **Node.js 18+** (LTS version)
- **npm** (comes with Node.js) or **yarn**

---

## 🛠️ Step 1: Clone the Repository

```bash
git clone https://github.com/vatsal/SmartDashBoardMaker.git
cd SmartDashBoardMaker
```

---

## 🛠️ Step 2: Backend Setup (Python/FastAPI)

We recommend using a virtual environment to manage dependencies:

```bash
cd backend
# Create a virtual environment
python -m venv .venv
# Activate it (Windows)
.venv\Scripts\activate
# Activate it (Unix/macOS)
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI server
uvicorn main:app --reload --port 8000
```
- The backend will be available at: `http://localhost:8000`
- API documentation (Swagger) is at: `http://localhost:8000/docs`

---

## 🛠️ Step 3: Frontend Setup (React/Vite)

Now, in a new terminal window:

```bash
cd frontend
# Install dependencies
npm install

# Start the development server
npm run dev
```
- The frontend will be available at: `http://localhost:5173`

---

## 🛠️ Step 4: Verify the Installation

1. Open `http://localhost:5173` in your browser.
2. You should see the SmartDashBoard Maker sidebar and header.
3. Use the **Upload Data** page to upload the `sample_sales.csv` file from the project root.
4. If the upload is successful and you see a data preview, your setup is complete!

---

## 🐳 Running with Docker (Advanced)

*Note: Coming soon. We are currently working on a production-ready Docker Compose setup.*

---

## 🏗️ Common Troubleshooting

- **CORS Errors**: Ensure the backend is running on port 8000 and the frontend on port 5173.
- **Port Conflicts**: If port 8000 or 5173 is already in use, you can change them in the respective configuration files (`backend/main.py` and `frontend/vite.config.js`).
- **Missing Dependencies**: If you encounter a `ModuleNotFoundError`, double-check that you have activated your virtual environment and installed all requirements.

---

## 🏗️ Next Steps

- [📖 Read the Usage Guide](./Usage_Guide.md)
- [🏗️ Explore the Architecture](./Architecture.md)

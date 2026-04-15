"""
SmartDashBoard Maker - FastAPI Backend
Data analytics platform with DuckDB + Polars.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from models.database import init_db
from routers import datasets, queries, visualizations, dashboards, external_sources, proxy


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database on startup."""
    init_db()
    yield


app = FastAPI(
    title="SmartDashBoard Maker",
    description="Data analytics platform - upload datasets, query with SQL, build visualizations & dashboards",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS for frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(datasets.router)
app.include_router(queries.router)
app.include_router(visualizations.router)
app.include_router(dashboards.router)
app.include_router(external_sources.router)
app.include_router(proxy.router)


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "SmartDashBoard Maker API is running"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

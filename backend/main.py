"""
SmartDashBoard Maker - FastAPI Backend
Data analytics platform with DuckDB + Polars + JWT Auth.
"""

import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Load .env before anything else reads env vars
load_dotenv()

from models.database import init_db
from auth.tidb_db import init_tidb_auth
from auth.router import router as auth_router
from routers import (
    datasets,
    queries,
    visualizations,
    dashboards,
    external_sources,
    proxy,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize databases on startup."""
    init_db()            # SQLite metadata tables
    init_tidb_auth()     # TiDB users table
    yield


app = FastAPI(
    title="SmartDashBoard Maker",
    description="Data analytics platform - upload datasets, query with SQL, build visualizations & dashboards",
    version="2.0.0",
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

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth_router)          # /api/auth/*
app.include_router(datasets.router)
app.include_router(queries.router)
app.include_router(visualizations.router)
app.include_router(dashboards.router)
app.include_router(external_sources.router)
app.include_router(proxy.router)


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "SmartDashBoard Maker API is running", "version": "2.0.0"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

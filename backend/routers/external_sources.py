"""
External Sources router: URL imports and database connections.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List

from services.external_source_service import (
    probe_url_source,
    register_url_dataset,
    probe_db_connection,
    register_db_connection,
    list_db_connections,
    get_db_connection,
    delete_db_connection,
    register_db_table_as_dataset,
    refresh_dataset_metadata,
)

router = APIRouter(prefix="/api/external", tags=["external-sources"])


# ── URL Import ────────────────────────────────────────────────────────────────

class ProbeUrlRequest(BaseModel):
    url: str


class RegisterUrlRequest(BaseModel):
    url: str
    name: str


@router.post("/url/probe")
async def probe_url(req: ProbeUrlRequest):
    """Detect format and extract schema from a URL. No data stored."""
    try:
        result = probe_url_source(req.url)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"URL probe failed: {str(e)}")


@router.post("/url/register")
async def register_url(req: RegisterUrlRequest):
    """
    Register a URL as a dataset after probing.
    Stores only URL + schema metadata, no actual data.
    """
    try:
        probe = probe_url_source(req.url)
        dataset = register_url_dataset(req.url, req.name, probe)
        return dataset
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"URL registration failed: {str(e)}")


# ── Database Connections ──────────────────────────────────────────────────────

class DBConnectionRequest(BaseModel):
    name: str
    db_type: str
    host: Optional[str] = ""
    port: Optional[int] = 0
    database: str
    username: Optional[str] = ""
    password: Optional[str] = ""


class ProbeDBRequest(BaseModel):
    db_type: str
    host: Optional[str] = ""
    port: Optional[int] = 0
    database: str
    username: Optional[str] = ""
    password: Optional[str] = ""


@router.post("/db/probe")
async def probe_db(req: ProbeDBRequest):
    """Test DB connection and return list of tables with schema."""
    try:
        result = probe_db_connection(
            req.db_type, req.host, req.port,
            req.database, req.username, req.password
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB connection failed: {str(e)}")


@router.post("/db/connect")
async def connect_db(req: DBConnectionRequest):
    """Save a database connection (credentials stored, no data fetched)."""
    try:
        result = register_db_connection(
            req.name, req.db_type, req.host, req.port,
            req.database, req.username, req.password
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Connection registration failed: {str(e)}")


@router.get("/db/connections")
async def list_connections():
    """List all saved database connections."""
    connections = list_db_connections()
    return {"connections": connections, "total": len(connections)}


@router.get("/db/connections/{conn_id}")
async def get_connection(conn_id: str):
    """Get a specific database connection details."""
    try:
        return get_db_connection(conn_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/db/connections/{conn_id}")
async def delete_connection(conn_id: str):
    """Delete a database connection and its associated datasets."""
    try:
        delete_db_connection(conn_id)
        return {"message": "Connection deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/db/connections/{conn_id}/probe")
async def probe_existing_connection(conn_id: str):
    """Probe an existing saved connection to get fresh table list."""
    try:
        conn = get_db_connection(conn_id)
        result = probe_db_connection(
            conn["db_type"], conn["host"], conn["port"],
            conn["database"], conn["username"], conn["password"]
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Probe failed: {str(e)}")


class RegisterTableRequest(BaseModel):
    connection_id: str
    table_name: str
    dataset_name: str
    columns: List[dict]
    row_count: Optional[int] = 0


@router.post("/db/register-table")
async def register_table(req: RegisterTableRequest):
    """Register a specific DB table as a unified dataset object."""
    try:
        result = register_db_table_as_dataset(
            req.connection_id, req.table_name,
            req.dataset_name, req.columns, req.row_count
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Table registration failed: {str(e)}")


# ── Refresh ───────────────────────────────────────────────────────────────────

@router.post("/refresh/{dataset_id}")
async def refresh_dataset(dataset_id: str):
    """Refresh metadata for an external dataset (URL or DB)."""
    try:
        result = refresh_dataset_metadata(dataset_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Refresh failed: {str(e)}")

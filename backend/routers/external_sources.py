"""
External Sources router: URL imports and database connections.
"""
from fastapi import APIRouter, HTTPException, Depends
from auth.dependencies import get_current_user
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
    check_db_active,
)

router = APIRouter(prefix="/api/external", tags=["external-sources"])


# ── URL Import ────────────────────────────────────────────────────────────────

class ProbeUrlRequest(BaseModel):
    url: str
    method: Optional[str] = "GET"
    headers: Optional[dict] = None
    body: Optional[str] = None


class RegisterUrlRequest(BaseModel):
    url: str
    name: str
    method: Optional[str] = "GET"
    headers: Optional[dict] = None
    body: Optional[str] = None
    column_mapping: Optional[List[dict]] = None
    refresh_interval: Optional[int] = 0


@router.post("/url/probe")
def probe_url(req: ProbeUrlRequest):
    """Detect format and extract schema from a URL. No data stored."""
    try:
        result = probe_url_source(req.url, req.method, req.headers, req.body)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"URL probe failed: {str(e)}")


@router.post("/url/register")
def register_url(req: RegisterUrlRequest, current_user: dict = Depends(get_current_user)):
    """
    Register a URL as a dataset after probing.
    Stores only URL + schema metadata, no actual data.
    """
    try:
        # We re-probe to get the absolute source of truth format and file size
        result = probe_url_source(req.url, req.method, req.headers, req.body)
        
        # Override columns if mapping provided
        if req.column_mapping:
            result["columns"] = req.column_mapping

        config = {
            "method": req.method,
            "headers": req.headers,
            "body": req.body,
            "refresh_interval": req.refresh_interval
        }
        dataset = register_url_dataset(req.url, req.name, result, current_user["id"], config=config)
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
    ssl_mode: Optional[str] = "If available"
    ssl_key: Optional[str] = ""
    ssl_cert: Optional[str] = ""
    ssl_ca: Optional[str] = ""
    ssl_cipher: Optional[str] = ""
    ssl_key_content: Optional[str] = ""
    ssl_cert_content: Optional[str] = ""
    ssl_ca_content: Optional[str] = ""


class ProbeDBRequest(BaseModel):
    db_type: str
    host: Optional[str] = ""
    port: Optional[int] = 0
    database: str
    username: Optional[str] = ""
    password: Optional[str] = ""
    ssl_mode: Optional[str] = "If available"
    ssl_key: Optional[str] = ""
    ssl_cert: Optional[str] = ""
    ssl_ca: Optional[str] = ""
    ssl_cipher: Optional[str] = ""
    ssl_key_content: Optional[str] = ""
    ssl_cert_content: Optional[str] = ""
    ssl_ca_content: Optional[str] = ""


@router.post("/db/probe")
def probe_db(req: ProbeDBRequest):
    """Test DB connection and return list of tables with schema."""
    try:
        result = probe_db_connection(
            req.db_type, req.host, req.port,
            req.database, req.username, req.password,
            req.ssl_mode, req.ssl_key, req.ssl_cert, req.ssl_ca, req.ssl_cipher,
            req.ssl_key_content, req.ssl_cert_content, req.ssl_ca_content
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB connection failed: {str(e)}")


@router.post("/db/connect")
def connect_db(req: DBConnectionRequest, current_user: dict = Depends(get_current_user)):
    """Save a database connection (credentials stored, no data fetched)."""
    try:
        result = register_db_connection(
            req.name, req.db_type, req.host, req.port,
            req.database, req.username, req.password,
            req.ssl_mode, req.ssl_key, req.ssl_cert, req.ssl_ca, req.ssl_cipher,
            req.ssl_key_content, req.ssl_cert_content, req.ssl_ca_content, current_user["id"]
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Connection registration failed: {str(e)}")


@router.get("/db/connections")
def list_connections(current_user: dict = Depends(get_current_user)):
    """List all saved database connections."""
    connections = list_db_connections(current_user["id"])
    return {"connections": connections, "total": len(connections)}


@router.get("/db/connections/{conn_id}")
def get_connection(conn_id: str, current_user: dict = Depends(get_current_user)):
    """Get a specific database connection details."""
    try:
        return get_db_connection(conn_id, current_user["id"])
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/db/connections/{conn_id}")
def delete_connection(conn_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a database connection and its associated datasets."""
    try:
        delete_db_connection(conn_id, current_user["id"])
        return {"message": "Connection deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/db/connections/{conn_id}/probe")
def probe_existing_connection(conn_id: str, current_user: dict = Depends(get_current_user)):
    """Probe an existing saved connection to get fresh table list."""
    try:
        conn = get_db_connection(conn_id, current_user["id"])
        result = probe_db_connection(
            conn["db_type"], conn["host"], conn["port"],
            conn["database"], conn["username"], conn["password"],
            conn.get("ssl_mode", "If available"), conn.get("ssl_key", ""), 
            conn.get("ssl_cert", ""), conn.get("ssl_ca", ""), conn.get("ssl_cipher", "")
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
def register_table(req: RegisterTableRequest, current_user: dict = Depends(get_current_user)):
    """Register a specific DB table as a unified dataset object."""
    try:
        result = register_db_table_as_dataset(
            req.connection_id, req.table_name,
            req.dataset_name, req.columns, req.row_count, current_user["id"]
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Table registration failed: {str(e)}")


# ── Refresh ───────────────────────────────────────────────────────────────────

@router.post("/refresh/{dataset_id}")
def refresh_dataset(dataset_id: str, current_user: dict = Depends(get_current_user)):
    """Refresh metadata for an external dataset (URL or DB)."""
    try:
        result = refresh_dataset_metadata(dataset_id, current_user["id"])
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Refresh failed: {str(e)}")


@router.get("/db/active-check/{dataset_id}")
def db_active_check(dataset_id: str, current_user: dict = Depends(get_current_user)):
    """Check if the database for a given dataset is active/awake."""
    try:
        return check_db_active(dataset_id, current_user["id"])
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Active check failed: {str(e)}")

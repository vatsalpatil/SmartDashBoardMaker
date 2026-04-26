"""
External Source Service: handles URL-based dataset imports and database connections.
No actual data is stored - only metadata/connection details.
Data is fetched lazily on demand.
"""
import os
import re
import uuid
import json
import urllib.request
import urllib.parse
from typing import Dict, Optional, List
from datetime import datetime

import polars as pl
import duckdb

from models.database import get_db

# Supported URL formats
SUPPORTED_URL_FORMATS = {
    ".csv": "csv",
    ".tsv": "csv",
    ".xlsx": "excel",
    ".xls": "excel",
    ".parquet": "parquet",
    ".pq": "parquet",
    ".json": "json",
    ".jsonl": "json",
}

# DB type adapters - extend as needed
SUPPORTED_DB_TYPES = {"postgresql", "mysql", "sqlite", "duckdb"}

# Shared DuckDB connection (imported from data_service to avoid duplicate instances)
def _get_duckdb():
    from services.data_service import get_duckdb
    return get_duckdb()


# ─────────────────────────────────────────────────────────────────────────────
# URL Source
# ─────────────────────────────────────────────────────────────────────────────

def _detect_format_from_url(url: str) -> Optional[str]:
    """Detect file format from URL extension or path."""
    parsed = urllib.parse.urlparse(url)
    path = parsed.path.lower()
    for ext, fmt in SUPPORTED_URL_FORMATS.items():
        if path.endswith(ext):
            return fmt
    return None


def _detect_format_from_content_type(content_type: str) -> Optional[str]:
    """Detect file format from HTTP Content-Type header."""
    ct = content_type.lower()
    if "csv" in ct or "text/plain" in ct:
        return "csv"
    if "parquet" in ct or "octet-stream" in ct:
        return "parquet"
    if "json" in ct:
        return "json"
    if "excel" in ct or "spreadsheet" in ct or "xlsx" in ct:
        return "excel"
    return None


def probe_url_source(url: str) -> dict:
    """
    Probe a URL to detect format, validate compatibility, and extract schema.
    Does NOT store any data. Returns schema + metadata only.
    """
    # Detect format from URL
    fmt = _detect_format_from_url(url)

    # Try HTTP HEAD then GET (first 512KB) if format not detected
    try:
        req = urllib.request.Request(url, method="HEAD", headers={"User-Agent": "SmartDashMaker/1.0"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            content_type = resp.headers.get("Content-Type", "")
            content_length = resp.headers.get("Content-Length")
            if not fmt:
                fmt = _detect_format_from_content_type(content_type)
    except Exception:
        content_type = ""
        content_length = None

    if not fmt:
        raise ValueError(
            f"Could not detect file format from URL. "
            f"Supported: {', '.join(SUPPORTED_URL_FORMATS.keys())}"
        )

    # Download a sample to get schema
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "SmartDashMaker/1.0", "Range": "bytes=0-524288"})
        with urllib.request.urlopen(req, timeout=30) as resp:
            sample_bytes = resp.read()
    except Exception as e:
        raise ValueError(f"Failed to fetch URL: {str(e)}")

    # Parse sample to extract schema
    import io
    try:
        if fmt == "csv":
            df = pl.read_csv(io.BytesIO(sample_bytes), infer_schema_length=5000, try_parse_dates=True, n_rows=200)
        elif fmt == "parquet":
            df = pl.read_parquet(io.BytesIO(sample_bytes), n_rows=200)
        elif fmt == "json":
            import json as json_lib
            parsed = json_lib.loads(sample_bytes)
            if isinstance(parsed, dict) and "data" in parsed and isinstance(parsed["data"], list):
                df = pl.DataFrame(parsed["data"])
            elif isinstance(parsed, list):
                df = pl.DataFrame(parsed)
            else:
                df = pl.read_json(io.BytesIO(sample_bytes))
            if df.height > 200:
                df = df.head(200)
        elif fmt == "excel":
            df = pl.read_excel(io.BytesIO(sample_bytes), infer_schema_length=5000)
            if df.height > 200:
                df = df.head(200)
        else:
            raise ValueError(f"Unsupported format: {fmt}")
    except Exception as e:
        raise ValueError(f"Failed to parse {fmt.upper()} from URL: {str(e)}")

    # Validate: must be tabular with at least 1 column and 1 row
    if df.width == 0:
        raise ValueError("Dataset has no columns - not a valid tabular dataset")

    columns = [{"name": col, "dtype": str(df[col].dtype)} for col in df.columns]
    file_size_bytes = int(content_length) if content_length and content_length.isdigit() else len(sample_bytes)

    return {
        "format": fmt,
        "columns": columns,
        "sample_rows": df.head(5).to_dicts(),
        "file_size": file_size_bytes,
        "content_type": content_type,
    }


def register_url_dataset(url: str, name: str, probe_result: dict) -> dict:
    """
    Register a URL dataset in the metadata DB. No data stored.
    """
    dataset_id = str(uuid.uuid4())
    columns_json = json.dumps(probe_result["columns"])
    source_meta = json.dumps({
        "url": url,
        "format": probe_result["format"],
        "content_type": probe_result.get("content_type", ""),
    })

    with get_db() as db:
        db.execute(
            """INSERT INTO datasets
               (id, name, original_filename, file_path, file_size, row_count, columns,
                source_type, source_meta, is_virtual)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                dataset_id, name,
                f"[URL:{probe_result['format'].upper()}]",
                "URL",
                probe_result.get("file_size", 0),
                0,  # row_count unknown until full load
                columns_json,
                "url",
                source_meta,
                0,
            )
        )

    return {
        "id": dataset_id,
        "name": name,
        "source_type": "url",
        "format": probe_result["format"],
        "columns": probe_result["columns"],
        "url": url,
    }


def load_url_dataset_to_duckdb(dataset_id: str) -> pl.DataFrame:
    """Lazily load a URL dataset into DuckDB when needed."""
    with get_db() as db:
        row = db.execute("SELECT * FROM datasets WHERE id = ?", (dataset_id,)).fetchone()
        if not row:
            raise ValueError(f"Dataset {dataset_id} not found")

    d = dict(row)
    if d.get("source_type") != "url":
        raise ValueError(f"Dataset {dataset_id} is not a URL dataset")

    meta = json.loads(d.get("source_meta") or "{}")
    url = meta.get("url")
    fmt = meta.get("format", "csv").lower()

    import io
    # Support advanced REST configs if present
    config = meta.get("config", {})
    method = config.get("method", "GET")
    
    req = urllib.request.Request(url, method=method, headers={"User-Agent": "SmartDashMaker/1.0"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        data = resp.read()

    if fmt == "csv":
        df = pl.read_csv(io.BytesIO(data), infer_schema_length=10000, try_parse_dates=True)
    elif fmt == "parquet":
        df = pl.read_parquet(io.BytesIO(data))
    elif fmt == "json":
        import json as json_lib
        try:
            parsed = json_lib.loads(data)
            if isinstance(parsed, dict) and "data" in parsed and isinstance(parsed["data"], list):
                df = pl.DataFrame(parsed["data"])
            elif isinstance(parsed, list):
                df = pl.DataFrame(parsed)
            else:
                df = pl.read_json(io.BytesIO(data))
        except Exception:
            df = pl.read_json(io.BytesIO(data))
    elif fmt == "excel":
        df = pl.read_excel(io.BytesIO(data), infer_schema_length=10000)
    else:
        raise ValueError(f"Unsupported format: {fmt}")

    # Update row_count in DB, refresh schema
    columns = [{"name": col, "dtype": str(df[col].dtype)} for col in df.columns]
    with get_db() as db:
        db.execute(
            "UPDATE datasets SET row_count = ?, columns = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            (len(df), json.dumps(columns), dataset_id)
        )

    return df


# ─────────────────────────────────────────────────────────────────────────────
# Database Connection Source
# ─────────────────────────────────────────────────────────────────────────────

def probe_db_connection(db_type: str, host: str, port: int, database: str,
                        username: str, password: str,
                        ssl_mode: str = "If available", ssl_key: str = "",
                        ssl_cert: str = "", ssl_ca: str = "", ssl_cipher: str = "",
                        ssl_key_content: str = "", ssl_cert_content: str = "", ssl_ca_content: str = "") -> dict:
    """
    Test a database connection and list available tables.
    Returns list of tables with basic schema info.
    """
    db_type = db_type.lower()
    if db_type not in SUPPORTED_DB_TYPES:
        raise ValueError(f"Unsupported database type: {db_type}. Supported: {', '.join(SUPPORTED_DB_TYPES)}")

    conn = None
    tables = []

    try:
        if db_type == "sqlite":
            import sqlite3
            conn_str = database  # database = file path for SQLite
            conn = sqlite3.connect(conn_str)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
            raw_tables = [r[0] for r in cursor.fetchall()]
            for tbl in raw_tables:
                try:
                    cursor.execute(f"PRAGMA table_info(\"{tbl}\")")
                    cols = [{"name": r[1], "dtype": r[2]} for r in cursor.fetchall()]
                    cursor.execute(f"SELECT COUNT(*) FROM \"{tbl}\"")
                    row_count = cursor.fetchone()[0]
                    tables.append({"name": tbl, "columns": cols, "row_count": row_count})
                except Exception:
                    tables.append({"name": tbl, "columns": [], "row_count": None})

        elif db_type == "duckdb":
            db_conn = duckdb.connect(database)
            raw_tables = db_conn.execute(
                "SELECT table_name FROM information_schema.tables WHERE table_schema = 'main' ORDER BY table_name"
            ).fetchall()
            for (tbl,) in raw_tables:
                try:
                    schema = db_conn.execute(f"DESCRIBE \"{tbl}\"").fetchall()
                    cols = [{"name": r[0], "dtype": r[1]} for r in schema]
                    rc = db_conn.execute(f"SELECT COUNT(*) FROM \"{tbl}\"").fetchone()[0]
                    tables.append({"name": tbl, "columns": cols, "row_count": rc})
                except Exception:
                    tables.append({"name": tbl, "columns": [], "row_count": None})
            db_conn.close()

        elif db_type == "postgresql":
            try:
                import psycopg2
            except ImportError:
                raise ValueError("psycopg2 is not installed. Run: pip install psycopg2-binary")
            pg_kwargs = {
                "host": host, "port": port, "dbname": database,
                "user": username, "password": password, "connect_timeout": 10
            }
            if ssl_mode and ssl_mode.lower() != "disable":
                import tempfile
                mode_map = {"require": "require", "verify-ca": "verify-ca", "verify-full": "verify-full"}
                pg_kwargs["sslmode"] = mode_map.get(ssl_mode.lower(), "prefer")
                
                temp_files = []
                def get_ssl_file(path, content):
                    if content:
                        fd, tmp = tempfile.mkstemp()
                        with os.fdopen(fd, 'w') as f: f.write(content)
                        temp_files.append(tmp)
                        return tmp
                    return path
                
                pg_ssl_cert = get_ssl_file(ssl_cert, ssl_cert_content)
                pg_ssl_key = get_ssl_file(ssl_key, ssl_key_content)
                pg_ssl_ca = get_ssl_file(ssl_ca, ssl_ca_content)
                
                if pg_ssl_cert: pg_kwargs["sslcert"] = pg_ssl_cert
                if pg_ssl_key: pg_kwargs["sslkey"] = pg_ssl_key
                if pg_ssl_ca: pg_kwargs["sslrootcert"] = pg_ssl_ca
            
            conn = psycopg2.connect(**pg_kwargs)
            cur = conn.cursor()
            cur.execute("""
                SELECT table_name FROM information_schema.tables
                WHERE table_schema = 'public' ORDER BY table_name
            """)
            raw_tables = [r[0] for r in cur.fetchall()]
            for tbl in raw_tables:
                try:
                    cur.execute(f"""
                        SELECT column_name, data_type
                        FROM information_schema.columns
                        WHERE table_name = %s ORDER BY ordinal_position
                    """, (tbl,))
                    cols = [{"name": r[0], "dtype": r[1]} for r in cur.fetchall()]
                    cur.execute(f'SELECT COUNT(*) FROM "{tbl}"')
                    rc = cur.fetchone()[0]
                    tables.append({"name": tbl, "columns": cols, "row_count": rc})
                except Exception:
                    tables.append({"name": tbl, "columns": [], "row_count": None})

        elif db_type == "mysql":
            try:
                import mysql.connector
            except ImportError:
                raise ValueError("mysql-connector-python is not installed. Run: pip install mysql-connector-python")
            my_kwargs = {
                "host": host, "port": port, "database": database,
                "user": username, "password": password, "connection_timeout": 10
            }
            if ssl_mode and ssl_mode.lower() != "disable":
                import tempfile
                temp_files = []
                def get_ssl_file(path, content):
                    if content:
                        fd, tmp = tempfile.mkstemp()
                        with os.fdopen(fd, 'w') as f: f.write(content)
                        temp_files.append(tmp)
                        return tmp
                    return path
                
                my_ssl_cert = get_ssl_file(ssl_cert, ssl_cert_content)
                my_ssl_key = get_ssl_file(ssl_key, ssl_key_content)
                my_ssl_ca = get_ssl_file(ssl_ca, ssl_ca_content)
                
                if my_ssl_cert: my_kwargs["ssl_cert"] = my_ssl_cert
                if my_ssl_key: my_kwargs["ssl_key"] = my_ssl_key
                if my_ssl_ca: my_kwargs["ssl_ca"] = my_ssl_ca
                if ssl_cipher: my_kwargs["ssl_cipher"] = ssl_cipher
            
            conn = mysql.connector.connect(**my_kwargs)
            cur = conn.cursor()
            cur.execute("SHOW TABLES")
            raw_tables = [r[0] for r in cur.fetchall()]
            for tbl in raw_tables:
                try:
                    cur.execute(f"DESCRIBE `{tbl}`")
                    cols = [{"name": r[0], "dtype": r[1]} for r in cur.fetchall()]
                    cur.execute(f"SELECT COUNT(*) FROM `{tbl}`")
                    rc = cur.fetchone()[0]
                    tables.append({"name": tbl, "columns": cols, "row_count": rc})
                except Exception:
                    tables.append({"name": tbl, "columns": [], "row_count": None})

    finally:
        if conn and hasattr(conn, "close"):
            conn.close()

    return {"db_type": db_type, "tables": tables, "table_count": len(tables)}


def register_db_connection(name: str, db_type: str, host: str, port: int,
                           database: str, username: str, password: str,
                           ssl_mode: str = "If available", ssl_key: str = "",
                           ssl_cert: str = "", ssl_ca: str = "", ssl_cipher: str = "",
                           ssl_key_content: str = "", ssl_cert_content: str = "", ssl_ca_content: str = "") -> dict:
    """
    Register a database connection. Credentials stored but no data fetched.
    """
    conn_id = str(uuid.uuid4())
    
    # Save SSL files locally if content is provided
    import os
    ssl_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "ssl_certs")
    os.makedirs(ssl_dir, exist_ok=True)
    
    def save_ssl_file(content, suffix):
        if not content: return ""
        path = os.path.join(ssl_dir, f"{conn_id}_{suffix}")
        with open(path, "w") as f: f.write(content)
        return path

    final_ssl_key = save_ssl_file(ssl_key_content, "key.pem") or ssl_key
    final_ssl_cert = save_ssl_file(ssl_cert_content, "cert.pem") or ssl_cert
    final_ssl_ca = save_ssl_file(ssl_ca_content, "ca.pem") or ssl_ca

    source_meta = json.dumps({
        "db_type": db_type,
        "host": host,
        "port": port,
        "database": database,
        "username": username,
        "password": password,  # In production, encrypt this
        "ssl_mode": ssl_mode,
        "ssl_key": final_ssl_key,
        "ssl_cert": final_ssl_cert,
        "ssl_ca": final_ssl_ca,
        "ssl_cipher": ssl_cipher,
    })

    with get_db() as db:
        db.execute(
            """INSERT INTO db_connections
               (id, name, db_type, host, port, database_name, username, password_enc, source_meta)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (conn_id, name, db_type, host or "", port or 0,
             database, username or "", password, source_meta)
        )

    return {
        "id": conn_id,
        "name": name,
        "db_type": db_type,
        "host": host,
        "port": port,
        "database": database,
    }


def list_db_connections() -> list:
    with get_db() as db:
        rows = db.execute("SELECT * FROM db_connections ORDER BY created_at DESC").fetchall()
    results = []
    for row in rows:
        d = dict(row)
        results.append({
            "id": d["id"],
            "name": d["name"],
            "db_type": d["db_type"],
            "host": d.get("host", ""),
            "port": d.get("port"),
            "database": d["database_name"],
            "username": d.get("username", ""),
            "created_at": d["created_at"],
            "updated_at": d["updated_at"],
        })
    return results


def get_db_connection(conn_id: str) -> dict:
    with get_db() as db:
        row = db.execute("SELECT * FROM db_connections WHERE id = ?", (conn_id,)).fetchone()
        if not row:
            raise ValueError(f"Connection {conn_id} not found")
    d = dict(row)
    meta = json.loads(d.get("source_meta") or "{}")
    return {
        "id": d["id"],
        "name": d["name"],
        "db_type": d["db_type"],
        "host": d.get("host", ""),
        "port": d.get("port"),
        "database": d["database_name"],
        "username": d.get("username", ""),
        "password": d.get("password_enc", ""),  # returned for reconnection
        "ssl_mode": meta.get("ssl_mode", "If available"),
        "ssl_key": meta.get("ssl_key", ""),
        "ssl_cert": meta.get("ssl_cert", ""),
        "ssl_ca": meta.get("ssl_ca", ""),
        "ssl_cipher": meta.get("ssl_cipher", ""),
        "created_at": d["created_at"],
    }


def delete_db_connection(conn_id: str):
    with get_db() as db:
        row = db.execute("SELECT id FROM db_connections WHERE id = ?", (conn_id,)).fetchone()
        if not row:
            raise ValueError(f"Connection {conn_id} not found")
        # Also delete associated datasets
        db.execute("DELETE FROM datasets WHERE source_type = 'db' AND source_meta LIKE ?", (f'%"connection_id": "{conn_id}"%',))
        db.execute("DELETE FROM db_connections WHERE id = ?", (conn_id,))


def register_db_table_as_dataset(connection_id: str, table_name: str,
                                  dataset_name: str, columns: list, row_count: int) -> dict:
    """Register a specific DB table as a dataset object (no data stored)."""
    dataset_id = str(uuid.uuid4())
    source_meta = json.dumps({
        "connection_id": connection_id,
        "table_name": table_name,
    })
    columns_json = json.dumps(columns)

    with get_db() as db:
        # Get db_type from connection
        conn_row = db.execute("SELECT db_type FROM db_connections WHERE id = ?", (connection_id,)).fetchone()
        db_type = dict(conn_row)["db_type"] if conn_row else "unknown"

        db.execute(
            """INSERT INTO datasets
               (id, name, original_filename, file_path, file_size, row_count, columns,
                source_type, source_meta, is_virtual)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                dataset_id, dataset_name,
                f"[DB:{db_type.upper()}:{table_name}]",
                "DB",
                0,
                row_count or 0,
                columns_json,
                "db",
                source_meta,
                0,
            )
        )

    return {
        "id": dataset_id,
        "name": dataset_name,
        "source_type": "db",
        "table_name": table_name,
        "connection_id": connection_id,
        "columns": columns,
        "row_count": row_count,
    }


def load_db_table_to_duckdb(dataset_id: str) -> pl.DataFrame:
    """Lazily load a DB table dataset into DuckDB when needed."""
    with get_db() as db:
        ds_row = db.execute("SELECT * FROM datasets WHERE id = ?", (dataset_id,)).fetchone()
        if not ds_row:
            raise ValueError(f"Dataset {dataset_id} not found")

    d = dict(ds_row)
    if d.get("file_path") != "DB":
        raise ValueError(f"Dataset {dataset_id} is not a DB dataset")

    meta = json.loads(d.get("source_meta") or "{}")
    connection_id = meta.get("connection_id")
    table_name = meta.get("table_name")

    conn_info = get_db_connection(connection_id)
    db_type = conn_info["db_type"]

    df = None
    if db_type == "sqlite":
        import sqlite3
        sqlite_conn = sqlite3.connect(conn_info["database"])
        sqlite_conn.row_factory = sqlite3.Row
        cur = sqlite_conn.cursor()
        cur.execute(f'SELECT * FROM "{table_name}"')
        rows = cur.fetchall()
        sqlite_conn.close()
        if rows:
            df = pl.from_dicts([dict(r) for r in rows])
        else:
            df = pl.DataFrame()

    elif db_type == "duckdb":
        duck_conn = duckdb.connect(conn_info["database"])
        df = duck_conn.execute(f'SELECT * FROM "{table_name}"').pl()
        duck_conn.close()

    elif db_type == "postgresql":
        import psycopg2
        pg_kwargs = {
            "host": conn_info["host"], "port": conn_info["port"],
            "dbname": conn_info["database"], "user": conn_info["username"],
            "password": conn_info["password"]
        }
        ssl_mode = conn_info.get("ssl_mode", "If available")
        if ssl_mode and ssl_mode.lower() != "disable":
            mode_map = {"require": "require", "verify-ca": "verify-ca", "verify-full": "verify-full"}
            pg_kwargs["sslmode"] = mode_map.get(ssl_mode.lower(), "prefer")
            if conn_info.get("ssl_cert"): pg_kwargs["sslcert"] = conn_info["ssl_cert"]
            if conn_info.get("ssl_key"): pg_kwargs["sslkey"] = conn_info["ssl_key"]
            if conn_info.get("ssl_ca"): pg_kwargs["sslrootcert"] = conn_info["ssl_ca"]

        pg_conn = psycopg2.connect(**pg_kwargs)
        cur = pg_conn.cursor()
        cur.execute(f'SELECT * FROM "{table_name}"')
        cols = [desc[0] for desc in cur.description]
        rows = [dict(zip(cols, r)) for r in cur.fetchall()]
        pg_conn.close()
        df = pl.from_dicts(rows) if rows else pl.DataFrame(schema={c: pl.Utf8 for c in cols})

    elif db_type == "mysql":
        import mysql.connector
        my_kwargs = {
            "host": conn_info["host"], "port": conn_info["port"],
            "database": conn_info["database"], "user": conn_info["username"],
            "password": conn_info["password"]
        }
        ssl_mode = conn_info.get("ssl_mode", "If available")
        if ssl_mode and ssl_mode.lower() != "disable":
            if conn_info.get("ssl_cert"): my_kwargs["ssl_cert"] = conn_info["ssl_cert"]
            if conn_info.get("ssl_key"): my_kwargs["ssl_key"] = conn_info["ssl_key"]
            if conn_info.get("ssl_ca"): my_kwargs["ssl_ca"] = conn_info["ssl_ca"]
            if conn_info.get("ssl_cipher"): my_kwargs["ssl_cipher"] = conn_info["ssl_cipher"]

        my_conn = mysql.connector.connect(**my_kwargs)
        cur = my_conn.cursor(dictionary=True)
        cur.execute(f"SELECT * FROM `{table_name}`")
        rows = cur.fetchall()
        my_conn.close()
        df = pl.from_dicts(rows) if rows else pl.DataFrame()
    else:
        raise ValueError(f"Unsupported db type: {db_type}")

    # Update metadata
    columns = [{"name": col, "dtype": str(df[col].dtype)} for col in df.columns]
    with get_db() as db:
        db.execute(
            "UPDATE datasets SET row_count = ?, columns = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            (len(df), json.dumps(columns), dataset_id)
        )

    return df


def refresh_dataset_metadata(dataset_id: str) -> dict:
    """
    Re-fetch schema and row count for external datasets (URL / DB).
    Called when user selects dataset or clicks refresh.
    """
    with get_db() as db:
        row = db.execute("SELECT * FROM datasets WHERE id = ?", (dataset_id,)).fetchone()
        if not row:
            raise ValueError(f"Dataset {dataset_id} not found")

    d = dict(row)
    source_type = d.get("source_type", "file")

    if source_type == "url":
        meta = json.loads(d.get("source_meta") or "{}")
        try:
            probe = probe_url_source(meta["url"])
            columns = probe["columns"]
            with get_db() as db:
                db.execute(
                    "UPDATE datasets SET columns = ?, file_size = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                    (json.dumps(columns), probe.get("file_size", 0), dataset_id)
                )
            return {"status": "refreshed", "columns": columns}
        except Exception as e:
            return {"status": "error", "message": str(e)}

    elif source_type == "db":
        meta = json.loads(d.get("source_meta") or "{}")
        try:
            conn_info = get_db_connection(meta["connection_id"])
            probe = probe_db_connection(
                conn_info["db_type"], conn_info["host"], conn_info["port"],
                conn_info["database"], conn_info["username"], conn_info["password"],
                conn_info.get("ssl_mode", "If available"), conn_info.get("ssl_key", ""), 
                conn_info.get("ssl_cert", ""), conn_info.get("ssl_ca", ""), conn_info.get("ssl_cipher", "")
            )
            table_info = next((t for t in probe["tables"] if t["name"] == meta["table_name"]), None)
            if table_info:
                with get_db() as db:
                    db.execute(
                        "UPDATE datasets SET columns = ?, row_count = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                        (json.dumps(table_info["columns"]), table_info["row_count"], dataset_id)
                    )
                return {"status": "refreshed", "columns": table_info["columns"], "row_count": table_info["row_count"]}
        except Exception as e:
            return {"status": "error", "message": str(e)}

    return {"status": "skipped", "reason": "Not an external source"}

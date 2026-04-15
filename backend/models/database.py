"""
SQLite database setup for metadata storage.
Stores dataset info, saved queries, visualization configs, and dashboard configs.
"""
import sqlite3
import os
import json
from contextlib import contextmanager

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "metadata.db")


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


@contextmanager
def get_db():
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db():
    """Create all tables if they don't exist."""
    with get_db() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS datasets (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                original_filename TEXT NOT NULL,
                file_path TEXT NOT NULL,
                file_size INTEGER,
                row_count INTEGER,
                columns TEXT NOT NULL,  -- JSON: [{name, dtype}]
                is_virtual INTEGER DEFAULT 0,
                parent_dataset_id TEXT,
                sql_query TEXT,
                source_type TEXT DEFAULT 'file',  -- 'file' | 'url' | 'db'
                source_meta TEXT,                 -- JSON: connection/url details
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS db_connections (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                db_type TEXT NOT NULL,  -- 'postgresql' | 'mysql' | 'sqlite' | 'duckdb'
                host TEXT DEFAULT '',
                port INTEGER DEFAULT 0,
                database_name TEXT NOT NULL,
                username TEXT DEFAULT '',
                password_enc TEXT DEFAULT '',
                source_meta TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS saved_queries (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT DEFAULT '',
                sql_text TEXT NOT NULL,
                dataset_id TEXT NOT NULL,
                config TEXT,        -- JSON: stores UI builder state (selects, groups, etc)
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS visualizations (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                dataset_id TEXT NOT NULL,
                query_id TEXT,
                chart_type TEXT NOT NULL,
                config TEXT NOT NULL,  -- JSON: full chart configuration
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE,
                FOREIGN KEY (query_id) REFERENCES saved_queries(id) ON DELETE SET NULL
            );

            CREATE TABLE IF NOT EXISTS dashboards (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT DEFAULT '',
                layout TEXT NOT NULL,  -- JSON: react-grid-layout config
                widgets TEXT NOT NULL, -- JSON: [{vizId, filters, ...}]
                tabs TEXT DEFAULT '[]', -- JSON: [{id, label, icon}]
                global_filters TEXT DEFAULT '[]',  -- JSON
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # Gracefully upgrade existing datasets table
        try: conn.execute("ALTER TABLE datasets ADD COLUMN is_virtual INTEGER DEFAULT 0")
        except Exception: pass
        try: conn.execute("ALTER TABLE datasets ADD COLUMN parent_dataset_id TEXT")
        except Exception: pass
        try: conn.execute("ALTER TABLE datasets ADD COLUMN sql_query TEXT")
        except Exception: pass
        try: conn.execute("ALTER TABLE saved_queries ADD COLUMN config TEXT")
        except Exception: pass
        try: conn.execute("ALTER TABLE datasets ADD COLUMN source_type TEXT DEFAULT 'file'")
        except Exception: pass
        try: conn.execute("ALTER TABLE datasets ADD COLUMN source_meta TEXT")
        except Exception: pass

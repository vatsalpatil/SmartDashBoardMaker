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


def _try_alter(conn, sql: str) -> None:
    """Run an ALTER TABLE and silently ignore if the column already exists."""
    try:
        conn.execute(sql)
    except Exception:
        pass


def init_db():
    """
    Create local SQLite metadata tables.
    NOTE: The `users` table lives in TiDB (see auth/tidb_db.py).
          user_id here is a plain TEXT column – cross-DB FK not needed.
    """
    with get_db() as conn:
        conn.executescript("""
            -- ── Datasets ──────────────────────────────────────────────────────
            CREATE TABLE IF NOT EXISTS datasets (
                id TEXT PRIMARY KEY,
                user_id TEXT,                          -- TiDB users.id reference
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

            -- ── DB Connections ────────────────────────────────────────────────
            CREATE TABLE IF NOT EXISTS db_connections (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                name TEXT NOT NULL,
                db_type TEXT NOT NULL,
                host TEXT DEFAULT '',
                port INTEGER DEFAULT 0,
                database_name TEXT NOT NULL,
                username TEXT DEFAULT '',
                password_enc TEXT DEFAULT '',
                source_meta TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- ── Saved Queries ─────────────────────────────────────────────────
            CREATE TABLE IF NOT EXISTS saved_queries (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                name TEXT NOT NULL,
                description TEXT DEFAULT '',
                sql_text TEXT NOT NULL,
                dataset_id TEXT NOT NULL,
                config TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE
            );

            -- ── Visualizations ────────────────────────────────────────────────
            CREATE TABLE IF NOT EXISTS visualizations (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                name TEXT NOT NULL,
                dataset_id TEXT NOT NULL,
                query_id TEXT,
                chart_type TEXT NOT NULL,
                config TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE,
                FOREIGN KEY (query_id) REFERENCES saved_queries(id) ON DELETE SET NULL
            );

            -- ── Dashboards ────────────────────────────────────────────────────
            CREATE TABLE IF NOT EXISTS dashboards (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                name TEXT NOT NULL,
                description TEXT DEFAULT '',
                layout TEXT NOT NULL,
                widgets TEXT NOT NULL,
                tabs TEXT DEFAULT '[]',
                global_filters TEXT DEFAULT '[]',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # ── Graceful column migrations (existing installs) ────────────────────
        _try_alter(conn, "ALTER TABLE datasets ADD COLUMN is_virtual INTEGER DEFAULT 0")
        _try_alter(conn, "ALTER TABLE datasets ADD COLUMN parent_dataset_id TEXT")
        _try_alter(conn, "ALTER TABLE datasets ADD COLUMN sql_query TEXT")
        _try_alter(conn, "ALTER TABLE saved_queries ADD COLUMN config TEXT")
        _try_alter(conn, "ALTER TABLE datasets ADD COLUMN source_type TEXT DEFAULT 'file'")
        _try_alter(conn, "ALTER TABLE datasets ADD COLUMN source_meta TEXT")
        # user_id columns for multi-user isolation
        _try_alter(conn, "ALTER TABLE datasets ADD COLUMN user_id TEXT")
        _try_alter(conn, "ALTER TABLE db_connections ADD COLUMN user_id TEXT")
        _try_alter(conn, "ALTER TABLE saved_queries ADD COLUMN user_id TEXT")
        _try_alter(conn, "ALTER TABLE visualizations ADD COLUMN user_id TEXT")
        _try_alter(conn, "ALTER TABLE dashboards ADD COLUMN user_id TEXT")

        # ── Create Indexes (after ensuring columns exist) ─────────────────────
        conn.executescript("""
            CREATE INDEX IF NOT EXISTS idx_datasets_user ON datasets(user_id);
            CREATE INDEX IF NOT EXISTS idx_db_connections_user ON db_connections(user_id);
            CREATE INDEX IF NOT EXISTS idx_saved_queries_user ON saved_queries(user_id);
            CREATE INDEX IF NOT EXISTS idx_saved_queries_dataset ON saved_queries(dataset_id);
            CREATE INDEX IF NOT EXISTS idx_visualizations_user ON visualizations(user_id);
            CREATE INDEX IF NOT EXISTS idx_dashboards_user ON dashboards(user_id);
        """)


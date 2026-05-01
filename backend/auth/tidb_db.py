"""
TiDB connection pool for auth user storage.
Uses SQLAlchemy + PyMySQL (MySQL-compatible driver).

All user authentication records (signup, login, sessions) are stored in TiDB,
giving production-grade scalability and durability for 1000+ concurrent users.
"""
import os
from contextlib import contextmanager
from typing import Generator

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Connection

load_dotenv()

# ── Connection config (from .env or TiDB_Credentials defaults) ────────────────
TIDB_HOST     = os.getenv("TIDB_HOST", "gateway01.ap-southeast-1.prod.aws.tidbcloud.com")
TIDB_PORT     = int(os.getenv("TIDB_PORT", "4000"))
TIDB_USER     = os.getenv("TIDB_USER", "2GNs3TsqA8kecEc.root")
TIDB_PASSWORD = os.getenv("TIDB_PASSWORD", "BBZN78HqtmDHwdUd")
TIDB_DATABASE = os.getenv("TIDB_DATABASE", "test")
TIDB_SSL_CA   = os.getenv(
    "TIDB_SSL_CA",
    r"C:\Users\Vatsal\Document\VSCodeFiles\PythonCode\SmartDashBoardMaker\TiDB_Credentials\isrgrootx1.pem",
)

_DATABASE_URL = (
    f"mysql+pymysql://{TIDB_USER}:{TIDB_PASSWORD}"
    f"@{TIDB_HOST}:{TIDB_PORT}/{TIDB_DATABASE}?charset=utf8mb4"
)

# ── Shared connection pool ────────────────────────────────────────────────────
_engine = create_engine(
    _DATABASE_URL,
    connect_args={"ssl": {"ca": TIDB_SSL_CA}},
    pool_size=10,
    max_overflow=20,
    pool_recycle=1800,
    pool_pre_ping=True,   # validates connections before checkout
    pool_use_lifo=True,   # reuse hot connections from top of stack
    echo=False,
)


# ── Context manager ───────────────────────────────────────────────────────────
@contextmanager
def get_tidb() -> Generator[Connection, None, None]:
    """Yield a SQLAlchemy Connection from the TiDB pool."""
    with _engine.connect() as conn:
        yield conn


def row_to_dict(row) -> dict:
    """Convert a SQLAlchemy Row to a plain dict."""
    return dict(row._mapping) if row is not None else None


# ── Schema bootstrap ──────────────────────────────────────────────────────────
def init_tidb_auth() -> None:
    """
    Create the `users` table in TiDB if it does not exist.
    Called once at application startup via lifespan.
    """
    create_users_sql = text("""
        CREATE TABLE IF NOT EXISTS users (
            id            VARCHAR(36)  NOT NULL,
            username      VARCHAR(30)  NOT NULL,
            email         VARCHAR(255) NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            full_name     VARCHAR(100) DEFAULT '',
            role          VARCHAR(20)  NOT NULL DEFAULT 'user',
            is_active     TINYINT(1)   NOT NULL DEFAULT 1,
            created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
                                       ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uq_users_email    (email),
            UNIQUE KEY uq_users_username (username),
            KEY         idx_users_role   (role)
        ) ENGINE=InnoDB
          DEFAULT CHARSET=utf8mb4
          COLLATE=utf8mb4_unicode_ci
          COMMENT='Auth users – managed by SmartDashBoard auth module';
    """)
    with _engine.connect() as conn:
        conn.execute(create_users_sql)
        conn.commit()

"""
FastAPI dependency injection for JWT authentication.
User lookups performed against TiDB (not SQLite).
"""
import threading
from collections import defaultdict
from datetime import datetime, timedelta

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy import text

from .config import LOGIN_WINDOW_MINUTES, MAX_LOGIN_ATTEMPTS
from .security import decode_token
from .tidb_db import get_tidb, row_to_dict

security = HTTPBearer(auto_error=False)

# ── In-memory brute-force rate limiter ───────────────────────────────────────
_login_attempts: dict[str, list] = defaultdict(list)
_rate_lock = threading.Lock()


def check_rate_limit(ip: str) -> None:
    with _rate_lock:
        now = datetime.utcnow()
        cutoff = now - timedelta(minutes=LOGIN_WINDOW_MINUTES)
        attempts = [t for t in _login_attempts[ip] if t > cutoff]
        if len(attempts) >= MAX_LOGIN_ATTEMPTS:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Too many login attempts. Please wait {LOGIN_WINDOW_MINUTES} minutes.",
            )
        attempts.append(now)
        _login_attempts[ip] = attempts


def _get_client_ip(request: Request) -> str:
    fwd = request.headers.get("X-Forwarded-For")
    if fwd:
        return fwd.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


# ── Auth dependencies ─────────────────────────────────────────────────────────

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """Validate JWT and return the user dict from TiDB. Raises 401 on failure."""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = credentials.credentials
    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            raise ValueError("Wrong token type")
        user_id: str = payload.get("sub", "")
        if not user_id:
            raise ValueError("Missing sub claim")
    except (JWTError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    with get_tidb() as conn:
        row = conn.execute(
            text("SELECT * FROM users WHERE id = :id AND is_active = 1"),
            {"id": user_id},
        ).fetchone()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or deactivated",
        )
    return row_to_dict(row)


def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict | None:
    """Return user dict if authenticated, else None (non-blocking)."""
    if not credentials:
        return None
    try:
        return get_current_user(credentials)
    except HTTPException:
        return None


def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user

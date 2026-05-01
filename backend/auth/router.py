"""
Auth API routes – all user data read/written to TiDB.

  POST /api/auth/signup
  POST /api/auth/login
  POST /api/auth/logout
  POST /api/auth/refresh
  GET  /api/auth/me
  PUT  /api/auth/me/password
"""
import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import text

from .tidb_db import get_tidb, row_to_dict
from .dependencies import check_rate_limit, get_current_user, _get_client_ip
from .schemas import (
    ChangePasswordRequest,
    RefreshRequest,
    TokenResponse,
    UserLogin,
    UserResponse,
    UserSignup,
)
from .security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


# ── Helpers ───────────────────────────────────────────────────────────────────

def _row_to_response(user: dict) -> UserResponse:
    return UserResponse(
        id=user["id"],
        username=user["username"],
        email=user["email"],
        full_name=user.get("full_name") or "",
        role=user["role"],
        is_active=bool(user["is_active"]),
        created_at=str(user["created_at"]),
    )


def _issue_tokens(user_id: str, user: dict) -> TokenResponse:
    return TokenResponse(
        access_token=create_access_token({"sub": user_id}),
        refresh_token=create_refresh_token({"sub": user_id}),
        user=_row_to_response(user),
    )


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def signup(payload: UserSignup):
    """Register a new user – stored in TiDB."""
    with get_tidb() as conn:
        # Check uniqueness
        existing = conn.execute(
            text("SELECT id FROM users WHERE email = :e OR username = :u"),
            {"e": payload.email, "u": payload.username},
        ).fetchone()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email or username is already registered",
            )

        user_id = str(uuid.uuid4())
        hashed  = hash_password(payload.password)

        conn.execute(
            text("""
                INSERT INTO users (id, username, email, password_hash, full_name, role, is_active)
                VALUES (:id, :username, :email, :pw, :fn, 'user', 1)
            """),
            {
                "id": user_id,
                "username": payload.username,
                "email": payload.email,
                "pw": hashed,
                "fn": payload.full_name or "",
            },
        )
        conn.commit()

        row = conn.execute(
            text("SELECT * FROM users WHERE id = :id"), {"id": user_id}
        ).fetchone()
        user = row_to_dict(row)

    return _issue_tokens(user_id, user)


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, request: Request):
    """Authenticate with email + password. Brute-force protected."""
    ip = _get_client_ip(request)
    check_rate_limit(ip)

    with get_tidb() as conn:
        row = conn.execute(
            text("SELECT * FROM users WHERE email = :e AND is_active = 1"),
            {"e": payload.email},
        ).fetchone()

    if not row or not verify_password(payload.password, row_to_dict(row)["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    user = row_to_dict(row)
    user_id = user["id"]

    from datetime import timedelta
    expires = timedelta(days=30) if payload.remember_me else None
    access  = create_access_token({"sub": user_id}, expires)
    refresh = create_refresh_token({"sub": user_id})

    return TokenResponse(
        access_token=access,
        refresh_token=refresh,
        user=_row_to_response(user),
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh_tokens(payload: RefreshRequest):
    """Exchange a valid refresh token for a new token pair."""
    try:
        data = decode_token(payload.refresh_token)
        if data.get("type") != "refresh":
            raise ValueError("Wrong token type")
        user_id: str = data.get("sub", "")
        if not user_id:
            raise ValueError("Missing sub")
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    with get_tidb() as conn:
        row = conn.execute(
            text("SELECT * FROM users WHERE id = :id AND is_active = 1"),
            {"id": user_id},
        ).fetchone()

    if not row:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    return _issue_tokens(user_id, row_to_dict(row))


@router.get("/me", response_model=UserResponse)
def get_me(current_user: dict = Depends(get_current_user)):
    """Return the currently authenticated user's profile."""
    return _row_to_response(current_user)


@router.post("/logout")
def logout(current_user: dict = Depends(get_current_user)):
    """
    Stateless logout. Client MUST discard both tokens.
    Future: add a Redis-based token blacklist here for hard revocation.
    """
    return {"message": "Logged out successfully", "user_id": current_user["id"]}


@router.put("/me/password")
def change_password(
    payload: ChangePasswordRequest,
    current_user: dict = Depends(get_current_user),
):
    """Change password – verifies the current password first."""
    if not verify_password(payload.current_password, current_user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )
    new_hash = hash_password(payload.new_password)
    with get_tidb() as conn:
        conn.execute(
            text("UPDATE users SET password_hash = :h WHERE id = :id"),
            {"h": new_hash, "id": current_user["id"]},
        )
        conn.commit()
    return {"message": "Password updated successfully"}

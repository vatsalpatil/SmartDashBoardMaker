"""
Auth configuration – reads from .env or falls back to defaults.
IMPORTANT: Set JWT_SECRET_KEY to a secure random string in production!
"""
import os
from dotenv import load_dotenv

load_dotenv()

# ── JWT ───────────────────────────────────────────────────────────────────────
SECRET_KEY: str = os.getenv(
    "JWT_SECRET_KEY",
    "CHANGE-ME-use-openssl-rand-hex-32-in-production-do-not-ship-this",
)
ALGORITHM: str = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

# ── Rate limiting ─────────────────────────────────────────────────────────────
MAX_LOGIN_ATTEMPTS: int = int(os.getenv("MAX_LOGIN_ATTEMPTS", "5"))
LOGIN_WINDOW_MINUTES: int = int(os.getenv("LOGIN_WINDOW_MINUTES", "15"))

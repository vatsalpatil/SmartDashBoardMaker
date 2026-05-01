import os
import sys
import uuid
import warnings
# Suppress warnings
warnings.filterwarnings("ignore")

from dotenv import load_dotenv
load_dotenv()

from sqlalchemy import text
from auth.tidb_db import get_tidb, _engine
from auth.security import hash_password

try:
    with get_tidb() as conn:
        print("Connected to TiDB pool")
        
        user_id = str(uuid.uuid4())
        hashed = hash_password("Password@123")
        
        conn.execute(
            text("""
                INSERT INTO users (id, username, email, password_hash, full_name, role, is_active)
                VALUES (:id, :username, :email, :pw, :fn, 'user', 1)
            """),
            {
                "id": user_id,
                "username": "test_" + user_id[:8],
                "email": f"test_{user_id[:8]}@example.com",
                "pw": hashed,
                "fn": "Test User",
            },
        )
        conn.commit()
        print(f"Successfully inserted user {user_id}")
except Exception as e:
    import traceback
    traceback.print_exc()
    sys.exit(1)

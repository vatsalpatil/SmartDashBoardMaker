import sys
sys.path.insert(0, '.')
import asyncio
from routers.datasets import list_datasets
from models.database import init_db

async def test():
    # Mock current_user
    user = {"id": "eb736ebf-9871-4d67-8d54-17853ae452bb", "username": "test"}
    try:
        res = await list_datasets(current_user=user)
        print(f"Result: {res}")
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    init_db()
    asyncio.run(test())

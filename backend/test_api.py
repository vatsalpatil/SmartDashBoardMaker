import sys
sys.path.insert(0, '.')
from fastapi.testclient import TestClient
from main import app
from auth.security import create_access_token

client = TestClient(app)

# Create a dummy user token
# We need an ID that exists in TiDB or at least is a string
token = create_access_token({"sub": "eb736ebf-9871-4d67-8d54-17853ae452bb"})

response = client.get("/api/datasets/", headers={"Authorization": f"Bearer {token}"})
print(f"Status: {response.status_code}")
print(f"Body: {response.text}")

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from typing import Dict, Optional
import urllib.request
import urllib.error

router = APIRouter(prefix="/api/proxy", tags=["Proxy"])

class ProxyRequest(BaseModel):
    url: str
    method: str = "GET"
    headers: Optional[Dict[str, str]] = None
    body: Optional[str] = None

@router.post("")
async def execute_proxy(req: ProxyRequest):
    try:
        headers = req.headers or {}
        # Many public APIs (like NSE) reject requests without a valid User-Agent
        header_keys = {k.lower() for k in headers.keys()}
        if "user-agent" not in header_keys:
            headers["User-Agent"] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        
        # NSE India explicitly requires these generic headers sometimes to avoid 401/403
        if "accept" not in header_keys:
            headers["Accept"] = "*/*"

        data = req.body.encode("utf-8") if req.body else None
        
        # Execute request securely from the backend using standard library
        request = urllib.request.Request(
            url=req.url, 
            data=data, 
            headers=headers, 
            method=req.method
        )
        
        try:
            with urllib.request.urlopen(request, timeout=15) as response:
                content = response.read()
                status_code = response.getcode()
        except urllib.error.HTTPError as e:
            # If the external API returns 400/500, we still want to return that response 
            # to the frontend exactly as it is without throwing a FastAPI 500 error.
            content = e.read()
            status_code = e.code

        return Response(content=content, status_code=status_code)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Proxy error: {str(e)}")

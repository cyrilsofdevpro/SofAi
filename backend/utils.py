import os
from fastapi import Depends, HTTPException
from fastapi.security import APIKeyHeader

API_KEY_HEADER = "x-api-key"
api_key_header = APIKeyHeader(name=API_KEY_HEADER, auto_error=False)

def verify_api_key(api_key: str = Depends(api_key_header)):
    # Simple API key check; replace with a robust auth system when ready.
    allowed = os.getenv("API_KEYS", "").split(",") if os.getenv("API_KEYS") else []
    if not allowed:
        return None
    if not api_key or api_key not in allowed:
        raise HTTPException(status_code=401, detail="Invalid or missing API key")
    return api_key

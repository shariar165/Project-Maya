import os
from fastapi import HTTPException

MCP_API_KEY = os.getenv("MCP_API_KEY", "maya-mcp-secret-key-change-in-production")


def verify_api_key(key: str | None):
    if not key or key != MCP_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid MCP API key")

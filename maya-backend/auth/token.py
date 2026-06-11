import uuid
import jwt
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException


def _secret() -> str:
    from config import JWT_SECRET
    return JWT_SECRET


def create_access_token(patient_id: str, email: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub":   patient_id,
        "email": email,
        "type":  "access",
        "jti":   str(uuid.uuid4()),
        "iat":   now,
        "exp":   now + timedelta(minutes=15),
    }
    return jwt.encode(payload, _secret(), algorithm="HS256")


def create_refresh_token(patient_id: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub":  patient_id,
        "type": "refresh",
        "jti":  str(uuid.uuid4()),
        "iat":  now,
        "exp":  now + timedelta(days=30),
    }
    return jwt.encode(payload, _secret(), algorithm="HS256")


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, _secret(), algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


def verify_access_token(token: str) -> dict:
    payload = decode_token(token)
    if payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Invalid token type")
    return payload


def verify_refresh_token(token: str) -> dict:
    payload = decode_token(token)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid token type")
    return payload

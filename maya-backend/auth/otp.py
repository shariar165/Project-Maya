import hashlib
import hmac
import random
import string
from fastapi import HTTPException

OTP_TTL          = 300  # 5 minutes
OTP_MAX_ATTEMPTS = 5


def _hash_otp(code: str) -> str:
    return hashlib.sha256(code.encode()).hexdigest()


def generate_otp() -> str:
    return "".join(random.choices(string.digits, k=6))


async def generate_and_store(redis, email: str, purpose: str) -> str:
    code = generate_otp()
    key  = f"otp:{email}:{purpose}"
    att  = f"otp_attempts:{email}:{purpose}"
    await redis.set(key, _hash_otp(code), ex=OTP_TTL)
    await redis.delete(att)
    return code


async def verify(redis, email: str, purpose: str, code: str) -> bool:
    key = f"otp:{email}:{purpose}"
    att = f"otp_attempts:{email}:{purpose}"

    attempts = await redis.incr(att)
    if attempts > OTP_MAX_ATTEMPTS:
        raise HTTPException(
            status_code=429,
            detail="Too many attempts. Please request a new code.",
        )

    stored = await redis.get(key)
    if not stored:
        return False

    if isinstance(stored, bytes):
        stored = stored.decode()

    if hmac.compare_digest(_hash_otp(code), stored):
        await redis.delete(key)
        await redis.delete(att)
        return True

    return False

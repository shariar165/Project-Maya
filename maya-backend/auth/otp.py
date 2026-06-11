import hashlib
import hmac
import random
import string
from datetime import datetime, timedelta
from fastapi import HTTPException

OTP_TTL_MINUTES  = 5
OTP_MAX_ATTEMPTS = 5


def _hash_otp(code: str) -> str:
    return hashlib.sha256(code.encode()).hexdigest()


def generate_otp() -> str:
    return "".join(random.choices(string.digits, k=6))


def generate_and_store(email: str, purpose: str) -> str:
    from db.models import OtpCode
    from db.session import get_db

    code    = generate_otp()
    expires = datetime.utcnow() + timedelta(minutes=OTP_TTL_MINUTES)

    with get_db() as db:
        # Replace any existing code for this email+purpose
        db.query(OtpCode).filter(
            OtpCode.email == email, OtpCode.purpose == purpose
        ).delete(synchronize_session=False)
        db.add(OtpCode(
            email=email, purpose=purpose,
            code_hash=_hash_otp(code), expires_at=expires,
        ))

    return code


def verify(email: str, purpose: str, code: str) -> bool:
    from db.models import OtpCode
    from db.session import get_db

    with get_db() as db:
        otp = db.query(OtpCode).filter(
            OtpCode.email == email, OtpCode.purpose == purpose,
        ).first()

        if not otp:
            return False

        if otp.expires_at < datetime.utcnow():
            db.delete(otp)
            return False

        otp.attempts += 1
        if otp.attempts > OTP_MAX_ATTEMPTS:
            raise HTTPException(
                status_code=429,
                detail="Too many attempts. Please request a new code.",
            )

        if hmac.compare_digest(_hash_otp(code), otp.code_hash):
            db.delete(otp)
            return True

    return False

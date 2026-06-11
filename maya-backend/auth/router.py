import hashlib
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from auth.limiter import limiter
from auth.password import hash_password, verify_password
from auth.token import (
    create_access_token,
    create_refresh_token,
    decode_token,
    verify_refresh_token,
)
from auth.otp import generate_and_store, verify as verify_otp
from auth.email_service import send_verification_email, send_password_reset_email
from db.models import Patient, Session
from db.session import get_db, get_redis

router = APIRouter(prefix="/auth", tags=["auth"])


# ── helpers ───────────────────────────────────────────────────────────────────

def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def _user_dict(p: Patient) -> dict:
    return {
        "id":               p.id,
        "email":            p.email,
        "name":             p.name,
        "pregnancyWeek":    p.pregnancy_week,
        "lang":             p.lang,
        "age":              p.age,
        "city":             p.city,
        "bloodGroup":       p.blood_group,
        "isFirstPregnancy": p.is_first_pregnancy,
        "guardianPhone":    p.guardian_phone,
    }


async def _issue_tokens(db, patient: Patient) -> tuple[str, str]:
    """Create a new Session row and return (access_token, refresh_token)."""
    access  = create_access_token(patient.id, patient.email)
    refresh = create_refresh_token(patient.id)

    payload = decode_token(refresh)
    exp_dt  = datetime.fromtimestamp(payload["exp"], tz=timezone.utc).replace(tzinfo=None)

    db.add(Session(
        patient_id=patient.id,
        refresh_jti=payload["jti"],
        refresh_hash=_hash_token(refresh),
        expires_at=exp_dt,
    ))
    return access, refresh


def _token_response(access: str, refresh: str, patient: Patient) -> dict:
    return {
        "access_token":  access,
        "refresh_token": refresh,
        "expires_in":    900,
        "patient_id":    patient.id,
        "user":          _user_dict(patient),
    }


# ── request models ────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email:              str
    password:           str
    name:               str
    pregnancy_week:     int  = 20
    lang:               str  = "bn"
    age:                Optional[int]  = None
    city:               Optional[str]  = None
    blood_group:        Optional[str]  = None
    is_first_pregnancy: Optional[bool] = True
    guardian_phone:     Optional[str]  = None


class VerifyEmailRequest(BaseModel):
    email: str
    otp:   str


class ResendRequest(BaseModel):
    email: str


class LoginRequest(BaseModel):
    email:    str
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class LogoutRequest(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    email:        str
    otp:          str
    new_password: str


# ── endpoints ─────────────────────────────────────────────────────────────────

@router.post("/register")
@limiter.limit("5/minute")
async def register(request: Request, req: RegisterRequest):
    redis = await get_redis()
    email = req.email.strip().lower()

    with get_db() as db:
        existing = db.query(Patient).filter(Patient.email == email).first()
        if existing:
            if existing.status == "pending_verification":
                code = await generate_and_store(redis, email, "registration")
                await send_verification_email(req.email, code)
                raise HTTPException(
                    status_code=409,
                    detail="Email already registered but unverified. A new code has been sent.",
                )
            raise HTTPException(status_code=409, detail="Email already registered")

        from datetime import date
        due_date = None
        if req.pregnancy_week:
            due_date = (date.today() + timedelta(weeks=40 - req.pregnancy_week)).isoformat()

        db.add(Patient(
            email=email,
            password_hash=hash_password(req.password),
            name=req.name.strip() or "আপু",
            pregnancy_week=req.pregnancy_week,
            lang=req.lang,
            age=req.age,
            city=req.city,
            blood_group=req.blood_group,
            is_first_pregnancy=req.is_first_pregnancy if req.is_first_pregnancy is not None else True,
            guardian_phone=req.guardian_phone,
            due_date=due_date,
            status="pending_verification",
            email_verified=False,
        ))

    code = await generate_and_store(redis, email, "registration")
    await send_verification_email(req.email, code)
    return {"status": "pending_verification", "message": "Verification code sent to your email"}


@router.post("/verify-email")
async def verify_email(req: VerifyEmailRequest):
    redis = await get_redis()
    email = req.email.strip().lower()

    valid = await verify_otp(redis, email, "registration", req.otp)
    if not valid:
        raise HTTPException(status_code=401, detail="Invalid or expired code")

    with get_db() as db:
        patient = db.query(Patient).filter(Patient.email == email).first()
        if not patient:
            raise HTTPException(status_code=404, detail="Account not found")

        patient.email_verified = True
        patient.status = "active"
        access, refresh = await _issue_tokens(db, patient)
        resp = _token_response(access, refresh, patient)

    return resp


@router.post("/resend-verification")
@limiter.limit("5/minute")
async def resend_verification(request: Request, req: ResendRequest):
    redis = await get_redis()
    email = req.email.strip().lower()

    with get_db() as db:
        patient = db.query(Patient).filter(
            Patient.email == email,
            Patient.status == "pending_verification",
        ).first()
        if not patient:
            return {"status": "sent"}  # silent, prevent enumeration

    code = await generate_and_store(redis, email, "registration")
    await send_verification_email(req.email, code)
    return {"status": "sent"}


@router.post("/login")
@limiter.limit("10/minute")
async def login(request: Request, req: LoginRequest):
    email = req.email.strip().lower()

    with get_db() as db:
        patient = db.query(Patient).filter(Patient.email == email).first()

        if not patient:
            # Timing sentinel to prevent user enumeration
            verify_password(req.password, "$2b$12$aaaaaaaaaaaaaaaaaaaaaa.aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
            raise HTTPException(status_code=401, detail="Invalid email or password")

        if patient.status == "pending_verification":
            raise HTTPException(
                status_code=403,
                detail="Email not verified. Check your inbox for the verification code.",
            )

        if patient.status != "active":
            raise HTTPException(status_code=403, detail="Account is not active")

        if not patient.password_hash or not verify_password(req.password, patient.password_hash):
            raise HTTPException(status_code=401, detail="Invalid email or password")

        access, refresh = await _issue_tokens(db, patient)
        resp = _token_response(access, refresh, patient)

    return resp


@router.post("/refresh")
async def refresh(req: RefreshRequest):
    payload    = verify_refresh_token(req.refresh_token)
    patient_id = payload["sub"]
    jti        = payload["jti"]
    tok_hash   = _hash_token(req.refresh_token)

    with get_db() as db:
        session = db.query(Session).filter(
            Session.refresh_jti == jti,
            Session.patient_id  == patient_id,
            Session.revoked     == False,
        ).first()

        if not session or session.refresh_hash != tok_hash:
            # Possible token theft — revoke all sessions for this patient
            if session:
                db.query(Session).filter(
                    Session.patient_id == patient_id
                ).update({"revoked": True})
            raise HTTPException(status_code=401, detail="Invalid refresh token")

        if session.expires_at < datetime.utcnow():
            raise HTTPException(status_code=401, detail="Refresh token expired")

        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        if not patient or patient.status != "active":
            raise HTTPException(status_code=401, detail="Account inactive")

        session.revoked = True  # rotate: revoke old session
        access, new_refresh = await _issue_tokens(db, patient)
        resp = _token_response(access, new_refresh, patient)

    return resp


@router.post("/logout")
async def logout(req: LogoutRequest):
    try:
        payload = verify_refresh_token(req.refresh_token)
        jti        = payload["jti"]
        patient_id = payload["sub"]
    except HTTPException:
        return {"status": "logged_out"}  # already expired — that's fine

    with get_db() as db:
        session = db.query(Session).filter(
            Session.refresh_jti == jti,
            Session.patient_id  == patient_id,
        ).first()
        if session:
            session.revoked = True

    return {"status": "logged_out"}


@router.post("/forgot-password")
@limiter.limit("5/minute")
async def forgot_password(request: Request, req: ForgotPasswordRequest):
    redis = await get_redis()
    email = req.email.strip().lower()

    with get_db() as db:
        patient = db.query(Patient).filter(
            Patient.email == email,
            Patient.status == "active",
        ).first()

    if patient:
        code = await generate_and_store(redis, email, "password_reset")
        await send_password_reset_email(req.email, code)

    return {"status": "sent", "message": "If this email is registered, a reset code has been sent"}


@router.post("/reset-password")
async def reset_password(req: ResetPasswordRequest):
    redis = await get_redis()
    email = req.email.strip().lower()

    valid = await verify_otp(redis, email, "password_reset", req.otp)
    if not valid:
        raise HTTPException(status_code=401, detail="Invalid or expired code")

    if len(req.new_password) < 8:
        raise HTTPException(status_code=422, detail="Password must be at least 8 characters")

    with get_db() as db:
        patient = db.query(Patient).filter(Patient.email == email).first()
        if not patient:
            raise HTTPException(status_code=404, detail="Account not found")

        patient.password_hash = hash_password(req.new_password)
        db.query(Session).filter(Session.patient_id == patient.id).update({"revoked": True})

    return {"status": "password_updated"}

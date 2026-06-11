import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey
)
from sqlalchemy.orm import declarative_base

Base = declarative_base()


def _uuid():
    return str(uuid.uuid4())


class Patient(Base):
    __tablename__ = "patients"

    id                  = Column(String, primary_key=True, default=_uuid)
    name                = Column(String, nullable=False)
    email               = Column(String, unique=True, nullable=True)   # primary identifier
    password_hash       = Column(String, nullable=True)
    email_verified      = Column(Boolean, default=False)
    phone               = Column(String, unique=True, nullable=True)   # guardian contact
    age                 = Column(Integer, nullable=True)
    pregnancy_week      = Column(Integer, default=1)
    risk_level          = Column(String, default="low")   # low | medium | high
    last_bp_reading     = Column(String, nullable=True)   # "120/80"
    last_weight         = Column(Float, nullable=True)
    medical_conditions  = Column(Text, default="")
    guardian_name       = Column(String, nullable=True)
    guardian_phone      = Column(String, nullable=True)
    health_worker_phone = Column(String, nullable=True)
    health_worker_id    = Column(String, nullable=True)
    status              = Column(String, default="active")  # pending_verification | active
    due_date            = Column(String, nullable=True)     # ISO date string
    lang                = Column(String, default="bn")      # bn | en | mixed
    theme               = Column(String, default="dawn")    # dawn | dusk | night
    notifications       = Column(Text, nullable=True)       # JSON: {daily,kicks,meds,mood}
    voice_settings      = Column(Text, nullable=True)       # JSON: {wake,tone}
    city                = Column(String, nullable=True)
    blood_group         = Column(String, nullable=True)
    is_first_pregnancy  = Column(Boolean, default=True)
    created_at          = Column(DateTime, default=datetime.utcnow)


class Session(Base):
    """JWT refresh token sessions — one row per active device/login."""
    __tablename__ = "sessions"

    id           = Column(String, primary_key=True, default=_uuid)
    patient_id   = Column(String, ForeignKey("patients.id"), nullable=False)
    refresh_jti  = Column(String, unique=True, nullable=False)  # JWT ID
    refresh_hash = Column(String, nullable=False)               # SHA-256 of refresh token
    expires_at   = Column(DateTime, nullable=False)
    revoked      = Column(Boolean, default=False)
    created_at   = Column(DateTime, default=datetime.utcnow)


class OtpCode(Base):
    """Short-lived OTP codes for email verification and password reset."""
    __tablename__ = "otp_codes"

    id         = Column(String, primary_key=True, default=_uuid)
    email      = Column(String, nullable=False, index=True)
    purpose    = Column(String, nullable=False)   # "registration" | "password_reset"
    code_hash  = Column(String, nullable=False)
    attempts   = Column(Integer, default=0)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class AuthSession(Base):
    """Legacy phone-OTP sessions — kept for DB compatibility, no longer written to."""
    __tablename__ = "auth_sessions"

    id             = Column(String, primary_key=True, default=_uuid)
    phone          = Column(String, nullable=True)
    patient_id     = Column(String, ForeignKey("patients.id"), nullable=True)
    token          = Column(String, unique=True, nullable=True)
    otp_code       = Column(String, nullable=True)
    otp_expires_at = Column(DateTime, nullable=True)
    created_at     = Column(DateTime, default=datetime.utcnow)


class HealthLog(Base):
    __tablename__ = "health_logs"

    id         = Column(String, primary_key=True, default=_uuid)
    patient_id = Column(String, ForeignKey("patients.id"), nullable=False)
    data_type  = Column(String, nullable=False)  # bp | weight | symptom | mood | medication
    value      = Column(Text, nullable=False)
    severity   = Column(String, nullable=True)   # mild | moderate | severe | emergency
    created_at = Column(DateTime, default=datetime.utcnow)


class Conversation(Base):
    __tablename__ = "conversations"

    id         = Column(String, primary_key=True, default=_uuid)
    patient_id = Column(String, ForeignKey("patients.id"), nullable=False)
    session_id = Column(String, nullable=True, index=True)  # groups turns into one thread
    role       = Column(String, nullable=False)   # user | tara
    content    = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Appointment(Base):
    __tablename__ = "appointments"

    id               = Column(String, primary_key=True, default=_uuid)
    patient_id       = Column(String, ForeignKey("patients.id"), nullable=False)
    appointment_type = Column(String, default="anc")
    scheduled_at     = Column(DateTime, nullable=False)
    location         = Column(String, nullable=True)
    attended         = Column(Boolean, default=False)
    escalated        = Column(Boolean, default=False)


class ProactiveMessage(Base):
    __tablename__ = "proactive_messages"

    id           = Column(String, primary_key=True, default=_uuid)
    patient_id   = Column(String, ForeignKey("patients.id"), nullable=False)
    message      = Column(Text, nullable=False)
    emotion      = Column(String, default="caring")
    concern_type = Column(String, nullable=True)
    read         = Column(Boolean, default=False)
    archived     = Column(Boolean, default=False)
    created_at   = Column(DateTime, default=datetime.utcnow)


class PatientBaseline(Base):
    __tablename__ = "patient_baselines"

    id                   = Column(String, primary_key=True, default=_uuid)
    patient_id           = Column(String, ForeignKey("patients.id"), nullable=False, unique=True)
    baseline_start       = Column(DateTime, nullable=False)
    baseline_complete    = Column(Boolean, default=False)
    completed_at         = Column(DateTime, nullable=True)
    avg_systolic         = Column(Float, nullable=True)
    avg_diastolic        = Column(Float, nullable=True)
    bp_std               = Column(Float, nullable=True)
    bp_reading_count     = Column(Integer, default=0)
    baseline_weight      = Column(Float, nullable=True)
    weight_gain_per_week = Column(Float, nullable=True)
    avg_messages_per_day = Column(Float, nullable=True)
    avg_distress_score   = Column(Float, nullable=True)
    dominant_emotion     = Column(String, nullable=True)
    updated_at           = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class IngestionLog(Base):
    __tablename__ = "ingestion_logs"

    id          = Column(String, primary_key=True, default=_uuid)
    filename    = Column(String, nullable=False)
    status      = Column(String, default="success")
    ingested_at = Column(DateTime, default=datetime.utcnow)


class EmergencyLog(Base):
    __tablename__ = "emergency_logs"

    id                = Column(String, primary_key=True, default=_uuid)
    patient_id        = Column(String, ForeignKey("patients.id"), nullable=False)
    severity          = Column(String, nullable=False)
    message           = Column(Text, nullable=False)
    guardian_notified = Column(Boolean, default=False)
    created_at        = Column(DateTime, default=datetime.utcnow)


class Reminder(Base):
    __tablename__ = "reminders"

    id            = Column(String, primary_key=True, default=_uuid)
    patient_id    = Column(String, ForeignKey("patients.id"), nullable=False)
    reminder_type = Column(String, nullable=False)   # medication | appointment | checkin
    scheduled_at  = Column(String, nullable=False)   # ISO datetime string
    message       = Column(Text, default="")
    sent          = Column(Boolean, default=False)


class WellnessSession(Base):
    __tablename__ = "wellness_sessions"

    id                  = Column(String, primary_key=True, default=_uuid)
    patient_id          = Column(String, ForeignKey("patients.id"), nullable=False)
    session_template_id = Column(String, nullable=False)
    started_at          = Column(DateTime, default=datetime.utcnow)
    completed_at        = Column(DateTime, nullable=True)
    completion_pct      = Column(Float, default=0.0)
    mood_before         = Column(String, nullable=True)
    mood_after          = Column(String, nullable=True)
    notes               = Column(Text, nullable=True)

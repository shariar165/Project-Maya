import sys
import logging
from contextlib import asynccontextmanager
from datetime import datetime, timedelta

# Force UTF-8 stdout/stderr so Bangla text in print() never causes OSError on Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
from io import BytesIO
from typing import Optional

import httpx
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
import os
from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from config import parse_llm_json
from db.models import Appointment, Conversation, HealthLog, Patient, ProactiveMessage, WellnessSession
from db.session import get_db, init_db, close_redis
from auth.router import router as auth_router
from auth.token import verify_access_token
from agents.orchestrator import get_graph, MayaState
from agents.response_composer import compose_tara_response
from tools.patient_tool import save_conversation
from tts.tts_router import get_tara_voice_async
from monitoring.monitoring_agent import (
    scan_all_patients,
    send_medication_reminders,
    send_weekly_summary,
    send_good_morning_messages,
    process_retry_queue,
)
from monitoring.emotion_classifier import build_emotion_classifier

# ── Scheduler setup ───────────────────────────────────────────────────────────

scheduler = BackgroundScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    import asyncio

    init_db()

    loop = asyncio.get_event_loop()

    # Pre-build LangGraph + warm RAG models in threads (avoid blocking event loop)
    await asyncio.gather(
        loop.run_in_executor(None, get_graph),
        loop.run_in_executor(
            None,
            lambda: build_emotion_classifier("docs/raw/data/merged_emotion.csv"),
        ),
    )
    print("[Maya] LangGraph + RAG models + emotion classifier ready.")

    scheduler.add_job(scan_all_patients,         CronTrigger(hour="*/6"),
                      id="scan_all_patients",    replace_existing=True)
    scheduler.add_job(send_medication_reminders,  CronTrigger(hour=3, minute=0),
                      id="medication_reminders", replace_existing=True)
    scheduler.add_job(send_weekly_summary,        CronTrigger(day_of_week="sun", hour=1),
                      id="weekly_summary",       replace_existing=True)
    scheduler.add_job(send_good_morning_messages, CronTrigger(hour=2, minute=0),
                      id="good_morning",         replace_existing=True)
    scheduler.add_job(process_retry_queue,        CronTrigger(minute="*/30"),
                      id="retry_queue",          replace_existing=True)
    scheduler.start()
    print("[Maya] APScheduler started (5 jobs).")

    yield

    scheduler.shutdown()
    await close_redis()
    print("[Maya] APScheduler stopped.")


# ── FastAPI app ───────────────────────────────────────────────────────────────

app = FastAPI(title="Maya Maternal Health API", version="1.0", lifespan=lifespan)

_cors_origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "*").split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.include_router(auth_router)


# ── Request/Response models ───────────────────────────────────────────────────

class AskRequest(BaseModel):
    patient_id: str
    message:    str
    source:     str = "chat"
    context:    list = []
    session_id: Optional[str] = None

class TTSRequest(BaseModel):
    text: str

class HealthLogRequest(BaseModel):
    patient_id: str
    data_type:  str
    value:      str

class UpdateProfileRequest(BaseModel):
    name:               Optional[str]  = None
    pregnancy_week:     Optional[int]  = None
    lang:               Optional[str]  = None
    theme:              Optional[str]  = None
    notifications:      Optional[str]  = None   # JSON string
    voice_settings:     Optional[str]  = None   # JSON string
    age:                Optional[int]  = None
    city:               Optional[str]  = None
    blood_group:        Optional[str]  = None
    is_first_pregnancy: Optional[bool] = None
    guardian_name:      Optional[str]  = None
    guardian_phone:     Optional[str]  = None


class WellnessCompleteRequest(BaseModel):
    patient_id:          str
    session_template_id: str
    completion_pct:      float = 100.0
    mood_before:         Optional[str] = None
    mood_after:          Optional[str] = None


class RiskScoreRequest(BaseModel):
    patient_id: str
    symptoms:   list = []   # list of symptom keys e.g. ["headache", "swelling"]


class CreateAppointmentRequest(BaseModel):
    patient_id:       str
    appointment_type: str = "anc"   # anc | ultrasound | followup | general
    scheduled_at:     str           # ISO-8601 datetime string e.g. "2026-06-15T09:00:00"
    location:         Optional[str] = None


_SYMPTOM_WEIGHTS: dict = {
    "headache": 2,
    "swelling": 4,
    "vision":   4,
    "bleeding": 5,
    "pain":     4,
    "fever":    3,
    "kicks":    3,
    "nausea":   2,
    "breath":   4,
    "mood":     3,
}


# ── Profile endpoints ────────────────────────────────────────────────────────

@app.get("/profile/{patient_id}")
async def get_profile(patient_id: str, authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    verify_access_token(authorization.split(" ", 1)[1])
    with get_db() as db:
        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        return {
            "id":               patient.id,
            "phone":            patient.phone,
            "name":             patient.name,
            "pregnancyWeek":    patient.pregnancy_week,
            "lang":             patient.lang,
            "theme":            patient.theme or "dawn",
            "notifications":    patient.notifications,
            "voiceSettings":    patient.voice_settings,
            "age":              patient.age,
            "city":             patient.city,
            "bloodGroup":       patient.blood_group,
            "isFirstPregnancy": patient.is_first_pregnancy,
            "guardianName":     patient.guardian_name,
            "guardianPhone":    patient.guardian_phone,
            "lastWeight":       patient.last_weight,
            "lastBpReading":    patient.last_bp_reading,
        }


@app.put("/profile/{patient_id}")
async def update_profile(
    patient_id: str,
    req: UpdateProfileRequest,
    authorization: Optional[str] = Header(None),
):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    verify_access_token(authorization.split(" ", 1)[1])
    with get_db() as db:
        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")

        if req.name               is not None: patient.name               = req.name
        if req.pregnancy_week     is not None:
            patient.pregnancy_week = req.pregnancy_week
            from datetime import date, timedelta
            weeks_remaining = 40 - req.pregnancy_week
            patient.due_date = (date.today() + timedelta(weeks=weeks_remaining)).isoformat()
        if req.lang               is not None: patient.lang               = req.lang
        if req.theme              is not None: patient.theme              = req.theme
        if req.notifications      is not None: patient.notifications      = req.notifications
        if req.voice_settings     is not None: patient.voice_settings     = req.voice_settings
        if req.age                is not None: patient.age                = req.age
        if req.city               is not None: patient.city               = req.city
        if req.blood_group        is not None: patient.blood_group        = req.blood_group
        if req.is_first_pregnancy is not None: patient.is_first_pregnancy = req.is_first_pregnancy
        if req.guardian_name      is not None: patient.guardian_name      = req.guardian_name
        if req.guardian_phone     is not None: patient.guardian_phone     = req.guardian_phone

        return {
            "status":           "updated",
            "id":               patient.id,
            "name":             patient.name,
            "pregnancyWeek":    patient.pregnancy_week,
            "lang":             patient.lang,
            "theme":            patient.theme or "dawn",
            "notifications":    patient.notifications,
            "voiceSettings":    patient.voice_settings,
            "age":              patient.age,
            "city":             patient.city,
            "bloodGroup":       patient.blood_group,
            "isFirstPregnancy": patient.is_first_pregnancy,
            "guardianName":     patient.guardian_name,
            "guardianPhone":    patient.guardian_phone,
        }


# ── Main chat endpoint ────────────────────────────────────────────────────────

@app.post("/ask")
async def ask(req: AskRequest, authorization: Optional[str] = Header(None)):
    """Main endpoint: user message → multi-agent LangGraph → Tara response."""
    is_guest = req.patient_id in ("guest", "", None)
    if not is_guest:
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Missing Authorization header")
        verify_access_token(authorization.split(" ", 1)[1])

    try:
        initial_state: MayaState = {
            "patient_id":           req.patient_id,
            "user_message":         req.message,
            "source":               req.source,
            "patient_profile":      {},
            "conversation_history": req.context if is_guest else [],
            "intent":               "",
            "agent_used":           "",
            "retrieved_chunks":     [],
            "emotion":              "happy",
            "message":              "",
            "tara_action":          "speak",
            "voice_text":           "",
            "guardian_alert":       None,
            "risk_score":           None,
            "distress_level":       "mild",
            "crisis":               False,
            "escalate":             False,
            "resources":            {},
            "suggest_meditation":   False,
        }

        final_state = await get_graph().ainvoke(initial_state)

        if not is_guest:
            save_conversation(req.patient_id, "user", req.message, req.session_id)
            save_conversation(req.patient_id, "tara", final_state.get("message", ""), req.session_id)

        return compose_tara_response(final_state)

    except Exception as e:
        import traceback as _tb
        _err = _tb.format_exc()
        try:
            with open("ask_error.log", "a", encoding="utf-8") as _f:
                _f.write(f"\n--- ERROR ---\n{type(e).__name__}: {e}\n{_err}\n")
        except Exception:
            pass
        return JSONResponse(content={
            "emotion":    "caring",
            "message":    "একটু সমস্যা হচ্ছে। একটু পরে আবার চেষ্টা করুন।",
            "voice_text": "একটু সমস্যা হচ্ছে। একটু পরে আবার চেষ্টা করুন।",
            "tara_hold":  False,
            "agent_used": "fallback",
        })


# ── TTS endpoint ──────────────────────────────────────────────────────────────

@app.post("/tts")
async def tts(req: TTSRequest):
    """Convert text to Tara's voice. Returns MP3 or JSON fallback for browser speech."""
    if not req.text.strip():
        return JSONResponse(status_code=400, content={"error": "Empty text"})
    audio_bytes, use_browser = await get_tara_voice_async(req.text)
    if use_browser:
        return JSONResponse(content={"fallback": True, "text": req.text})
    return Response(
        content=audio_bytes,
        media_type="audio/mpeg",
        headers={"Content-Disposition": "inline; filename=tara.mp3"},
    )


# ── Proactive messages ────────────────────────────────────────────────────────

@app.get("/proactive/{patient_id}")
async def get_proactive_message(patient_id: str):
    """Return the next unread proactive message from the monitoring agent."""
    with get_db() as db:
        msg = (
            db.query(ProactiveMessage)
            .filter(
                ProactiveMessage.patient_id == patient_id,
                ProactiveMessage.read       == False,
                ProactiveMessage.archived   == False,
            )
            .order_by(ProactiveMessage.created_at.desc())
            .first()
        )

        if not msg:
            return {"has_message": False}

        msg.read = True

        return {
            "has_message":  True,
            "emotion":      msg.emotion,
            "message":      msg.message,
            "concern_type": msg.concern_type,
        }


# ── Conversation history ──────────────────────────────────────────────────────

@app.get("/conversations/{patient_id}")
async def list_conversations(patient_id: str, authorization: Optional[str] = Header(None)):
    """Return a summary list of all conversation sessions for a patient."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    verify_access_token(authorization.split(" ", 1)[1])
    sessions: dict = {}
    with get_db() as db:
        # Query specific columns → plain tuples, no ORM lazy-loading
        rows = (
            db.query(
                Conversation.session_id,
                Conversation.role,
                Conversation.content,
                Conversation.created_at,
            )
            .filter(
                Conversation.patient_id == patient_id,
                Conversation.session_id.isnot(None),
            )
            .order_by(Conversation.created_at.asc())
            .all()
        )
        for sid, role, content, created_at in rows:
            ts = created_at.isoformat()
            if sid not in sessions:
                sessions[sid] = {"session_id": sid, "name": "", "message_count": 0,
                                 "started_at": ts, "updated_at": ts}
            sessions[sid]["message_count"] += 1
            sessions[sid]["updated_at"] = ts
            if not sessions[sid]["name"] and role == "user":
                sessions[sid]["name"] = content[:60]

    return sorted(sessions.values(), key=lambda s: s["updated_at"], reverse=True)


@app.get("/conversations/{patient_id}/{session_id}")
async def get_conversation_messages(
    patient_id: str, session_id: str, authorization: Optional[str] = Header(None)
):
    """Return all messages for a specific conversation session."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    verify_access_token(authorization.split(" ", 1)[1])
    with get_db() as db:
        rows = (
            db.query(Conversation.role, Conversation.content, Conversation.created_at)
            .filter(
                Conversation.patient_id == patient_id,
                Conversation.session_id == session_id,
            )
            .order_by(Conversation.created_at.asc())
            .all()
        )
        return [{"role": role, "content": content, "created_at": created_at.isoformat()} for role, content, created_at in rows]


@app.delete("/conversations/{patient_id}/{session_id}")
async def delete_conversation(
    patient_id: str, session_id: str, authorization: Optional[str] = Header(None)
):
    """Delete all messages for a specific conversation session."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    verify_access_token(authorization.split(" ", 1)[1])
    with get_db() as db:
        db.query(Conversation).filter(
            Conversation.patient_id == patient_id,
            Conversation.session_id == session_id,
        ).delete()
    return {"status": "deleted"}


# ── Health log ────────────────────────────────────────────────────────────────

@app.post("/health-log")
async def health_log(req: HealthLogRequest):
    from tools.patient_tool import log_health_data
    result = log_health_data(req.patient_id, req.data_type, req.value)
    return {"status": "logged", "detail": result}


@app.post("/risk-score")
async def risk_score(
    req: RiskScoreRequest,
    authorization: Optional[str] = Header(None),
):
    """Compute symptom-based risk level server-side, optionally elevate via ML model,
    and log each symptom to health_logs for future monitoring."""
    is_guest = req.patient_id in ("guest", "", None)
    if not is_guest:
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Missing Authorization header")
        verify_access_token(authorization.split(" ", 1)[1])

    score = sum(_SYMPTOM_WEIGHTS.get(str(s), 0) for s in req.symptoms)
    if score == 0:
        level = "safe"
    elif score <= 3:
        level = "low"
    elif score <= 7:
        level = "moderate"
    else:
        level = "high"

    ml_score = None
    if not is_guest:
        from tools.risk_tool import calculate_risk_score
        from tools.patient_tool import log_health_data
        try:
            ml_score = calculate_risk_score(req.patient_id)
            # ML model signals high risk even if symptom weight is borderline
            if ml_score is not None and ml_score > 0.7 and level in ("safe", "low"):
                level = "moderate"
        except Exception:
            pass
        for sym in req.symptoms:
            try:
                log_health_data(req.patient_id, "symptom", str(sym))
            except Exception:
                pass

    return {"score": score, "level": level, "ml_score": ml_score}


@app.get("/appointments/{patient_id}")
async def get_appointments(patient_id: str, limit: int = 20):
    """Return appointments for a patient sorted by scheduled_at ascending."""
    with get_db() as db:
        appts = (
            db.query(Appointment)
            .filter(Appointment.patient_id == patient_id)
            .order_by(Appointment.scheduled_at.asc())
            .limit(limit)
            .all()
        )
        return [
            {
                "id":               str(a.id),
                "appointment_type": a.appointment_type,
                "scheduled_at":     a.scheduled_at.isoformat() if a.scheduled_at else None,
                "location":         a.location,
                "attended":         a.attended,
            }
            for a in appts
        ]


@app.post("/appointments")
async def create_appointment(
    req: CreateAppointmentRequest,
    authorization: Optional[str] = Header(None),
):
    """Book a new appointment for a patient."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    verify_access_token(authorization.split(" ", 1)[1])

    allowed_types = {"anc", "ultrasound", "followup", "general"}
    if req.appointment_type not in allowed_types:
        raise HTTPException(status_code=422, detail=f"appointment_type must be one of: {', '.join(allowed_types)}")

    try:
        scheduled_dt = datetime.fromisoformat(req.scheduled_at)
    except ValueError:
        raise HTTPException(status_code=422, detail="scheduled_at must be a valid ISO-8601 datetime (e.g. 2026-06-15T09:00:00)")

    if scheduled_dt <= datetime.utcnow():
        raise HTTPException(status_code=400, detail="Appointment must be scheduled in the future")

    import uuid as _uuid
    with get_db() as db:
        patient = db.query(Patient).filter(Patient.id == req.patient_id).first()
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")

        appt = Appointment(
            id=str(_uuid.uuid4()),
            patient_id=req.patient_id,
            appointment_type=req.appointment_type,
            scheduled_at=scheduled_dt,
            location=req.location,
            attended=False,
            escalated=False,
        )
        db.add(appt)
        appt_id = appt.id
        appt_type = appt.appointment_type
        appt_at = appt.scheduled_at.isoformat()
        appt_loc = appt.location

    return {
        "id":               appt_id,
        "appointment_type": appt_type,
        "scheduled_at":     appt_at,
        "location":         appt_loc,
        "attended":         False,
    }


@app.get("/health-logs/{patient_id}")
async def get_health_logs(
    patient_id: str,
    data_type: Optional[str] = None,
    limit: int = 50,
):
    """Return health logs for a patient sorted newest-first. Filter by data_type if provided."""
    with get_db() as db:
        q = db.query(HealthLog).filter(HealthLog.patient_id == patient_id)
        if data_type:
            q = q.filter(HealthLog.data_type == data_type)
        logs = q.order_by(HealthLog.created_at.desc()).limit(limit).all()
        return [
            {
                "id":         str(l.id),
                "data_type":  l.data_type,
                "value":      l.value,
                "severity":   l.severity,
                "created_at": l.created_at.isoformat() if l.created_at else None,
            }
            for l in logs
        ]


# ── PDF report (for n8n) ──────────────────────────────────────────────────────

@app.post("/generate-report")
async def generate_report(health_worker_id: str, week_ending: str):
    """Generate PDF weekly report for a health worker."""
    from reportlab.pdfgen import canvas as rl_canvas
    from reportlab.lib.pagesizes import A4

    with get_db() as db:
        patients = db.query(Patient).filter(Patient.status == "active").all()

    buffer = BytesIO()
    c = rl_canvas.Canvas(buffer, pagesize=A4)
    width, height = A4

    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, height - 50, f"Maya Weekly Report — {week_ending}")
    c.setFont("Helvetica", 11)

    y = height - 90
    for p in patients:
        c.drawString(50, y, f"{p.name}  |  Week {p.pregnancy_week}  |  Risk: {p.risk_level}")
        y -= 20
        if y < 60:
            c.showPage()
            y = height - 50

    c.save()
    buffer.seek(0)

    return Response(
        content=buffer.read(),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=report_{week_ending}.pdf"},
    )


# ── Wellness endpoints ────────────────────────────────────────────────────────

@app.get("/wellness/recommend")
async def wellness_recommend(
    mood: str = "okay",
    week: int = 20,
    conditions: str = "",
):
    """Return the best session for a given mood + pregnancy week, plus up to 3 alternates."""
    from wellness.recommender import recommend
    cond_list = [c.strip() for c in conditions.split(",") if c.strip()]
    try:
        result = recommend(mood=mood, week=week, conditions=cond_list)
    except Exception as e:
        logging.error("[Wellness] recommend error: %s", e)
        raise HTTPException(status_code=500, detail="Could not compute recommendation")
    return result


@app.get("/wellness/sessions")
async def wellness_sessions(
    category: Optional[str] = None,
    week: int = 20,
    trimester: Optional[int] = None,
):
    """Browse session library filtered by category and trimester."""
    from wellness.session_loader import get_sessions_by_category
    try:
        sessions = get_sessions_by_category(
            category=category or None,
            trimester=trimester,
            week=week if trimester is None else None,
        )
    except Exception as e:
        logging.error("[Wellness] sessions list error: %s", e)
        raise HTTPException(status_code=500, detail="Could not load sessions")
    # Strip heavy steps array for library browse — client fetches full session separately
    return [
        {k: v for k, v in s.items() if k != "steps"}
        for s in sessions
    ]


@app.get("/wellness/sessions/{session_id}")
async def wellness_session_detail(session_id: str):
    """Return the full session JSON including steps."""
    from wellness.session_loader import get_session_by_id
    session = get_session_by_id(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@app.post("/wellness/sessions/complete")
async def wellness_complete(
    req: WellnessCompleteRequest,
    authorization: Optional[str] = Header(None),
):
    """Log a completed (or partially completed) wellness session."""
    is_guest = req.patient_id in ("guest", "", None)
    if not is_guest:
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Missing Authorization header")
        verify_access_token(authorization.split(" ", 1)[1])

    if not is_guest:
        with get_db() as db:
            ws = WellnessSession(
                patient_id=req.patient_id,
                session_template_id=req.session_template_id,
                completed_at=datetime.utcnow(),
                completion_pct=req.completion_pct,
                mood_before=req.mood_before,
                mood_after=req.mood_after,
            )
            db.add(ws)

        # Log mood_after to health_logs so the mood graph picks it up
        if req.mood_after:
            from tools.patient_tool import log_health_data
            log_health_data(req.patient_id, "mood", req.mood_after)

    return {"status": "logged"}


@app.get("/wellness/mood-history/{patient_id}")
async def wellness_mood_history(
    patient_id: str,
    days: int = 7,
    authorization: Optional[str] = Header(None),
):
    """Return the last N days of mood logs for the mood graph."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    verify_access_token(authorization.split(" ", 1)[1])
    with get_db() as db:
        cutoff = datetime.utcnow() - timedelta(days=days)
        logs = (
            db.query(HealthLog)
            .filter(
                HealthLog.patient_id == patient_id,
                HealthLog.data_type == "mood",
                HealthLog.created_at >= cutoff,
            )
            .order_by(HealthLog.created_at.asc())
            .all()
        )

        _MOOD_SCORES = {
            "happy": 5, "tender": 4, "okay": 3,
            "tired": 2, "heavy": 2, "worried": 1,
        }
        result = [
            {
                "date": l.created_at.date().isoformat(),
                "mood": l.value,
                "score": _MOOD_SCORES.get(l.value.lower(), 3),
            }
            for l in logs
        ]
    return result


# ── n8n health check ──────────────────────────────────────────────────────────

@app.get("/n8n/health")
async def n8n_health():
    return {"status": "ok", "service": "maya-backend"}


@app.get("/")
async def root():
    return {"service": "Maya Maternal Health API", "version": "1.0", "status": "running"}


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/debug/email")
async def debug_email(to: str = "delivered@resend.dev"):
    """Temporary: test active email provider by sending to given address."""
    from auth.email_service import _send
    sent = await _send(to, "Maya debug test", "<p>test email from Maya</p>")
    return {"sent": sent, "to": to,
            "provider": "brevo" if os.getenv("BREVO_API_KEY") else
                        "resend" if os.getenv("RESEND_API_KEY") else
                        "smtp"   if os.getenv("SMTP_USER") else "console"}


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

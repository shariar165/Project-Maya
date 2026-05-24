"""
MCP Server 2 — Patient Profile (port 8002)
Exposes SQLite patient data tools for Claude to call directly.
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from datetime import datetime
from fastapi import FastAPI, Header, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from db.session  import get_db, init_db
from db.models   import Patient, HealthLog, Appointment, Reminder
from mcp.shared.auth import verify_api_key

app = FastAPI(title="Maya Patient MCP Server", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    init_db()


@app.get("/")
async def server_info():
    return {
        "name":        "maya-patient-mcp",
        "version":     "1.0",
        "description": "Maya patient profile and health data access",
        "tools":       _tool_definitions(),
    }


@app.get("/tools")
async def list_tools():
    return {"tools": _tool_definitions()}


@app.post("/tools/call")
async def call_tool(request: Request, x_api_key: str = Header(None)):
    verify_api_key(x_api_key)
    body      = await request.json()
    tool_name = body.get("name")
    args      = body.get("arguments", {})

    handlers = {
        "get_patient":       _get_patient,
        "update_symptoms":   _update_symptoms,
        "log_health_data":   _log_health_data,
        "schedule_reminder": _schedule_reminder,
        "get_risk_score":    _get_risk_score,
        "trigger_alert":     _trigger_alert,
        "get_appointments":  _get_appointments,
        "get_health_trend":  _get_health_trend,
    }

    handler = handlers.get(tool_name)
    if not handler:
        raise HTTPException(status_code=404, detail=f"Unknown tool: {tool_name}")

    result = await handler(args)
    return {"content": [{"type": "text", "text": json.dumps(result, ensure_ascii=False)}]}


# ── Tool implementations ──────────────────────────────────────────────────────

async def _get_patient(args: dict) -> dict:
    pid = args.get("patient_id")
    if not pid:
        return {"error": "patient_id required"}

    with get_db() as db:
        p = db.query(Patient).filter(Patient.id == pid).first()
        if not p:
            return {"error": f"Patient {pid} not found"}
        return {
            "id":               p.id,
            "name":             p.name,
            "age":              p.age,
            "pregnancy_week":   p.pregnancy_week,
            "trimester":        1 if p.pregnancy_week <= 13 else (2 if p.pregnancy_week <= 26 else 3),
            "risk_level":       p.risk_level,
            "last_bp":          p.last_bp_reading,
            "last_weight":      p.last_weight,
            "conditions":       p.medical_conditions or "",
            "guardian_phone":   p.guardian_phone,
            "due_date":         p.due_date,
        }


async def _update_symptoms(args: dict) -> dict:
    pid      = args.get("patient_id")
    symptoms = args.get("symptoms")
    severity = args.get("severity", "mild")

    if not pid or not symptoms:
        return {"error": "patient_id and symptoms required"}

    with get_db() as db:
        log = HealthLog(
            patient_id=pid,
            data_type="symptom",
            value=symptoms,
            severity=severity,
            created_at=datetime.utcnow(),
        )
        db.add(log)

        if severity in ["severe", "emergency"]:
            p = db.query(Patient).filter(Patient.id == pid).first()
            if p:
                p.risk_level = "high"

    return {"status": "logged", "severity": severity}


async def _log_health_data(args: dict) -> dict:
    pid       = args.get("patient_id")
    data_type = args.get("data_type")
    value     = args.get("value")

    if not all([pid, data_type, value]):
        return {"error": "patient_id, data_type, and value all required"}

    with get_db() as db:
        log = HealthLog(patient_id=pid, data_type=data_type, value=str(value))
        db.add(log)

        p = db.query(Patient).filter(Patient.id == pid).first()
        if p:
            if data_type == "bp":
                p.last_bp_reading = str(value)
            elif data_type == "weight":
                try:
                    p.last_weight = float(value)
                except ValueError:
                    pass

    return {"status": "logged", "data_type": data_type, "value": value}


async def _schedule_reminder(args: dict) -> dict:
    pid   = args.get("patient_id")
    rtype = args.get("type")
    at    = args.get("datetime")
    msg   = args.get("message", "")

    with get_db() as db:
        r = Reminder(patient_id=pid, reminder_type=rtype, scheduled_at=at, message=msg)
        db.add(r)

    return {"status": "scheduled", "type": rtype, "at": at}


async def _get_risk_score(args: dict) -> dict:
    from tools.risk_tool import calculate_risk_score
    pid   = args.get("patient_id")
    score = calculate_risk_score(pid)
    level = "low" if score < 0.35 else ("medium" if score < 0.65 else "high")
    return {"patient_id": pid, "risk_score": score, "risk_level": level}


async def _trigger_alert(args: dict) -> dict:
    from tools.alert_tool import send_guardian_alert
    pid      = args.get("patient_id")
    severity = args.get("severity", "moderate")
    message  = args.get("message", "")
    send_guardian_alert(pid, severity, message, "mcp_triggered")
    return {"status": "alert_sent", "severity": severity}


async def _get_appointments(args: dict) -> dict:
    pid = args.get("patient_id")
    with get_db() as db:
        appts = (
            db.query(Appointment)
            .filter(
                Appointment.patient_id   == pid,
                Appointment.scheduled_at >= datetime.utcnow(),
            )
            .order_by(Appointment.scheduled_at)
            .limit(5)
            .all()
        )
    return {
        "appointments": [
            {
                "id":           a.id,
                "type":         a.appointment_type,
                "scheduled_at": str(a.scheduled_at),
                "location":     a.location,
                "attended":     a.attended,
            }
            for a in appts
        ]
    }


async def _get_health_trend(args: dict) -> dict:
    from datetime import timedelta
    pid       = args.get("patient_id")
    data_type = args.get("data_type", "bp")
    days      = int(args.get("days", 7))
    since     = datetime.utcnow() - timedelta(days=days)

    with get_db() as db:
        logs = (
            db.query(HealthLog)
            .filter(
                HealthLog.patient_id == pid,
                HealthLog.data_type  == data_type,
                HealthLog.created_at >= since,
            )
            .order_by(HealthLog.created_at)
            .all()
        )

    return {
        "data_type": data_type,
        "days":      days,
        "readings":  [{"value": l.value, "date": str(l.created_at)} for l in logs],
    }


def _tool_definitions() -> list:
    return [
        {"name": "get_patient",       "description": "Get complete patient profile.", "inputSchema": {"type": "object", "properties": {"patient_id": {"type": "string"}}, "required": ["patient_id"]}},
        {"name": "update_symptoms",   "description": "Log symptoms with severity classification.", "inputSchema": {"type": "object", "properties": {"patient_id": {"type": "string"}, "symptoms": {"type": "string"}, "severity": {"type": "string"}}, "required": ["patient_id", "symptoms"]}},
        {"name": "log_health_data",   "description": "Log health measurement (bp, weight, mood, medication).", "inputSchema": {"type": "object", "properties": {"patient_id": {"type": "string"}, "data_type": {"type": "string"}, "value": {"type": "string"}}, "required": ["patient_id", "data_type", "value"]}},
        {"name": "schedule_reminder", "description": "Schedule a reminder for medication or appointment.", "inputSchema": {"type": "object", "properties": {"patient_id": {"type": "string"}, "type": {"type": "string"}, "datetime": {"type": "string"}, "message": {"type": "string"}}, "required": ["patient_id", "type", "datetime"]}},
        {"name": "get_risk_score",    "description": "Get current ML risk score (0.0 low to 1.0 high).", "inputSchema": {"type": "object", "properties": {"patient_id": {"type": "string"}}, "required": ["patient_id"]}},
        {"name": "trigger_alert",     "description": "Send alert to patient's guardian.", "inputSchema": {"type": "object", "properties": {"patient_id": {"type": "string"}, "severity": {"type": "string"}, "message": {"type": "string"}}, "required": ["patient_id", "severity", "message"]}},
        {"name": "get_appointments",  "description": "Get upcoming appointments.", "inputSchema": {"type": "object", "properties": {"patient_id": {"type": "string"}}, "required": ["patient_id"]}},
        {"name": "get_health_trend",  "description": "Get health data trend over N days.", "inputSchema": {"type": "object", "properties": {"patient_id": {"type": "string"}, "data_type": {"type": "string"}, "days": {"type": "integer"}}, "required": ["patient_id"]}},
    ]


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)

import logging
import httpx
import os
from config import N8N_BASE_URL
from db.session import get_db
from db.models  import Patient, EmergencyLog

log = logging.getLogger("maya.alert")


def _send_sms(phone: str, message: str):
    """Stub SMS sender — replace with SSL Wireless or bKash SMS API in production."""
    api_token = os.getenv("SSL_WIRELESS_API_TOKEN", "")
    sid       = os.getenv("SSL_WIRELESS_SID", "MAYA_HEALTH")

    if not api_token:
        log.info("SMS STUB To %s: %s", phone, message)
        return

    try:
        httpx.post(
            "https://sms.sslwireless.com/pushapi/dynamic/server.php",
            data={"api_token": api_token, "sid": sid, "msisdn": phone, "sms": message},
            timeout=10,
        )
    except Exception as e:
        log.warning("SMS failed to %s: %s", phone, type(e).__name__)


def send_guardian_alert(
    patient_id: str,
    severity: str,
    message: str,
    action: str = "",
) -> str:
    """Send alert to patient's guardian (and health worker for severe/emergency)."""
    with get_db() as db:
        p = db.query(Patient).filter(Patient.id == patient_id).first()
        if not p:
            return "Patient not found"

        guardian_phone = p.guardian_phone
        hw_phone       = p.health_worker_phone
        patient_name   = p.name

        # Log emergency
        log = EmergencyLog(
            patient_id=patient_id,
            severity=severity,
            message=message,
            guardian_notified=bool(guardian_phone),
        )
        db.add(log)

    alert_text = {
        "moderate":  f"⚠️ {patient_name} এর শারীরিক অবস্থার দিকে একটু নজর দিন।",
        "severe":    f"🔴 {patient_name} এর জন্য আজই ক্লিনিকে যাওয়া দরকার।",
        "emergency": f"🚨 জরুরি! {patient_name} এখনই হাসপাতালে নিন। {message}",
    }.get(severity, message)

    if guardian_phone:
        _send_sms(guardian_phone, alert_text)
    if severity in ["severe", "emergency"] and hw_phone:
        _send_sms(hw_phone, alert_text)

    # Also fire n8n emergency workflow if available
    if severity == "emergency":
        try:
            httpx.post(
                f"{N8N_BASE_URL}/webhook/maya-emergency",
                json={"patient_id": patient_id, "message": message, "severity": severity},
                timeout=5,
            )
        except Exception:
            pass  # n8n may not be running — that's OK

    return f"Alert sent (severity={severity})"


def send_emergency_alert(patient_id: str, message: str, action: str):
    """Synchronous emergency alert — called directly by emergency agent."""
    send_guardian_alert(patient_id, "emergency", message, action)

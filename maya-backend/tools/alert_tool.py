import logging
import httpx
import os
from config import N8N_BASE_URL
from db.session import get_db
from db.models  import Patient, EmergencyLog

log = logging.getLogger("maya.alert")


def _send_doctor_email_sync(to_email: str, subject: str, html: str):
    brevo_key    = os.getenv("BREVO_API_KEY", "")
    sender_email = os.getenv("BREVO_SENDER_EMAIL", os.getenv("SMTP_USER", ""))
    if brevo_key and sender_email:
        try:
            httpx.post(
                "https://api.brevo.com/v3/smtp/email",
                headers={"api-key": brevo_key, "Content-Type": "application/json"},
                json={"sender": {"name": "Maya Health", "email": sender_email},
                      "to": [{"email": to_email}],
                      "subject": subject, "htmlContent": html},
                timeout=10,
            )
        except Exception as e:
            log.warning("[DoctorEmail] Failed: %s", e)
    else:
        log.info("[DoctorEmail DEV] To: %s | %s", to_email, subject)


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
        patient_week   = p.pregnancy_week or 0
        doctor_email   = p.doctor_email
        doctor_name    = p.doctor_name

        # Log emergency
        elog = EmergencyLog(
            patient_id=patient_id,
            severity=severity,
            message=message,
            guardian_notified=bool(guardian_phone),
        )
        db.add(elog)

    alert_text = {
        "moderate":  f"⚠️ {patient_name} এর শারীরিক অবস্থার দিকে একটু নজর দিন।",
        "severe":    f"🔴 {patient_name} এর জন্য আজই ক্লিনিকে যাওয়া দরকার।",
        "emergency": f"🚨 জরুরি! {patient_name} এখনই হাসপাতালে নিন। {message}",
    }.get(severity, message)

    if guardian_phone:
        _send_sms(guardian_phone, alert_text)
    if severity in ["severe", "emergency"] and hw_phone:
        _send_sms(hw_phone, alert_text)

    if severity in ["severe", "emergency"] and doctor_email:
        from datetime import datetime, timezone, timedelta
        bd_time = datetime.now(timezone(timedelta(hours=6))).strftime("%d %b %Y, %I:%M %p (BD Time)")
        dr = doctor_name or "Doctor"
        html = f"""
<div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#f4ede8;border-radius:16px;overflow:hidden;">
  <div style="background:#3D2840;padding:28px 32px;">
    <div style="color:#F4B4C8;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:6px;">Maya Health — Emergency Alert</div>
    <div style="color:#FFF1E4;font-size:20px;font-weight:700;">🚨 Emergency: Immediate Attention Required</div>
    <div style="color:rgba(255,241,228,0.6);font-size:12px;margin-top:6px;">{bd_time}</div>
  </div>
  <div style="background:#FFFCF7;padding:28px 32px;">
    <p style="color:#2A1A36;font-size:15px;margin:0 0 16px;">Dear {dr},</p>
    <p style="color:#2A1A36;font-size:15px;margin:0 0 20px;">
      Your patient <strong>{patient_name}</strong> (Pregnancy Week {patient_week}) has been identified by Tara AI as needing immediate emergency care.
    </p>
    <div style="background:#FFF1E4;border-radius:12px;padding:16px 20px;margin:0 0 20px;">
      <div style="font-size:11px;color:#7A5E78;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;">Alert Details</div>
      <div style="color:#2A1A36;font-size:14px;line-height:1.8;">
        <div>Severity: <strong style="color:#C0392B;">{severity.upper()}</strong></div>
        <div>Message: <strong>{message}</strong></div>
      </div>
    </div>
    <p style="color:#F08A6E;font-weight:600;font-size:14px;margin:0 0 20px;">This is a medical emergency. Please contact your patient immediately.</p>
    <hr style="border:none;border-top:1px solid #F0E8E0;margin:0 0 16px;"/>
    <p style="color:#7A5E78;font-size:12px;margin:0;">— Maya Health AI companion</p>
  </div>
</div>"""
        subj = f"🚨 Emergency Alert: {patient_name} (Week {patient_week})"
        _send_doctor_email_sync(doctor_email, subj, html)

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

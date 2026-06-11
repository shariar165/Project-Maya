import os
import asyncio
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

import httpx

log = logging.getLogger("maya.email")


async def _send(to_email: str, subject: str, html: str) -> bool:
    brevo_key  = os.getenv("BREVO_API_KEY", "")
    resend_key = os.getenv("RESEND_API_KEY", "")
    smtp_user  = os.getenv("SMTP_USER", "")

    # ── Brevo (Sendinblue) — free 300/day, no domain verification needed ─────
    # Only a verified sender *email* is required (verify once in Brevo dashboard)
    if brevo_key:
        sender_email = os.getenv("BREVO_SENDER_EMAIL", os.getenv("SMTP_USER", ""))
        sender_name  = "Maya Health"
        if not sender_email:
            log.error("[Email/Brevo] BREVO_SENDER_EMAIL not set")
        else:
            try:
                async with httpx.AsyncClient(timeout=15) as client:
                    res = await client.post(
                        "https://api.brevo.com/v3/smtp/email",
                        headers={"api-key": brevo_key, "Content-Type": "application/json"},
                        json={
                            "sender":      {"name": sender_name, "email": sender_email},
                            "to":          [{"email": to_email}],
                            "subject":     subject,
                            "htmlContent": html,
                        },
                    )
                if res.status_code in (200, 201):
                    return True
                log.error("[Email/Brevo] Failed %s: %s", res.status_code, res.text)
                return False
            except Exception as e:
                log.error("[Email/Brevo] Exception: %s", e)
                return False

    # ── Resend API (requires verified domain for sending to all recipients) ──
    if resend_key:
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                res = await client.post(
                    "https://api.resend.com/emails",
                    headers={"Authorization": f"Bearer {resend_key}", "Content-Type": "application/json"},
                    json={"from": "Maya Health <onboarding@resend.dev>",
                          "to": [to_email], "subject": subject, "html": html},
                )
            if res.status_code in (200, 201):
                return True
            log.error("[Email/Resend] Failed %s: %s", res.status_code, res.text)
            return False
        except Exception as e:
            log.error("[Email/Resend] Exception: %s", e)
            return False

    # ── SMTP fallback (local dev with real SMTP credentials) ─────────────────
    if smtp_user:
        host      = os.getenv("SMTP_HOST", "smtp.gmail.com")
        port      = int(os.getenv("SMTP_PORT", "587"))
        password  = os.getenv("SMTP_PASSWORD", "")
        from_addr = os.getenv("EMAIL_FROM", f"Maya Health <{smtp_user}>")

        def _blocking():
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"]    = from_addr
            msg["To"]      = to_email
            msg.attach(MIMEText(html, "html"))
            with smtplib.SMTP(host, port, timeout=15) as s:
                s.ehlo(); s.starttls(); s.login(smtp_user, password)
                s.sendmail(from_addr, to_email, msg.as_string())
            return True

        try:
            loop = asyncio.get_event_loop()
            return await loop.run_in_executor(None, _blocking)
        except Exception as e:
            log.error("[Email/SMTP] Failed: %s", e)
            return False

    # ── Console fallback (dev with no credentials) ───────────────────────────
    plain = html
    for tag in ["<br>", "<br/>", "</p>", "</div>", "</h2>"]:
        plain = plain.replace(tag, "\n")
    import re
    plain = re.sub(r"<[^>]+>", "", plain).strip()
    log.info("[Email DEV] To: %s | Subject: %s\n%s", to_email, subject, plain)
    return False


async def send_verification_email(to_email: str, code: str) -> bool:
    html = f"""
<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
  <h2 style="color:#3D2840;">Welcome to Maya</h2>
  <p style="color:#5A3E5F;">Your email verification code is:</p>
  <div style="font-size:40px;font-weight:700;letter-spacing:10px;color:#3D2840;margin:24px 0;">{code}</div>
  <p style="color:#7A5E78;font-size:13px;">Expires in 5 minutes. Do not share this code.</p>
  <p style="color:#7A5E78;font-size:13px;">— Tara from Maya</p>
</div>
"""
    return await _send(to_email, "Your Maya verification code", html)


async def send_doctor_alert_email(
    to_email: str,
    doctor_name: str,
    patient_name: str,
    patient_week: int,
    trigger: str,
    details: dict = None,
    patient_bp: str = None,
    patient_weight: float = None,
) -> bool:
    details = details or {}
    dr = doctor_name or "Doctor"

    trigger_labels = {
        "sos":    "🆘 SOS — Patient Needs Help Now",
        "risk":   "⚠️ High Risk Symptoms Detected",
        "tara":   "🚨 Emergency — Immediate Attention Required",
        "manual": "📋 Patient Check-In Alert",
    }
    trigger_descs = {
        "sos":    f"triggered an emergency SOS: <strong>{details.get('sos_type', 'unknown')}</strong>",
        "risk":   f"been flagged with <strong>{details.get('level', 'elevated')} risk</strong> symptoms",
        "tara":   "been identified by Tara AI as needing immediate emergency care",
        "manual": "initiated a check-in alert through the Maya app",
    }
    urgency_msgs = {
        "sos":    "Please contact your patient as soon as possible.",
        "risk":   "Please reach out to your patient today to discuss these symptoms.",
        "tara":   "This is a medical emergency. Please contact your patient immediately.",
        "manual": "Your patient would like you to be aware of their current status.",
    }

    symptoms_html = ""
    if details.get("symptoms"):
        syms = ", ".join(details["symptoms"])
        symptoms_html = f"<div style='margin-top:4px;'>Symptoms reported: <strong>{syms}</strong></div>"

    vitals_html = ""
    if patient_bp:
        vitals_html += f"<div style='margin-top:4px;'>Blood pressure: <strong>{patient_bp}</strong></div>"
    if patient_weight:
        vitals_html += f"<div style='margin-top:4px;'>Last weight: <strong>{patient_weight} kg</strong></div>"

    from datetime import datetime, timezone, timedelta
    bd_time = datetime.now(timezone(timedelta(hours=6))).strftime("%d %b %Y, %I:%M %p (BD Time)")

    html = f"""
<div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#f4ede8;border-radius:16px;overflow:hidden;">
  <div style="background:#3D2840;padding:28px 32px;">
    <div style="color:#F4B4C8;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:6px;">Maya Health — Patient Alert</div>
    <div style="color:#FFF1E4;font-size:20px;font-weight:700;line-height:1.3;">{trigger_labels.get(trigger, '⚠️ Patient Alert')}</div>
    <div style="color:rgba(255,241,228,0.6);font-size:12px;margin-top:6px;">{bd_time}</div>
  </div>
  <div style="background:#FFFCF7;padding:28px 32px;">
    <p style="color:#2A1A36;font-size:15px;margin:0 0 16px;">Dear {dr},</p>
    <p style="color:#2A1A36;font-size:15px;margin:0 0 20px;">
      Your patient <strong>{patient_name}</strong> (Pregnancy Week {patient_week}) has {trigger_descs.get(trigger, 'an alert')}.
    </p>
    <div style="background:#FFF1E4;border-radius:12px;padding:16px 20px;margin:0 0 20px;">
      <div style="font-size:11px;color:#7A5E78;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;">Patient Details</div>
      <div style="color:#2A1A36;font-size:14px;line-height:1.8;">
        <div>Name: <strong>{patient_name}</strong></div>
        <div>Pregnancy Week: <strong>{patient_week}</strong></div>
        {vitals_html}
        {symptoms_html}
      </div>
    </div>
    <p style="color:#F08A6E;font-weight:600;font-size:14px;margin:0 0 20px;">{urgency_msgs.get(trigger, 'Please contact your patient.')}</p>
    <hr style="border:none;border-top:1px solid #F0E8E0;margin:0 0 16px;"/>
    <p style="color:#7A5E78;font-size:12px;margin:0 0 4px;">This is an automated alert from Maya Health AI companion.</p>
    <p style="color:#7A5E78;font-size:12px;margin:0;">— Maya Health Team</p>
  </div>
</div>
"""
    subject = f"{trigger_labels.get(trigger, '⚠️ Alert')}: {patient_name} (Week {patient_week})"
    return await _send(to_email, subject, html)


async def send_password_reset_email(to_email: str, code: str) -> bool:
    html = f"""
<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
  <h2 style="color:#3D2840;">Reset Your Password</h2>
  <p style="color:#5A3E5F;">Your password reset code is:</p>
  <div style="font-size:40px;font-weight:700;letter-spacing:10px;color:#3D2840;margin:24px 0;">{code}</div>
  <p style="color:#7A5E78;font-size:13px;">Expires in 5 minutes. If you did not request this, ignore this email.</p>
  <p style="color:#7A5E78;font-size:13px;">— Tara from Maya</p>
</div>
"""
    return await _send(to_email, "Reset your Maya password", html)

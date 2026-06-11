import os
import asyncio
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

import httpx

log = logging.getLogger("maya.email")


async def _send(to_email: str, subject: str, html: str) -> bool:
    resend_key = os.getenv("RESEND_API_KEY", "")
    smtp_user  = os.getenv("SMTP_USER", "")

    # ── Resend API (preferred — works on Railway) ────────────────────────────
    if resend_key:
        from_addr = os.getenv("EMAIL_FROM", "Maya Health <onboarding@resend.dev>")
        # Resend requires a verified domain for custom from-address;
        # fall back to their sandbox address on free plan.
        if "resend.dev" not in from_addr and not os.getenv("RESEND_DOMAIN_VERIFIED", ""):
            from_addr = "Maya Health <onboarding@resend.dev>"
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                res = await client.post(
                    "https://api.resend.com/emails",
                    headers={
                        "Authorization": f"Bearer {resend_key}",
                        "Content-Type": "application/json",
                    },
                    json={"from": from_addr, "to": [to_email], "subject": subject, "html": html},
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

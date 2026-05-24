import logging
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta
from typing import Optional

import numpy as np

from db.session import get_db
from db.models import (
    Patient, HealthLog, Conversation, Appointment,
    ProactiveMessage, PatientBaseline,
)
from config import call_llm_with_fallback, parse_llm_json
from tools.alert_tool import send_guardian_alert
from tools.risk_tool import calculate_risk_score
from monitoring.emotion_classifier import score_conversation_turns
from monitoring.baseline_manager import (
    is_baseline_period,
    update_baseline_if_needed,
    get_bp_alert_threshold,
    get_or_create_baseline,
)
from monitoring.message_templates import get_template

log = logging.getLogger("maya.monitor")

_MAX_WORKERS = 10

_retry_queue: list[tuple[str, float]] = []

_CONCERN_SEVERITY: dict[str, int] = {
    "risk_critical":              10,
    "bp_high_absolute":           9,
    "bp_rising":                  8,
    "anc_missed_third_trimester": 7,
    "emotional_distress":         6,
    "risk_elevated":              5,
    "medication_critical":        4,
    "appointment_missed":         3,
    "bp_above_personal_baseline": 2,
    "medication_missed":          1,
    "emotional_silence":          1,
    "frequent_symptoms":          1,
    "inactivity":                 0,
    "good_morning":               0,
}

_BANGLA_MESSAGE_SYSTEM = (
    "তুমি মায়া অ্যাপের AI সহযোগী তারা। "
    "একজন গর্ভবতী মায়ের জন্য একটি উষ্ণ, যত্নশীল বাংলা বার্তা তৈরি করো। "
    "সর্বোচ্চ দুটি বাক্য। 'আপনি' ফর্ম ব্যবহার করো। "
    "শুধু বাংলা টেক্সট — কোনো JSON বা ইংরেজি নয়।"
)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _trimester(week: int) -> str:
    if week <= 13:
        return "first"
    if week <= 26:
        return "second"
    return "third"


def _generate_message(concern_type: str, week: int, trimester: str, extra: str = "") -> str:
    user_prompt = (
        f"উদ্বেগের ধরন: {concern_type}. গর্ভসপ্তাহ: {week}. {extra}"
        f" উপযুক্ত একটি বার্তা তৈরি করো।"
    )
    try:
        raw = call_llm_with_fallback(
            messages=[{"role": "user", "content": user_prompt}],
            system=_BANGLA_MESSAGE_SYSTEM,
            max_tokens=150,
        )
        # Reject if it looks like the generic hardcoded fallback (very short or JSON-like)
        if raw and len(raw.strip()) > 20 and not raw.strip().startswith("{"):
            return raw.strip()
    except Exception as e:
        log.debug("LLM message generation failed (%s), using template.", e)
    return get_template(concern_type, trimester)


# ── Archival ──────────────────────────────────────────────────────────────────

def _archive_old_messages() -> None:
    cutoff = datetime.utcnow() - timedelta(days=7)

    with get_db() as db:
        # Bulk-archive unread messages older than 7 days
        db.query(ProactiveMessage).filter(
            ProactiveMessage.read == False,
            ProactiveMessage.archived == False,
            ProactiveMessage.created_at < cutoff,
        ).update({"archived": True})

        # Find patients with more than 3 active unread messages
        from sqlalchemy import func
        flood_rows = (
            db.query(ProactiveMessage.patient_id, func.count(ProactiveMessage.id).label("cnt"))
            .filter(ProactiveMessage.read == False, ProactiveMessage.archived == False)
            .group_by(ProactiveMessage.patient_id)
            .having(func.count(ProactiveMessage.id) > 3)
            .all()
        )
        flooded_pids = [r.patient_id for r in flood_rows]

    for pid in flooded_pids:
        with get_db() as db:
            msgs = (
                db.query(ProactiveMessage)
                .filter(
                    ProactiveMessage.patient_id == pid,
                    ProactiveMessage.read == False,
                    ProactiveMessage.archived == False,
                )
                .all()
            )
            if not msgs:
                continue

            # Determine keep set: newest + most severe (may be same message)
            keep_ids: set[str] = set()
            keep_ids.add(max(msgs, key=lambda m: m.created_at).id)
            keep_ids.add(
                max(msgs, key=lambda m: _CONCERN_SEVERITY.get(m.concern_type or "", 0)).id
            )

            for msg in msgs:
                if msg.id not in keep_ids:
                    msg.archived = True


# ── Message queue ─────────────────────────────────────────────────────────────

def _queue_proactive_message(patient_id: str, concern: dict, trimester: str, week: int = 20) -> None:
    with get_db() as db:
        existing = (
            db.query(ProactiveMessage)
            .filter(
                ProactiveMessage.patient_id   == patient_id,
                ProactiveMessage.concern_type == concern["type"],
                ProactiveMessage.read         == False,
                ProactiveMessage.archived     == False,
            )
            .first()
        )
        if existing:
            return

    message = _generate_message(concern["type"], week, trimester, concern.get("extra", ""))

    with get_db() as db:
        msg = ProactiveMessage(
            patient_id=patient_id,
            message=message,
            emotion=concern.get("emotion", "caring"),
            concern_type=concern["type"],
            archived=False,
        )
        db.add(msg)

    if concern.get("alert_guardian"):
        try:
            send_guardian_alert(
                patient_id=patient_id,
                severity=concern.get("severity", "moderate"),
                message=message,
                action="check_on_patient",
            )
        except Exception as e:
            log.warning("Guardian alert failed for %s: %s", patient_id, e)

    if concern.get("alert_health_worker"):
        try:
            send_guardian_alert(
                patient_id=patient_id,
                severity="moderate",
                message=message,
                action="call_health_worker",
            )
        except Exception as e:
            log.warning("Health worker alert failed for %s: %s", patient_id, e)

    log.info("Queued [%s] for patient %s", concern["type"], patient_id)


# ── Detection Module 1: BP Trend ──────────────────────────────────────────────

def _check_bp_trend(
    patient_id: str,
    log_data: list[tuple],
    baseline: dict,
    in_baseline: bool,
) -> Optional[dict]:
    bp_entries = [
        (val, ts)
        for dtype, val, ts in log_data
        if dtype == "bp" and "/" in val
    ]
    if len(bp_entries) < 3:
        return None

    systolics: list[float] = []
    for val, _ in bp_entries[:7]:
        try:
            systolics.append(float(val.split("/")[0]))
        except ValueError:
            pass

    if len(systolics) < 3:
        return None

    if in_baseline:
        return None

    upper_thresh, _ = get_bp_alert_threshold(patient_id)

    # Absolute danger (newest reading)
    if systolics[0] > 140:
        return {
            "type":          "bp_high_absolute",
            "emotion":       "alert",
            "alert_guardian": True,
            "severity":      "severe",
            "extra":         f"রক্তচাপ {systolics[0]:.0f}",
        }

    # Logs are DESC by created_at → systolics[0] is the newest reading.
    # Rising BP over time means newest > previous → systolics[i] > systolics[i+1].
    is_rising = all(systolics[i] > systolics[i + 1] for i in range(2))
    if is_rising and systolics[0] > upper_thresh:
        return {
            "type":          "bp_rising",
            "emotion":       "alert",
            "alert_guardian": True,
            "severity":      "moderate",
            "extra":         f"রক্তচাপ বাড়ছে ({systolics[0]:.0f})",
        }

    # Above personal baseline by 1.5 SD
    avg_s = baseline.get("avg_systolic")
    std_s = baseline.get("bp_std") or 5.0
    if avg_s and np.mean(systolics) > avg_s + 1.5 * std_s:
        return {
            "type":          "bp_above_personal_baseline",
            "emotion":       "caring",
            "alert_guardian": False,
            "extra":         f"গড় {np.mean(systolics):.0f}, স্বাভাবিক {avg_s:.0f}",
        }

    return None


# ── Detection Module 2: Emotional Pattern ────────────────────────────────────

def _check_emotional_pattern(
    patient_id: str,
    conv_turns: list[tuple],
    baseline: dict,
    in_baseline: bool,
    trimester: str,
) -> Optional[dict]:
    texts     = [content for content, _ in conv_turns]
    conv_dates = [ts for _, ts in conv_turns]

    # Silence detection
    if conv_dates and (baseline.get("avg_messages_per_day") or 0) > 0:
        days_since = (datetime.utcnow() - max(conv_dates)).days
        if days_since >= 3:
            return {
                "type":    "emotional_silence",
                "emotion": "caring",
                "alert_guardian": False,
            }

    avg_score = score_conversation_turns(texts)
    if avg_score is None:
        return None

    # Sustained distress: high avg score + 3+ turns in last 72h
    recent_cutoff = datetime.utcnow() - timedelta(hours=72)
    recent_count  = sum(1 for ts in conv_dates if ts >= recent_cutoff)

    if avg_score >= 0.70 and recent_count >= 3:
        return {
            "type":    "emotional_distress",
            "emotion": "caring",
            "alert_guardian": False,
            "extra":   "মানসিক কষ্টের লক্ষণ পাওয়া গেছে",
        }

    return None


# ── Detection Module 3: Medication Compliance ─────────────────────────────────

def _check_medication_compliance(
    patient_id: str,
    log_data: list[tuple],
    trimester: str,
    reminder_job: bool = False,
) -> Optional[dict]:
    # Bangladesh daytime: 8am–9pm BD = 2am–3pm UTC
    utc_hour = datetime.utcnow().hour
    if utc_hour < 2 or utc_hour >= 15:
        return None

    # Group medication logs by calendar date (UTC)
    med_dates: set[str] = set()
    for dtype, val, ts in log_data:
        if dtype == "medication":
            med_dates.add(ts.strftime("%Y-%m-%d"))

    today = datetime.utcnow().date()
    consecutive_missed = 0
    for delta in range(7):
        day = (today - timedelta(days=delta)).strftime("%Y-%m-%d")
        if day not in med_dates:
            consecutive_missed += 1
        else:
            break

    if consecutive_missed == 0:
        return None

    if consecutive_missed >= 5:
        return {
            "type":              "medication_critical",
            "emotion":           "caring",
            "alert_health_worker": True,
            "alert_guardian":    False,
            "extra":             f"{consecutive_missed} দিন ওষুধ বাদ পড়েছে",
        }

    if consecutive_missed >= 2:
        return {
            "type":          "medication_missed",
            "emotion":       "caring",
            "alert_guardian": False,
            "extra":         f"{consecutive_missed} দিন ওষুধ বাদ পড়েছে",
        }

    return None


# ── Detection Module 4: Appointment Compliance ───────────────────────────────

def _check_appointment_compliance(
    patient_id: str,
    missed_appts: list[tuple],
    pregnancy_week: int,
) -> Optional[dict]:
    if not missed_appts:
        return None

    # Pick the most severe missed appointment
    best_appt_id = None
    best_type    = "appointment_missed"
    best_alert   = False

    for appt_id, appt_type, scheduled_at in missed_appts:
        is_anc         = (appt_type or "").lower() == "anc"
        is_third_tri   = pregnancy_week >= 28
        if is_anc and is_third_tri:
            best_appt_id = appt_id
            best_type    = "anc_missed_third_trimester"
            best_alert   = True
            break
        if best_appt_id is None:
            best_appt_id = appt_id

    # Mark escalated to prevent repeated alerts
    if best_appt_id:
        with get_db() as db:
            appt = db.query(Appointment).filter(Appointment.id == best_appt_id).first()
            if appt:
                appt.escalated = True

    return {
        "type":          best_type,
        "emotion":       "caring",
        "alert_guardian": best_alert,
        "severity":      "moderate" if best_alert else None,
    }


# ── Detection Module 5: Risk Score ───────────────────────────────────────────

def _check_risk_score(patient_id: str, current_risk_level: str) -> Optional[dict]:
    try:
        new_score = calculate_risk_score(patient_id)
    except Exception as e:
        log.warning("Risk score calculation failed for %s: %s", patient_id, e)
        return None

    if new_score < 0.4:
        new_level = "low"
    elif new_score < 0.7:
        new_level = "medium"
    else:
        new_level = "high"

    # Persist updated risk level
    if new_level != current_risk_level:
        with get_db() as db:
            p = db.query(Patient).filter(Patient.id == patient_id).first()
            if p:
                p.risk_level = new_level

    # Critical threshold
    if new_score > 0.8:
        return {
            "type":          "risk_critical",
            "emotion":       "alert",
            "alert_guardian": True,
            "severity":      "severe",
            "extra":         f"ঝুঁকি স্কোর {new_score:.2f}",
        }

    # Medium → high transition
    if current_risk_level == "medium" and new_level == "high":
        return {
            "type":              "risk_elevated",
            "emotion":           "caring",
            "alert_health_worker": True,
            "alert_guardian":    False,
            "extra":             f"ঝুঁকি স্কোর {new_score:.2f}",
        }

    return None


# ── Per-patient core ──────────────────────────────────────────────────────────

def _check_patient(patient_id: str) -> None:
    update_baseline_if_needed(patient_id)

    # Fetch patient primitives
    with get_db() as db:
        p = db.query(Patient).filter(Patient.id == patient_id).first()
        if not p or p.status != "active":
            return
        pregnancy_week = p.pregnancy_week or 20
        risk_level     = p.risk_level or "low"

    tri = _trimester(pregnancy_week)

    cutoff_7d  = datetime.utcnow() - timedelta(days=7)
    cutoff_48h = datetime.utcnow() - timedelta(hours=48)

    # Fetch health logs
    with get_db() as db:
        logs_raw = (
            db.query(HealthLog)
            .filter(
                HealthLog.patient_id == patient_id,
                HealthLog.created_at >= cutoff_7d,
            )
            .order_by(HealthLog.created_at.desc())
            .all()
        )
        log_data = [(l.data_type, l.value or "", l.created_at) for l in logs_raw]

    # Fetch last 10 user conversation turns
    with get_db() as db:
        convs_raw = (
            db.query(Conversation)
            .filter(
                Conversation.patient_id == patient_id,
                Conversation.role       == "user",
            )
            .order_by(Conversation.created_at.desc())
            .limit(10)
            .all()
        )
        conv_turns = [(c.content, c.created_at) for c in convs_raw]

    # Fetch missed appointments (last 48h, not attended, not escalated)
    with get_db() as db:
        appts_raw = (
            db.query(Appointment)
            .filter(
                Appointment.patient_id == patient_id,
                Appointment.scheduled_at >= cutoff_48h,
                Appointment.scheduled_at <= datetime.utcnow(),
                Appointment.attended  == False,
                Appointment.escalated == False,
            )
            .all()
        )
        missed_appts = [(a.id, a.appointment_type, a.scheduled_at) for a in appts_raw]

    in_baseline = is_baseline_period(patient_id)
    baseline    = get_or_create_baseline(patient_id)

    concerns = [
        _check_bp_trend(patient_id, log_data, baseline, in_baseline),
        _check_emotional_pattern(patient_id, conv_turns, baseline, in_baseline, tri),
        _check_medication_compliance(patient_id, log_data, tri),
        _check_appointment_compliance(patient_id, missed_appts, pregnancy_week),
        _check_risk_score(patient_id, risk_level),
    ]

    for concern in filter(None, concerns):
        _queue_proactive_message(patient_id, concern, tri, pregnancy_week)


# ── Scheduled jobs ────────────────────────────────────────────────────────────

def scan_all_patients() -> None:
    """Runs every 6 hours. Scans all active patients using all 6 detection modules."""
    with get_db() as db:
        patient_ids = [
            p.id for p in
            db.query(Patient).filter(Patient.status == "active").all()
        ]

    log.info("Starting scan for %d active patients...", len(patient_ids))
    _archive_old_messages()

    errored = 0
    with ThreadPoolExecutor(max_workers=_MAX_WORKERS) as executor:
        futures = {executor.submit(_check_patient, pid): pid for pid in patient_ids}
        for future in as_completed(futures):
            pid = futures[future]
            try:
                future.result()
            except Exception as e:
                log.warning("Error scanning patient %s: %s", pid, e)
                _retry_queue.append((pid, time.time()))
                errored += 1

    log.info("Scan complete. %d ok, %d errored.", len(patient_ids) - errored, errored)


def send_medication_reminders() -> None:
    """Daily 3am UTC (9am Bangladesh). Checks medication compliance for all active patients."""
    with get_db() as db:
        rows = (
            db.query(Patient.id, Patient.pregnancy_week)
            .filter(Patient.status == "active")
            .all()
        )
        patients = [(r.id, r.pregnancy_week or 20) for r in rows]

    cutoff_7d = datetime.utcnow() - timedelta(days=7)
    for pid, week in patients:
        try:
            with get_db() as db:
                logs_raw = (
                    db.query(HealthLog)
                    .filter(
                        HealthLog.patient_id == pid,
                        HealthLog.created_at >= cutoff_7d,
                    )
                    .order_by(HealthLog.created_at.desc())
                    .all()
                )
                log_data = [(l.data_type, l.value or "", l.created_at) for l in logs_raw]

            tri = _trimester(week)
            concern = _check_medication_compliance(pid, log_data, tri, reminder_job=True)
            if concern:
                _queue_proactive_message(pid, concern, tri, week)
        except Exception as e:
            log.warning("Medication reminder failed for %s: %s", pid, e)


def send_weekly_summary() -> None:
    """Sunday 1am UTC (7am Bangladesh). Generates personalised weekly summary for each patient."""
    with get_db() as db:
        rows = (
            db.query(Patient.id, Patient.pregnancy_week, Patient.name)
            .filter(Patient.status == "active")
            .all()
        )
        patients = [(r.id, r.pregnancy_week or 20, r.name or "মা") for r in rows]

    cutoff_7d = datetime.utcnow() - timedelta(days=7)
    for pid, week, name in patients:
        try:
            tri = _trimester(week)

            with get_db() as db:
                log_count = (
                    db.query(HealthLog)
                    .filter(HealthLog.patient_id == pid, HealthLog.created_at >= cutoff_7d)
                    .count()
                )
                appt_count = (
                    db.query(Appointment)
                    .filter(
                        Appointment.patient_id == pid,
                        Appointment.scheduled_at >= cutoff_7d,
                    )
                    .count()
                )
                attended_count = (
                    db.query(Appointment)
                    .filter(
                        Appointment.patient_id == pid,
                        Appointment.scheduled_at >= cutoff_7d,
                        Appointment.attended == True,
                    )
                    .count()
                )

            summary_prompt = (
                f"গর্ভবতী মা {name}-এর জন্য এই সপ্তাহের সারসংক্ষেপ তৈরি করো। "
                f"গর্ভসপ্তাহ: {week}। "
                f"স্বাস্থ্য রেকর্ড: {log_count}টি। "
                f"অ্যাপয়েন্টমেন্ট: {appt_count}টির মধ্যে {attended_count}টিতে গেছেন। "
                f"উৎসাহব্যঞ্জক ও যত্নশীল বাংলায় ৩ বাক্যের মধ্যে লেখো।"
            )

            raw = call_llm_with_fallback(
                messages=[{"role": "user", "content": summary_prompt}],
                system=_BANGLA_MESSAGE_SYSTEM,
                max_tokens=200,
            )
            message = (
                raw.strip()
                if raw and len(raw.strip()) > 20 and not raw.strip().startswith("{")
                else get_template("weekly_summary", tri)
            )

            concern = {"type": "weekly_summary", "emotion": "happy"}
            with get_db() as db:
                existing = (
                    db.query(ProactiveMessage)
                    .filter(
                        ProactiveMessage.patient_id   == pid,
                        ProactiveMessage.concern_type == "weekly_summary",
                        ProactiveMessage.read         == False,
                        ProactiveMessage.archived     == False,
                        ProactiveMessage.created_at   >= cutoff_7d,
                    )
                    .first()
                )
                if not existing:
                    db.add(ProactiveMessage(
                        patient_id=pid,
                        message=message,
                        emotion="happy",
                        concern_type="weekly_summary",
                        archived=False,
                    ))
            log.info("Weekly summary queued for patient %s", pid)
        except Exception as e:
            log.warning("Weekly summary failed for %s: %s", pid, e)


def send_good_morning_messages() -> None:
    """Daily 2am UTC (8am Bangladesh). Proactive good morning message with baby milestone."""
    utc_hour = datetime.utcnow().hour
    if utc_hour != 2:
        return

    with get_db() as db:
        rows = (
            db.query(Patient.id, Patient.pregnancy_week, Patient.name)
            .filter(Patient.status == "active")
            .all()
        )
        patients = [(r.id, r.pregnancy_week or 20, r.name or "মা") for r in rows]

    cutoff_24h = datetime.utcnow() - timedelta(hours=24)
    for pid, week, name in patients:
        try:
            with get_db() as db:
                recent_msg = (
                    db.query(ProactiveMessage)
                    .filter(
                        ProactiveMessage.patient_id == pid,
                        ProactiveMessage.read       == False,
                        ProactiveMessage.archived   == False,
                        ProactiveMessage.created_at >= cutoff_24h,
                    )
                    .first()
                )
                if recent_msg:
                    continue

            tri = _trimester(week)
            morning_prompt = (
                f"গর্ভসপ্তাহ {week}-এ থাকা মায়ের জন্য শুভ সকালের বার্তা তৈরি করো। "
                f"অন্তর্ভুক্ত করো: (১) এই সপ্তাহে শিশুর একটি বিকাশের মাইলফলক, "
                f"(২) ত্রৈমাসিকের জন্য একটি পুষ্টি পরামর্শ। "
                f"৩ বাক্যের মধ্যে। উষ্ণ ও উৎসাহব্যঞ্জক বাংলায়।"
            )
            raw = call_llm_with_fallback(
                messages=[{"role": "user", "content": morning_prompt}],
                system=_BANGLA_MESSAGE_SYSTEM,
                max_tokens=200,
            )
            message = (
                raw.strip()
                if raw and len(raw.strip()) > 20 and not raw.strip().startswith("{")
                else get_template("good_morning", tri)
            )

            with get_db() as db:
                db.add(ProactiveMessage(
                    patient_id=pid,
                    message=message,
                    emotion="happy",
                    concern_type="good_morning",
                    archived=False,
                ))
            log.info("Good morning queued for patient %s (week %d)", pid, week)
        except Exception as e:
            log.warning("Good morning failed for %s: %s", pid, e)


def process_retry_queue() -> None:
    """Runs every 30 minutes. Retries patient scans that failed in the last full scan."""
    now = time.time()
    to_retry = [(pid, t) for pid, t in _retry_queue if now - t >= 1800]
    _retry_queue[:] = [(pid, t) for pid, t in _retry_queue if now - t < 1800]

    if not to_retry:
        return

    log.info("Retrying %d failed patient scans...", len(to_retry))
    for pid, _ in to_retry:
        try:
            _check_patient(pid)
            log.info("Retry succeeded for patient %s", pid)
        except Exception as e:
            log.warning("Retry also failed for patient %s: %s", pid, e)
            _retry_queue.append((pid, time.time()))


def trigger_immediate_scan(patient_id: str) -> None:
    """On-demand scan triggered from orchestrator when risk score crosses critical threshold."""
    log.info("Immediate scan triggered for patient %s", patient_id)
    try:
        _check_patient(patient_id)
    except Exception as e:
        log.warning("Immediate scan failed for patient %s: %s", patient_id, e)
        _retry_queue.append((patient_id, time.time()))

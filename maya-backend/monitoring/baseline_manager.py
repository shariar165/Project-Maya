import logging
from datetime import datetime, timedelta
from typing import Optional

import numpy as np

from db.session import get_db
from db.models import Patient, HealthLog, Conversation, PatientBaseline

log = logging.getLogger("maya.baseline")

_BASELINE_DAYS = 14


def get_or_create_baseline(patient_id: str) -> dict:
    with get_db() as db:
        row = db.query(PatientBaseline).filter(PatientBaseline.patient_id == patient_id).first()

        if row is None:
            patient = db.query(Patient).filter(Patient.id == patient_id).first()
            start = patient.created_at if patient and patient.created_at else datetime.utcnow()
            row = PatientBaseline(patient_id=patient_id, baseline_start=start)
            db.add(row)
            db.flush()

        return {
            "baseline_complete":    row.baseline_complete,
            "baseline_start":       row.baseline_start,
            "avg_systolic":         row.avg_systolic,
            "avg_diastolic":        row.avg_diastolic,
            "bp_std":               row.bp_std,
            "bp_reading_count":     row.bp_reading_count,
            "baseline_weight":      row.baseline_weight,
            "weight_gain_per_week": row.weight_gain_per_week,
            "avg_messages_per_day": row.avg_messages_per_day,
            "avg_distress_score":   row.avg_distress_score,
            "dominant_emotion":     row.dominant_emotion,
        }


def is_baseline_period(patient_id: str) -> bool:
    with get_db() as db:
        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        if not patient or not patient.created_at:
            return True
        created_at = patient.created_at

    return (datetime.utcnow() - created_at).days < _BASELINE_DAYS


def update_baseline_if_needed(patient_id: str) -> None:
    with get_db() as db:
        row = db.query(PatientBaseline).filter(PatientBaseline.patient_id == patient_id).first()

        if row is None:
            patient = db.query(Patient).filter(Patient.id == patient_id).first()
            start = patient.created_at if patient and patient.created_at else datetime.utcnow()
            row = PatientBaseline(patient_id=patient_id, baseline_start=start)
            db.add(row)
            db.flush()

        if row.baseline_complete:
            return

        baseline_start = row.baseline_start
        days_elapsed = (datetime.utcnow() - baseline_start).days
        if days_elapsed < _BASELINE_DAYS:
            return

        window_end = baseline_start + timedelta(days=_BASELINE_DAYS)

        # BP
        bp_logs = (
            db.query(HealthLog)
            .filter(
                HealthLog.patient_id == patient_id,
                HealthLog.data_type == "bp",
                HealthLog.created_at >= baseline_start,
                HealthLog.created_at <= window_end,
            )
            .all()
        )
        systolics, diastolics = [], []
        for entry in bp_logs:
            try:
                parts = (entry.value or "").split("/")
                systolics.append(float(parts[0]))
                diastolics.append(float(parts[1]))
            except (ValueError, IndexError):
                pass

        if systolics:
            row.avg_systolic     = float(np.mean(systolics))
            row.avg_diastolic    = float(np.mean(diastolics)) if diastolics else None
            row.bp_std           = float(np.std(systolics)) if len(systolics) > 1 else 5.0
            row.bp_reading_count = len(systolics)

        # Weight slope
        weight_logs = (
            db.query(HealthLog)
            .filter(
                HealthLog.patient_id == patient_id,
                HealthLog.data_type == "weight",
                HealthLog.created_at >= baseline_start,
                HealthLog.created_at <= window_end,
            )
            .order_by(HealthLog.created_at)
            .all()
        )
        weight_entries = []
        for entry in weight_logs:
            try:
                weight_entries.append((entry.created_at, float(entry.value)))
            except (ValueError, TypeError):
                pass

        if weight_entries:
            row.baseline_weight = weight_entries[0][1]
            if len(weight_entries) >= 2:
                x_days = [(ts - baseline_start).days for ts, _ in weight_entries]
                weights = [w for _, w in weight_entries]
                slope, _ = np.polyfit(x_days, weights, 1)
                row.weight_gain_per_week = float(slope * 7)

        # Message frequency
        msg_count = (
            db.query(Conversation)
            .filter(
                Conversation.patient_id == patient_id,
                Conversation.created_at >= baseline_start,
                Conversation.created_at <= window_end,
            )
            .count()
        )
        row.avg_messages_per_day = msg_count / _BASELINE_DAYS

        # Emotional baseline
        conv_turns_raw = (
            db.query(Conversation.content)
            .filter(
                Conversation.patient_id == patient_id,
                Conversation.role == "user",
                Conversation.created_at >= baseline_start,
                Conversation.created_at <= window_end,
            )
            .limit(30)
            .all()
        )
        conv_texts = [r[0] for r in conv_turns_raw]

        row.baseline_complete = True
        row.completed_at      = datetime.utcnow()

    # Compute emotion outside DB session (classifier is CPU-only)
    if conv_texts:
        from monitoring.emotion_classifier import score_conversation_turns
        avg_score = score_conversation_turns(conv_texts)
        if avg_score is not None:
            with get_db() as db:
                b = db.query(PatientBaseline).filter(PatientBaseline.patient_id == patient_id).first()
                if b:
                    b.avg_distress_score = avg_score

    log.info("Baseline complete for patient %s (elapsed %d days)", patient_id, days_elapsed)


def get_bp_alert_threshold(patient_id: str) -> tuple[float, float]:
    b = get_or_create_baseline(patient_id)
    if b["baseline_complete"] and b["avg_systolic"] is not None:
        std = b["bp_std"] or 5.0
        upper = max(b["avg_systolic"] + 2 * std, 140.0)
        lower = b["avg_systolic"] - 2 * std
        return (upper, lower)
    return (140.0, 90.0)

from datetime import datetime
from db.session import get_db
from db.models  import Patient, HealthLog, Conversation


def get_patient_profile(patient_id: str) -> dict:
    """Get patient profile. Returns error dict if not found."""
    with get_db() as db:
        p = db.query(Patient).filter(Patient.id == patient_id).first()
        if not p:
            return {"error": "Patient not found"}
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
            "guardian_name":    p.guardian_name,
            "guardian_phone":   p.guardian_phone,
            "health_worker_phone": p.health_worker_phone,
            "lang":             p.lang,
        }


def log_health_data(patient_id: str, data_type: str, value: str) -> str:
    """Log a health measurement for a patient."""
    with get_db() as db:
        log = HealthLog(
            patient_id=patient_id,
            data_type=data_type,
            value=value,
            created_at=datetime.utcnow(),
        )
        db.add(log)

        # Update quick-access fields on Patient
        p = db.query(Patient).filter(Patient.id == patient_id).first()
        if p:
            if data_type == "bp":
                p.last_bp_reading = value
            elif data_type == "weight":
                try:
                    p.last_weight = float(value)
                except ValueError:
                    pass
    return f"Logged {data_type}: {value}"


def save_conversation(patient_id: str, role: str, content: str) -> str:
    """Save one conversation turn (user or tara)."""
    with get_db() as db:
        conv = Conversation(
            patient_id=patient_id,
            role=role,
            content=content,
            created_at=datetime.utcnow(),
        )
        db.add(conv)
    return "saved"


def get_conversation_history(patient_id: str, limit: int = 5) -> list[dict]:
    """Retrieve last N conversation turns."""
    with get_db() as db:
        rows = (
            db.query(Conversation)
            .filter(Conversation.patient_id == patient_id)
            .order_by(Conversation.created_at.desc())
            .limit(limit)
            .all()
        )
    return [{"role": r.role, "content": r.content} for r in reversed(rows)]

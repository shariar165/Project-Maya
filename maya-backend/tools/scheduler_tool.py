from db.session import get_db
from db.models  import Reminder


def schedule_reminder(patient_id: str, reminder_type: str, scheduled_at: str, message: str = "") -> str:
    """Store a reminder for medication, appointment, or check-in."""
    with get_db() as db:
        r = Reminder(
            patient_id=patient_id,
            reminder_type=reminder_type,
            scheduled_at=scheduled_at,
            message=message,
        )
        db.add(r)
    return f"Reminder scheduled: {reminder_type} at {scheduled_at}"


def get_upcoming_appointments(patient_id: str) -> list[dict]:
    """Return upcoming appointment reminders for a patient."""
    from db.models import Appointment
    from datetime import datetime
    with get_db() as db:
        appts = (
            db.query(Appointment)
            .filter(
                Appointment.patient_id == patient_id,
                Appointment.scheduled_at >= datetime.utcnow(),
                Appointment.attended == False,
            )
            .order_by(Appointment.scheduled_at)
            .limit(5)
            .all()
        )
    return [
        {
            "id":               a.id,
            "type":             a.appointment_type,
            "scheduled_at":     str(a.scheduled_at),
            "location":         a.location,
        }
        for a in appts
    ]

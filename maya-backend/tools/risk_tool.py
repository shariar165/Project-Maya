import logging
import pickle
import numpy as np
from config import RISK_MODEL_PATH
from db.session import get_db
from db.models  import Patient, HealthLog

log = logging.getLogger("maya.risk")
_model = None


def _load_model():
    global _model
    if _model is None:
        try:
            with open(RISK_MODEL_PATH, "rb") as f:
                _model = pickle.load(f)
        except FileNotFoundError:
            log.warning("Risk model not found at %s. Run create_dummy_risk_model.py first.", RISK_MODEL_PATH)
            _model = None
    return _model


def calculate_risk_score(patient_id: str) -> float:
    """Return ML risk score 0.0–1.0 (low→high). Falls back to 0.3 if model missing."""
    model = _load_model()

    with get_db() as db:
        p = db.query(Patient).filter(Patient.id == patient_id).first()
        if not p:
            return 0.3

        # Extract all needed values inside session to avoid DetachedInstanceError
        age        = p.age or 25
        week       = p.pregnancy_week or 20
        risk_level = p.risk_level or "low"

        logs = (
            db.query(HealthLog)
            .filter(HealthLog.patient_id == patient_id)
            .order_by(HealthLog.created_at.desc())
            .limit(30)
            .all()
        )
        log_data = [(l.data_type, l.value or "") for l in logs]

    bp_values = []
    for dtype, val in log_data:
        if dtype == "bp" and "/" in val:
            try:
                bp_values.append(float(val.split("/")[0]))
            except ValueError:
                pass

    symptom_count = sum(1 for dtype, _ in log_data if dtype == "symptom")

    features = np.array([[
        age,
        week,
        np.mean(bp_values) if bp_values else 120.0,
        np.std(bp_values)  if len(bp_values) > 1 else 0.0,
        symptom_count,
        1 if risk_level == "high" else 0,
    ]])

    if model is None:
        return round(0.2 + (symptom_count * 0.05) + (1 if risk_level == "high" else 0) * 0.3, 3)

    try:
        score = float(model.predict_proba(features)[0][1])
        return round(score, 3)
    except Exception as e:
        log.warning("Risk scoring failed: %s", e)
        return 0.3

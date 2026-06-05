from config import call_llm_with_fallback, parse_llm_json
from tools.rag_tool   import rag_search
from tools.risk_tool  import calculate_risk_score
from tools.alert_tool import send_guardian_alert
from agents.response_composer import MayaState

SYMPTOM_SYSTEM = """You are TARA's symptom analysis engine for Maya.
You are a trained maternal health triage specialist.

Patient: Week {week}, Age {age}, Risk: {risk_level}
Previous conditions: {conditions}

DGHS Danger Sign Knowledge:
{rag_context}

Conversation history:
{history}

SEVERITY CLASSIFICATION — pick exactly one:
- mild:      Common pregnancy discomfort, within normal range for week {week}
- moderate:  Needs monitoring, health worker should be informed
- severe:    Multiple warning signs, clinic visit required today
- emergency: Immediate danger — bleeding, seizure, no fetal movement,
             severe headache + vision changes, difficulty breathing

Current symptoms reported: {symptoms}

Respond ONLY in this JSON:
{{
  "severity":       "mild|moderate|severe|emergency",
  "emotion":        "happy|caring|alert",
  "message":        "bangla response — what to do now",
  "guardian_alert": true,
  "action":         "home_care|call_health_worker|go_to_clinic|call_ambulance"
}}
"""


def symptom_node(state: MayaState) -> MayaState:
    profile = state.get("patient_profile", {})
    history = state.get("conversation_history", [])
    history_text = "\n".join(
        f"{'User' if h['role'] == 'user' else 'Tara'}: {h['content']}"
        for h in history[-4:]
    ) or "No previous conversation."

    rag_results = rag_search(
        query=state["user_message"],
        filters={"document_type": "danger_signs"},
    )
    if not rag_results:
        rag_results = rag_search(query=state["user_message"])

    state["retrieved_chunks"] = rag_results

    risk_score = calculate_risk_score(state["patient_id"])
    state["risk_score"] = risk_score

    prompt = SYMPTOM_SYSTEM.format(
        week=profile.get("pregnancy_week", "?"),
        age=profile.get("age", "?"),
        risk_level=profile.get("risk_level", "low"),
        conditions=profile.get("conditions", "none"),
        rag_context="\n\n".join(rag_results) or "No specific knowledge found.",
        history=history_text,
        symptoms=state["user_message"],
    )

    messages = [
        {"role": "user" if h["role"] == "user" else "assistant", "content": h["content"]}
        for h in history
    ] + [{"role": "user", "content": state["user_message"]}]

    raw    = call_llm_with_fallback(
        messages=messages,
        system=prompt,
        max_tokens=400,
    )
    result = parse_llm_json(raw)

    severity = result.get("severity", "mild")

    severity_map = {
        "mild":      ("caring", "speak",      False),
        "moderate":  ("caring", "speak",      True),
        "severe":    ("alert",  "alert_hold", True),
        "emergency": ("alert",  "alert_hold", True),
    }
    emotion, tara_action, should_alert = severity_map.get(severity, ("caring", "speak", False))

    state["emotion"]     = emotion
    state["message"]     = result.get("message", "")
    state["voice_text"]  = result.get("message", "")
    state["tara_action"] = tara_action
    state["agent_used"]  = "symptom"

    if should_alert and result.get("guardian_alert"):
        send_guardian_alert(
            patient_id=state["patient_id"],
            severity=severity,
            message=result.get("message", ""),
            action=result.get("action", ""),
        )
        state["guardian_alert"] = {
            "sent":     True,
            "severity": severity,
            "action":   result.get("action"),
        }

    if risk_score is not None and risk_score > 0.8:
        import threading
        from monitoring.monitoring_agent import trigger_immediate_scan
        threading.Thread(
            target=trigger_immediate_scan,
            args=(state["patient_id"],),
            daemon=True,
        ).start()

    return state

from typing import TypedDict, Optional


class MayaState(TypedDict):
    # Input
    patient_id:           str
    user_message:         str
    source:               str  # chat | voice | guardian | health_log

    # Patient context
    patient_profile:      dict
    conversation_history: list

    # Routing
    intent:               str
    agent_used:           str

    # RAG
    retrieved_chunks:     list

    # Output
    emotion:              str   # happy | caring | alert | celebration | celebration2 | singing | sleepy
    message:              str
    tara_action:          str   # speak | alert_hold | suggest_meditation | celebration | singing | crisis_support | share_resources
    voice_text:           str
    guardian_alert:       Optional[dict]
    risk_score:           Optional[float]
    tara_hold_seconds:    Optional[int]

    # Emotional safety fields (written by emotion_agent)
    distress_level:       str          # mild | moderate | severe | crisis
    crisis:               bool         # True when suicidal/self-harm signal detected
    escalate:             bool         # True when human help should be surfaced
    resources:            dict         # helpline dict surfaced to frontend
    suggest_meditation:   bool


def compose_tara_response(state: MayaState) -> dict:
    """Transform MayaState into the JSON shape the frontend expects."""
    tara_action = state.get("tara_action", "speak")
    emotion     = state.get("emotion", "happy")

    action_map = {
        "speak":              {"video": emotion,         "hold": False},
        "alert_hold":         {"video": "alert",         "hold": True},
        "suggest_meditation": {"video": "caring",        "hold": False, "trigger": "meditation"},
        "celebration":        {"video": "celebration2",  "hold": False},
        "singing":            {"video": "singing",       "hold": False, "trigger": "singing"},
        "crisis_support":     {"video": "caring",        "hold": True},
        "share_resources":    {"video": "caring",        "hold": False},
    }
    frontend_action = action_map.get(tara_action, {"video": emotion, "hold": False})

    resolved_emotion = frontend_action["video"]
    hold_seconds     = 8 if resolved_emotion == "caring" else 4

    return {
        "emotion":        resolved_emotion,
        "tara_hold":      frontend_action.get("hold", False),
        "tara_trigger":   frontend_action.get("trigger", None),
        "hold_seconds":   hold_seconds,
        "message":        state.get("message", ""),
        "voice_text":     state.get("voice_text", ""),
        "guardian_alert":  state.get("guardian_alert"),
        "agent_used":      state.get("agent_used", "unknown"),
        "risk_score":      state.get("risk_score"),
        "distress_level":  state.get("distress_level", "mild"),
        "crisis":          state.get("crisis", False),
        "escalate":        state.get("escalate", False),
        "resources":       state.get("resources", {}),
    }

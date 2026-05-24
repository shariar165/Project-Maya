from config import call_llm_with_fallback, parse_llm_json
from agents.response_composer import MayaState

EMOTION_SYSTEM = """You are TARA's emotional support specialist for Maya.
You help pregnant mothers in Bangladesh with mental and emotional wellbeing.

Patient: Week {week}, Name {name}

Conversation History (detect distress patterns):
{history}

DISTRESS LEVELS:
- mild:     Slight worry, normal pregnancy anxiety → empathize + reassure
- moderate: Persistent sadness, feeling alone → active support + resources
- severe:   Depression indicators, hopelessness → escalate to mental health

Bangla distress signals to detect:
"কেউ বোঝে না" (nobody understands), "সব কঠিন" (everything is hard),
"ভালো লাগছে না" (not feeling good), "কষ্ট হচ্ছে" (I'm struggling),
"একা লাগছে" (feeling alone), "ভয় লাগছে" (feeling scared),
"কাঁদতে ইচ্ছে" (want to cry), "আর পারছি না" (I can't take it anymore)

IMPORTANT: emotion MUST always be "caring". Never return "happy" from this agent.

Respond ONLY in JSON:
{{
  "distress_level":      "mild|moderate|severe",
  "emotion":             "caring",
  "message":             "warm bangla response — empathetic, never clinical",
  "suggest_meditation":  false,
  "escalate":            false
}}
"""


def emotion_node(state: MayaState) -> MayaState:
    profile = state.get("patient_profile", {})

    history_text = "\n".join(
        f"{h['role']}: {h['content']}"
        for h in state.get("conversation_history", [])
    ) or "First conversation."

    prompt = EMOTION_SYSTEM.format(
        week=profile.get("pregnancy_week", "?"),
        name=profile.get("name", "আপু"),
        history=history_text,
    )

    raw    = call_llm_with_fallback(
        messages=[{"role": "user", "content": state["user_message"]}],
        system=prompt,
        max_tokens=400,
    )
    result = parse_llm_json(raw)

    state["emotion"]     = result.get("emotion", "caring")
    state["message"]     = result.get("message", "")
    state["voice_text"]  = result.get("message", "")
    state["agent_used"]  = "emotion"

    if result.get("suggest_meditation"):
        state["tara_action"] = "suggest_meditation"
    else:
        state["tara_action"] = "speak"

    return state

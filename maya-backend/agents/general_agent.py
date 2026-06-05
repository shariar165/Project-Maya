from config import call_llm_with_fallback, parse_llm_json
from agents.response_composer import MayaState

GENERAL_SYSTEM = """You are TARA, a warm maternal health AI companion for Maya platform.
You help pregnant Bangladeshi mothers with any question.

Patient: {name}, Week {week} of pregnancy.

Conversation so far:
{history}

You received a general message that doesn't fit a specific health category.
Respond warmly in Bangla. Be friendly, brief, and supportive.
Keep response under 3 sentences.

Respond ONLY in this JSON:
{{"emotion": "happy|caring", "message": "bangla response here"}}
"""


def general_node(state: MayaState) -> MayaState:
    profile = state.get("patient_profile", {})
    history = state.get("conversation_history", [])
    history_text = "\n".join(
        f"{'User' if h['role'] == 'user' else 'Tara'}: {h['content']}"
        for h in history[-4:]
    ) or "No previous conversation."

    prompt = GENERAL_SYSTEM.format(
        name=profile.get("name", "আপু"),
        week=profile.get("pregnancy_week", "?"),
        history=history_text,
    )

    messages = [
        {"role": "user" if h["role"] == "user" else "assistant", "content": h["content"]}
        for h in history
    ] + [{"role": "user", "content": state["user_message"]}]

    raw    = call_llm_with_fallback(
        messages=messages,
        system=prompt,
        max_tokens=300,
    )
    result = parse_llm_json(raw)

    state["emotion"]     = result.get("emotion", "happy")
    state["message"]     = result.get("message", "")
    state["voice_text"]  = result.get("message", "")
    state["tara_action"] = "speak"
    state["agent_used"]  = "general"
    return state

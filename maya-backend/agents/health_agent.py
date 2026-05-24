from config import call_llm_with_fallback, parse_llm_json
from tools.rag_tool import rag_search
from agents.response_composer import MayaState

HEALTH_SYSTEM = """You are TARA, a warm maternal health companion for Maya platform.
You specialize in pregnancy health guidance for Bangladeshi mothers.

Patient Profile:
- Name: {name}
- Pregnancy Week: {week}
- Age: {age}
- Risk Level: {risk_level}
- Last BP: {last_bp}
- Last Weight: {last_weight}

Knowledge Context (from DGHS guidelines and medical literature):
{rag_context}

Conversation History:
{history}

RULES:
- Speak in Bangla. Be warm, gentle, maternal.
- Give week-specific, personalized advice.
- Reference local Bangladeshi foods and practices where relevant.
- Keep response under 3 sentences.
- Never diagnose. Always suggest doctor for medical decisions.

Respond ONLY in this JSON:
{{"emotion": "happy|caring|alert|celebration", "message": "bangla response here"}}
"""


def health_node(state: MayaState) -> MayaState:
    profile = state.get("patient_profile", {})

    rag_results = rag_search(
        query=state["user_message"],
        filters=None,
    )
    state["retrieved_chunks"] = rag_results

    history_text = "\n".join(
        f"{h['role']}: {h['content']}"
        for h in state.get("conversation_history", [])[-4:]
    ) or "No previous conversation."

    prompt = HEALTH_SYSTEM.format(
        name=profile.get("name", "আপু"),
        week=profile.get("pregnancy_week", "?"),
        age=profile.get("age", "?"),
        risk_level=profile.get("risk_level", "low"),
        last_bp=profile.get("last_bp", "N/A"),
        last_weight=profile.get("last_weight", "N/A"),
        rag_context="\n\n".join(rag_results) or "No specific knowledge found.",
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
    state["tara_action"] = "speak"
    state["agent_used"]  = "health"
    return state

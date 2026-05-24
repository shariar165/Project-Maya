from config import call_llm_with_fallback, parse_llm_json
from tools.rag_tool import rag_search
from agents.response_composer import MayaState

GUARDIAN_SYSTEM = """You are TARA, answering a message from a family member or guardian
of a pregnant woman using the Maya platform.

Patient they're asking about:
- Name: {name}
- Week: {week}
- Risk Level: {risk_level}

Be warm and informative. Reassure the guardian and give them clear guidance.
If there are any concern signs, advise them to contact their health worker.

Respond in Bangla. Keep it under 4 sentences.

Respond ONLY in JSON:
{{"emotion": "caring|happy|alert", "message": "bangla response"}}
"""


def guardian_node(state: MayaState) -> MayaState:
    profile = state.get("patient_profile", {})

    rag_results = rag_search(query=state["user_message"])
    state["retrieved_chunks"] = rag_results

    prompt = GUARDIAN_SYSTEM.format(
        name=profile.get("name", "রোগী"),
        week=profile.get("pregnancy_week", "?"),
        risk_level=profile.get("risk_level", "low"),
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
    state["agent_used"]  = "guardian"
    return state

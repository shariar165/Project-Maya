import logging
from config import call_llm_with_fallback, parse_llm_json
from tools.rag_tool import rag_search
from agents.response_composer import MayaState

log = logging.getLogger("maya.health_agent")

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

If the user mentions how many hours they slept (e.g., "৭ ঘন্টা ঘুমিয়েছি", "slept 6.5 hours", "আজ ৮ ঘণ্টা ঘুম হয়েছে"), extract the numeric value for "sleep_hours". Otherwise return null.

Respond ONLY in this JSON:
{{"emotion": "happy|caring|alert|celebration", "message": "bangla response here", "sleep_hours": null}}
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

    messages = [
        {"role": "user" if h["role"] == "user" else "assistant", "content": h["content"]}
        for h in state.get("conversation_history", [])
    ] + [{"role": "user", "content": state["user_message"]}]

    raw    = call_llm_with_fallback(
        messages=messages,
        system=prompt,
        max_tokens=400,
    )
    result = parse_llm_json(raw) or {}

    # Log sleep duration if the LLM extracted one
    raw_sleep = result.get("sleep_hours")
    if raw_sleep is not None:
        pid = state.get("patient_id", "")
        if pid and pid not in ("guest", ""):
            try:
                sleep_val = float(raw_sleep)
                if 0 < sleep_val <= 24:
                    from tools.patient_tool import log_health_data
                    log_health_data(pid, "sleep", str(round(sleep_val, 1)))
                    log.info("Logged sleep %.1f hrs for patient %s", sleep_val, pid)
            except (ValueError, TypeError) as exc:
                log.warning("sleep log skipped — bad value %r: %s", raw_sleep, exc)
            except Exception as exc:
                log.error("sleep log failed for patient %s: %s", pid, exc)

    state["emotion"]     = result.get("emotion", "caring")
    state["message"]     = result.get("message", "")
    state["voice_text"]  = result.get("message", "")
    state["tara_action"] = "speak"
    state["agent_used"]  = "health"
    return state

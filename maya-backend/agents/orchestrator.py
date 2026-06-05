import os
import logging
import anthropic
from langgraph.graph import StateGraph, END

from config import (
    call_llm_with_fallback,
    PRIMARY_MODEL,
    MCP_API_KEY,
    MCP_KNOWLEDGE_URL,
    MCP_PATIENT_URL,
)

log = logging.getLogger("maya.orchestrator")
from db.session import get_db
from db.models  import Patient, Conversation
from agents.response_composer import MayaState

# ── Intent classifier prompt ──────────────────────────────────────────────────

_EMERGENCY_KEYWORDS = [
    "রক্তপাত", "রক্ত", "bleeding", "blood",
    "খিঁচুনি", "seizure", "convulsion",
    "নড়ছে না", "নড়াচড়া নেই", "no movement", "kick",
    "শ্বাসকষ্ট", "breathing", "breath",
]

_SYMPTOM_KEYWORDS = [
    "ব্যথা", "pain", "মাথাব্যথা", "headache", "বমি", "vomit",
    "জ্বর", "fever", "ফোলা", "swelling", "সমস্যা", "দুর্বল",
    "weak", "dizzy", "মাথা ঘুরছে",
]

# Sleep-reporting phrases that indicate a duration log (not a complaint)
_SLEEP_LOG_KEYWORDS = [
    "ঘুমিয়েছি", "ঘুমালাম", "ঘুম হয়েছে", "ঘুম হলো", "ঘুমিয়ে ছিলাম",
    "slept", "hours of sleep", "hrs sleep",
]

_EMOTION_KEYWORDS = [
    "কষ্ট", "কান্না", "দুঃখ", "sad", "depressed", "anxious",
    "ভয়", "চিন্তা", "stressed", "alone", "একা", "কেউ বোঝে না",
    "ভালো লাগছে না", "কঠিন",
]


def _keyword_classify(message: str) -> str | None:
    """Fast keyword pre-classification — avoids LLM call for clear cases."""
    lower = message.lower()
    if any(kw in lower for kw in _EMERGENCY_KEYWORDS):
        return "emergency"
    if any(kw in lower for kw in _SYMPTOM_KEYWORDS):
        return "symptom"
    if any(kw in lower for kw in _EMOTION_KEYWORDS):
        return "emotion"
    if any(kw in lower for kw in _SLEEP_LOG_KEYWORDS):
        return "health"
    return None


INTENT_PROMPT = """You are a routing system for Maya maternal health AI.
Classify the user message into exactly ONE intent.

Patient context: Week {week}, Risk: {risk_level}
Message: {message}

Return ONLY one word from this list:
- health       → nutrition, weight, sleep duration, appointments, week info, baby development
- symptom      → any body symptom, pain, bleeding, swelling, headache, movement
- emotion      → feelings, stress, anxiety, sadness, relationship, mood
- guardian     → message from family member, guardian asking about patient
- emergency    → danger signs: heavy bleeding, seizure, no fetal movement,
                 severe headache, vision problems, difficulty breathing
- general      → greeting, thank you, out of scope question
"""


def classify_intent(state: MayaState) -> MayaState:
    """Load patient context and classify intent."""
    # Load patient
    with get_db() as db:
        p = db.query(Patient).filter(Patient.id == state["patient_id"]).first()

        if p:
            state["patient_profile"] = {
                "name":             p.name,
                "age":              p.age,
                "pregnancy_week":   p.pregnancy_week,
                "risk_level":       p.risk_level,
                "last_bp":          p.last_bp_reading,
                "last_weight":      p.last_weight,
                "conditions":       p.medical_conditions or "",
                "lang":             p.lang,
            }
        else:
            # Graceful: unknown patient treated as generic user
            state["patient_profile"] = {
                "name": "আপু", "age": 25, "pregnancy_week": 20,
                "risk_level": "low", "last_bp": None, "last_weight": None,
                "conditions": "", "lang": "bn",
            }

        # Load last 5 conversation turns
        history = (
            db.query(Conversation)
            .filter(Conversation.patient_id == state["patient_id"])
            .order_by(Conversation.created_at.desc())
            .limit(5)
            .all()
        )
        if history:
            state["conversation_history"] = [
                {"role": h.role, "content": h.content}
                for h in reversed(history)
            ]

    # 1. Fast keyword pre-classification (no LLM needed for clear cases)
    fast = _keyword_classify(state["user_message"])
    if fast:
        state["intent"] = fast
        return state

    # 2. LLM classification for ambiguous messages
    profile = state["patient_profile"]
    prompt  = INTENT_PROMPT.format(
        week=profile["pregnancy_week"],
        risk_level=profile["risk_level"],
        message=state["user_message"],
    )

    raw    = call_llm_with_fallback(
        messages=[{"role": "user", "content": state["user_message"]}],
        system=prompt,
        max_tokens=10,
    )
    # Parse intent: first word of response, fallback to "general"
    first_word = raw.strip().lower().split()[0] if raw.strip() else "general"
    valid_intents = {"health", "symptom", "emotion", "guardian", "emergency", "general"}
    state["intent"] = first_word if first_word in valid_intents else "general"
    return state


def route_to_agent(state: MayaState) -> str:
    return state["intent"]


# ── Graph builder ─────────────────────────────────────────────────────────────

def build_orchestrator():
    from agents.health_agent     import health_node
    from agents.symptom_agent    import symptom_node
    from agents.emotion_agent    import emotion_node
    from agents.guardian_agent   import guardian_node
    from agents.emergency_agent  import emergency_node
    from agents.general_agent    import general_node

    graph = StateGraph(MayaState)

    graph.add_node("orchestrator", classify_intent)
    graph.add_node("health",       health_node)
    graph.add_node("symptom",      symptom_node)
    graph.add_node("emotion",      emotion_node)
    graph.add_node("guardian",     guardian_node)
    graph.add_node("emergency",    emergency_node)
    graph.add_node("general",      general_node)

    graph.set_entry_point("orchestrator")

    graph.add_conditional_edges(
        "orchestrator",
        route_to_agent,
        {
            "health":    "health",
            "symptom":   "symptom",
            "emotion":   "emotion",
            "guardian":  "guardian",
            "emergency": "emergency",
            "general":   "general",
        },
    )

    for node in ["health", "symptom", "emotion", "guardian", "emergency", "general"]:
        graph.add_edge(node, END)

    return graph.compile()


_MAYA_GRAPH = None


def get_graph():
    """Lazy-init: build the graph on first call (avoids 14s import at server startup)."""
    global _MAYA_GRAPH
    if _MAYA_GRAPH is None:
        _MAYA_GRAPH = build_orchestrator()
    return _MAYA_GRAPH


# ── MCP-enhanced call (Phase 2) ───────────────────────────────────────────────

MCP_SERVERS = [
    {
        "type":                "url",
        "url":                 MCP_KNOWLEDGE_URL,
        "name":                "maya-knowledge",
        "authorization_token": MCP_API_KEY,
    },
    {
        "type":                "url",
        "url":                 MCP_PATIENT_URL,
        "name":                "maya-patient",
        "authorization_token": MCP_API_KEY,
    },
]


def call_claude_with_mcp(system: str, messages: list, max_tokens: int = 500) -> str:
    """Call Claude with both MCP servers connected (Phase 2 mode)."""
    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY", ""))
    try:
        response = client.messages.create(
            model=PRIMARY_MODEL,
            max_tokens=max_tokens,
            system=system,
            messages=messages,
            mcp_servers=MCP_SERVERS,
        )
        text_parts = [
            block.text
            for block in response.content
            if hasattr(block, "text")
        ]
        return " ".join(text_parts)
    except Exception as e:
        log.warning("MCP call failed: %s", type(e).__name__)
        return call_llm_with_fallback(messages, system, max_tokens)

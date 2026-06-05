from config import call_llm_with_fallback, parse_llm_json
from agents.response_composer import MayaState

# ──────────────────────────────────────────────────────────────────────────
# RESOURCES (Bangladesh) — keep in one place so numbers are easy to verify/update.
# ⚠️ Verify every number before production; helplines change.
# ──────────────────────────────────────────────────────────────────────────
CRISIS_RESOURCES = {
    "emotional_support": "কান পেতে রই (মানসিক সহায়তা): ০৯৬১২-১১৯৯১১ (প্রতিদিন বিকেল ৩টা–রাত ৩টা)",
    "national_emergency": "জাতীয় জরুরি সেবা: ৯৯৯",
    "health_hotline": "স্বাস্থ্য বাতায়ন: ১৬২৬৩",
}
IPV_RESOURCES = {
    "gbv_helpline": "নারী ও শিশু নির্যাতন হেল্পলাইন: ১০৯ (এবং কাছের One-Stop Crisis Centre)",
    "national_emergency": "তাৎক্ষণিক বিপদে: ৯৯৯",
    "emotional_support": "কান পেতে রই: ০৯৬১২-১১৯৯১১",
}

# Surfaced verbatim when a crisis is detected. The LLM does NOT get to override this.
CRISIS_MESSAGE = (
    "আপনি এখন যা অনুভব করছেন তা ভীষণ ভারী, আর এটা আমাকে বলতে অনেক সাহস লেগেছে। "
    "এই মুহূর্তে আপনার নিরাপত্তা সবচেয়ে জরুরি।\n\n"
    "আমি একটা সহায়ক, কিন্তু এমন সময়ে আপনার পাশে একজন মানুষ থাকা দরকার। দয়া করে এখনই:\n"
    "• কাছের একজন বিশ্বস্ত মানুষকে পাশে ডাকুন।\n"
    f"• {CRISIS_RESOURCES['emotional_support']}\n"
    f"• {CRISIS_RESOURCES['national_emergency']}\n"
    f"• {CRISIS_RESOURCES['health_hotline']}\n\n"
    "আপনি একা নন। চাইলে আমাকে বলুন এই মুহূর্তে আপনার সাথে কে আছে।"
)
CRISIS_VOICE = (
    "আপনি যা অনুভব করছেন তা ভীষণ কঠিন, আর আপনি একা নন। "
    "দয়া করে এখনই পাশের কাউকে ডাকুন, আর কান পেতে রই-এ ফোন করুন: ০৯৬১২-১১৯৯১১।"
)
FALLBACK_MESSAGE = (
    "আমি আপনার পাশে আছি, আপু। একটু বলবেন এখন ঠিক কেমন লাগছে আপনার?"
)

# ──────────────────────────────────────────────────────────────────────────
# HARD CRISIS / IPV DETECTION (defense-in-depth) — runs BEFORE the LLM.
# Never rely on the LLM alone to catch a crisis; JSON can fail, models can miss.
# Bangla + transliteration + English. Tune over time with real logs.
# ──────────────────────────────────────────────────────────────────────────
CRISIS_PATTERNS = [
    # suicidal ideation — Bangla
    "মরে যেতে", "মরে যাই", "মরে গেলে", "মরতে চাই",
    "বেঁচে থেকে লাভ", "বাঁচতে চাই না", "বেঁচে থাকতে চাই না",
    "আত্মহত্যা", "নিজেকে শেষ", "শেষ করে দেব", "শেষ করে দিতে",
    "না থাকলেই ভালো", "আমি না থাকলে", "সব শেষ করে",
    # harm to baby / self — Bangla
    "বাচ্চাকে মেরে", "বাচ্চার ক্ষতি", "নিজের ক্ষতি",
    # transliteration
    "more jete", "morte chai", "beche theke labh", "bachte chai na",
    "atmohotta", "sesh kore", "na thaklei valo",
    # english
    "want to die", "kill myself", "end my life", "end it all",
    "suicide", "self harm", "self-harm", "harm myself", "hurt my baby",
]
IPV_PATTERNS = [
    "মারধর", "গায়ে হাত", "মারে আমাকে", "আঘাত করে", "নির্যাতন",
    "ভয়ে থাকি", "হুমকি দেয়",
    "mardhor", "gaye hat", "mare amake", "abuse", "beats me", "hits me",
]


def _scan_text(*texts):
    """Return 'crisis' | 'ipv' | None from a hard keyword scan. Crisis wins."""
    blob = " ".join(t for t in texts if t).lower()
    if any(p.lower() in blob for p in CRISIS_PATTERNS):
        return "crisis"
    if any(p.lower() in blob for p in IPV_PATTERNS):
        return "ipv"
    return None


# ──────────────────────────────────────────────────────────────────────────
# SYSTEM PROMPT — upgraded with crisis tier, safety rules, IPV awareness.
# ──────────────────────────────────────────────────────────────────────────
EMOTION_SYSTEM = """You are TARA's emotional support companion for Maya.
You help pregnant and new mothers in Bangladesh with emotional wellbeing.
You are NOT a doctor, therapist, or emergency service — you are a warm, trusted
companion who listens, normalizes feelings, offers one small coping step, and
gently guides toward human help.

Patient: Week {week}, Name {name}

Conversation History (detect distress patterns):
{history}

DISTRESS LEVELS:
- mild:     Slight worry, normal pregnancy anxiety → empathize + reassure
- moderate: Persistent sadness, feeling alone, sleep/appetite trouble → active support + suggest resources
- severe:   Depression indicators, hopelessness, can't function, panic, OR signs of abuse (IPV) → strongly urge professional help + resources
- crisis:   ANY thought of suicide / self-harm / harming the baby, or signs of losing touch with reality (hearing voices, delusions), or immediate danger → set "crisis": true and "escalate": true

Bangla distress signals (moderate/severe):
"কেউ বোঝে না", "সব কঠিন", "ভালো লাগছে না", "কষ্ট হচ্ছে",
"একা লাগছে", "ভয় লাগছে", "কাঁদতে ইচ্ছে", "আর পারছি না"

Bangla CRISIS signals (→ crisis):
"মরে যেতে ইচ্ছে", "বাঁচতে চাই না", "আমি না থাকলেই ভালো", "শেষ করে দেব",
"নিজের/বাচ্চার ক্ষতি", বা বাস্তবতা থেকে বিচ্ছিন্নতার ইঙ্গিত

ABSOLUTE RULES (never break):
- emotion MUST always be "caring". Never return "happy".
- Never diagnose (don't say "you have depression").
- Never suggest medicine or doses.
- Never give false reassurance ("everything will be fine") that buries a serious sign.
- Never minimize ("it's just hormones", "others have it worse").
- Ask at most ONE gentle question per reply.
- Never claim the conversation is fully confidential/secret.
- If crisis: do NOT normalize, do NOT pivot to a meditation tip. Be warm, brief, and point to human help. (The app will attach helpline numbers — your "message" should gently encourage reaching a person right now.)
- suggest_meditation MUST be false when distress_level is "severe" or "crisis".

TONE: simple warm Bangla, short paragraphs, judgement-free, never clinical.

Respond ONLY in JSON:
{{
  "distress_level":      "mild|moderate|severe|crisis",
  "emotion":             "caring",
  "message":             "warm bangla response — empathetic, never clinical",
  "suggest_meditation":  false,
  "escalate":            false,
  "crisis":              false
}}
"""


def emotion_node(state: MayaState) -> MayaState:
    profile = state.get("patient_profile", {})
    history = state.get("conversation_history", [])
    history_text = "\n".join(
        f"{h['role']}: {h['content']}" for h in history
    ) or "First conversation."

    user_msg = state.get("user_message", "")

    # 1) HARD pre-scan (current message + last user turn) — independent of the LLM.
    last_user = next(
        (h["content"] for h in reversed(history) if h.get("role") == "user"), ""
    )
    hard_flag = _scan_text(user_msg, last_user)

    # 2) Ask the LLM.
    prompt = EMOTION_SYSTEM.format(
        week=profile.get("pregnancy_week", "?"),
        name=profile.get("name", "আপু"),
        history=history_text,
    )
    messages = [
        {"role": "user" if h["role"] == "user" else "assistant", "content": h["content"]}
        for h in history
    ] + [{"role": "user", "content": user_msg}]

    raw = call_llm_with_fallback(
        messages=messages,
        system=prompt,
        max_tokens=400,
    )
    result = parse_llm_json(raw) or {}   # never crash if JSON fails

    llm_level = result.get("distress_level", "mild")
    llm_says_crisis = bool(result.get("crisis")) or llm_level == "crisis" or bool(result.get("escalate"))

    # 3) Final decision: hard rule OR llm — whichever is more severe wins.
    is_crisis = (hard_flag == "crisis") or llm_says_crisis
    is_ipv = (hard_flag == "ipv")

    state["agent_used"] = "emotion"
    state["emotion"] = "caring"  # this agent is always caring

    # ── CRISIS PATH: override everything, hand off, surface resources ──
    if is_crisis:
        state["distress_level"] = "crisis"
        state["message"] = CRISIS_MESSAGE          # LLM does NOT override this
        state["voice_text"] = CRISIS_VOICE
        state["crisis"] = True
        state["escalate"] = True
        state["resources"] = CRISIS_RESOURCES
        state["tara_action"] = "crisis_support"    # orchestrator/guardian should act on this
        state["suggest_meditation"] = False
        return state

    # ── NORMAL PATH ──
    state["distress_level"] = llm_level if llm_level in ("mild", "moderate", "severe") else "mild"
    state["message"] = result.get("message") or FALLBACK_MESSAGE
    state["voice_text"] = state["message"]
    state["crisis"] = False

    if is_ipv:
        # safety-aware: never minimize, never tell her to "adjust"; surface help.
        state["distress_level"] = "severe"
        state["escalate"] = True
        state["resources"] = IPV_RESOURCES
        state["tara_action"] = "share_resources"
    elif state["distress_level"] == "severe":
        state["escalate"] = True
        state["resources"] = CRISIS_RESOURCES      # reuse emotional-support numbers
        state["tara_action"] = "share_resources"
    elif result.get("suggest_meditation") and state["distress_level"] in ("mild", "moderate"):
        state["escalate"] = False
        state["tara_action"] = "suggest_meditation"
    else:
        state["escalate"] = False
        state["tara_action"] = "speak"

    return state

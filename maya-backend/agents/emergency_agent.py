from tools.alert_tool import send_emergency_alert
from agents.response_composer import MayaState

# Hardcoded emergency responses — bypasses LLM for maximum speed
EMERGENCY_RESPONSES = {
    "bleeding": {
        "bn":     "এখনই হাসপাতালে যান! ভারী রক্তপাত খুবই বিপজ্জনক। অ্যাম্বুলেন্স ডাকুন — 999।",
        "action": "call_ambulance",
    },
    "seizure": {
        "bn":     "এটি একটি জরুরি অবস্থা! মাকে বাম দিকে শুইয়ে দিন। এখনই 999 কল করুন।",
        "action": "call_ambulance",
    },
    "no_movement": {
        "bn":     "শিশুর নড়াচড়া না হলে এখনই হাসপাতালে যান। দেরি করবেন না।",
        "action": "go_to_clinic",
    },
    "headache_vision": {
        "bn":     "তীব্র মাথাব্যথা ও দৃষ্টি সমস্যা বিপজ্জনক লক্ষণ। এখনই হাসপাতালে যান।",
        "action": "call_ambulance",
    },
    "breathing": {
        "bn":     "শ্বাসকষ্ট একটি জরুরি অবস্থা। এখনই 999 কল করুন এবং হাসপাতালে যান।",
        "action": "call_ambulance",
    },
    "default": {
        "bn":     "এটি একটি জরুরি অবস্থা হতে পারে। এখনই নিকটতম হাসপাতালে যান। পরিবারকে ডাকুন।",
        "action": "call_ambulance",
    },
}

_KEYWORDS = {
    "bleeding":       ["রক্ত", "blood", "bleeding", "রক্তপাত"],
    "seizure":        ["খিঁচুনি", "seizure", "convulsion"],
    "no_movement":    ["নড়ছে না", "movement", "কিক", "kick", "নড়াচড়া নেই"],
    "headache_vision":["দৃষ্টি", "vision", "চোখে", "মাথাব্যথা", "headache"],
    "breathing":      ["শ্বাস", "breathing", "breath"],
}


def _classify_emergency(message: str) -> str:
    lower = message.lower()
    for category, keywords in _KEYWORDS.items():
        if any(kw in lower for kw in keywords):
            return category
    return "default"


def emergency_node(state: MayaState) -> MayaState:
    category = _classify_emergency(state["user_message"])
    resp     = EMERGENCY_RESPONSES[category]

    send_emergency_alert(
        patient_id=state["patient_id"],
        message=resp["bn"],
        action=resp["action"],
    )

    state["emotion"]     = "alert"
    state["message"]     = resp["bn"]
    state["voice_text"]  = resp["bn"]
    state["tara_action"] = "alert_hold"
    state["agent_used"]  = "emergency"
    state["guardian_alert"] = {"sent": True, "severity": "emergency"}
    return state

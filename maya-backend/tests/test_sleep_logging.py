"""
Test sleep logging through the health agent.

Run from maya-backend/ with the venv active:
    python -m pytest tests/test_sleep_logging.py -v
or standalone:
    python tests/test_sleep_logging.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import pytest
from unittest.mock import patch, MagicMock


# ── helpers ───────────────────────────────────────────────────────────────────

def _make_state(message: str, patient_id: str = "test-patient-123") -> dict:
    return {
        "patient_id":           patient_id,
        "user_message":         message,
        "source":               "chat",
        "patient_profile":      {"name": "Test", "pregnancy_week": 20, "age": 25, "risk_level": "low", "last_bp": None, "last_weight": None},
        "conversation_history": [],
        "intent":               "health",
        "agent_used":           "",
        "retrieved_chunks":     [],
        "emotion":              "happy",
        "message":              "",
        "tara_action":          "speak",
        "voice_text":           "",
        "guardian_alert":       None,
        "risk_score":           None,
        "distress_level":       "mild",
        "crisis":               False,
        "escalate":             False,
        "resources":            {},
        "suggest_meditation":   False,
    }


# ── sleep extraction tests ────────────────────────────────────────────────────

class TestSleepExtraction:
    """Verify that the health_node logs sleep when the LLM returns sleep_hours."""

    def _run_node(self, message: str, llm_sleep_hours):
        """Run health_node with a mocked LLM that returns the given sleep_hours."""
        fake_llm_json = {
            "emotion":     "caring",
            "message":     "ভালো ঘুম হয়েছে। এটা শিশুর জন্যও উপকারী।",
            "sleep_hours": llm_sleep_hours,
        }
        logged = {}

        def mock_log(pid, dtype, value):
            logged[dtype] = value
            return f"Logged {dtype}: {value}"

        with patch("agents.health_agent.call_llm_with_fallback", return_value='{"emotion":"caring","message":"ok"}'), \
             patch("agents.health_agent.parse_llm_json", return_value=fake_llm_json), \
             patch("agents.health_agent.rag_search", return_value=[]), \
             patch("tools.patient_tool.log_health_data", side_effect=mock_log):
            from agents.health_agent import health_node
            state = _make_state(message)
            result = health_node(state)

        return result, logged

    def test_bangla_sleep_message_logs(self):
        """৭ ঘন্টা ঘুমিয়েছি → sleep_hours: 7.0 → logged."""
        _, logged = self._run_node("আজ ৭ ঘন্টা ঘুমিয়েছি", llm_sleep_hours=7.0)
        assert "sleep" in logged, "Expected sleep to be logged"
        assert logged["sleep"] == "7.0"

    def test_english_sleep_message_logs(self):
        _, logged = self._run_node("I slept 6.5 hours last night", llm_sleep_hours=6.5)
        assert logged.get("sleep") == "6.5"

    def test_no_sleep_mention_skips_log(self):
        """Message without sleep info → sleep_hours: null → nothing logged."""
        _, logged = self._run_node("আমার ওজন কত হওয়া উচিত?", llm_sleep_hours=None)
        assert "sleep" not in logged

    def test_zero_hours_skipped(self):
        """0 hours is invalid — do not log."""
        _, logged = self._run_node("ঘুমাতে পারিনি", llm_sleep_hours=0)
        assert "sleep" not in logged

    def test_unrealistic_hours_skipped(self):
        """25 hours is impossible — skip."""
        _, logged = self._run_node("test", llm_sleep_hours=25)
        assert "sleep" not in logged

    def test_bad_string_value_skipped(self):
        """LLM returns garbage string → skip, no crash."""
        _, logged = self._run_node("test", llm_sleep_hours="অনেকক্ষণ")
        assert "sleep" not in logged

    def test_guest_patient_skipped(self):
        """Guest users should not be logged."""
        fake_json = {"emotion": "caring", "message": "ok", "sleep_hours": 7.0}
        logged = {}

        def mock_log(pid, dtype, value):
            logged[dtype] = value

        with patch("agents.health_agent.call_llm_with_fallback", return_value="{}"), \
             patch("agents.health_agent.parse_llm_json", return_value=fake_json), \
             patch("agents.health_agent.rag_search", return_value=[]), \
             patch("tools.patient_tool.log_health_data", side_effect=mock_log):
            from agents.health_agent import health_node
            state = _make_state("slept 7 hours", patient_id="guest")
            health_node(state)

        assert "sleep" not in logged

    def test_db_error_does_not_crash_agent(self):
        """If the DB write fails, the agent should still return a valid response."""
        fake_json = {"emotion": "caring", "message": "শুভেচ্ছা!", "sleep_hours": 7.0}

        with patch("agents.health_agent.call_llm_with_fallback", return_value="{}"), \
             patch("agents.health_agent.parse_llm_json", return_value=fake_json), \
             patch("agents.health_agent.rag_search", return_value=[]), \
             patch("tools.patient_tool.log_health_data", side_effect=Exception("DB connection lost")):
            from agents.health_agent import health_node
            state = _make_state("slept 7 hours")
            result = health_node(state)

        assert result["message"] == "শুভেচ্ছা!"
        assert result["agent_used"] == "health"


# ── keyword routing tests ─────────────────────────────────────────────────────

class TestSleepRouting:
    """Verify sleep-reporting messages route to the health agent."""

    def _classify(self, message: str) -> str:
        from agents.orchestrator import _keyword_classify
        return _keyword_classify(message) or "llm"

    def test_bangla_slept_routes_health(self):
        assert self._classify("আজ ৭ ঘন্টা ঘুমিয়েছি") == "health"

    def test_bangla_slept_variant_routes_health(self):
        assert self._classify("রাতে ভালো ঘুম হয়েছে") == "health"

    def test_english_slept_routes_health(self):
        assert self._classify("I slept 8 hours today") == "health"

    def test_insomnia_does_not_route_health(self):
        # "can't sleep" → symptom or emotion, not health
        result = self._classify("ঘুমাতে পারছি না মাথাব্যথা")
        assert result == "symptom"  # মাথাব্যথা catches it first


# ── standalone runner ─────────────────────────────────────────────────────────

if __name__ == "__main__":
    import importlib
    # Quick smoke test without pytest
    suite = TestSleepExtraction()
    routing = TestSleepRouting()
    tests = [
        ("bangla sleep logs",       suite.test_bangla_sleep_message_logs),
        ("english sleep logs",      suite.test_english_sleep_message_logs),
        ("no sleep skips",          suite.test_no_sleep_mention_skips_log),
        ("zero hours skipped",      suite.test_zero_hours_skipped),
        ("unrealistic hours skip",  suite.test_unrealistic_hours_skipped),
        ("bad string skipped",      suite.test_bad_string_value_skipped),
        ("guest skipped",           suite.test_guest_patient_skipped),
        ("db error no crash",       suite.test_db_error_does_not_crash_agent),
        ("bangla routes health",    routing.test_bangla_slept_routes_health),
        ("bangla variant routes",   routing.test_bangla_slept_variant_routes_health),
        ("english routes health",   routing.test_english_slept_routes_health),
        ("insomnia goes symptom",   routing.test_insomnia_does_not_route_health),
    ]

    passed = failed = 0
    for name, fn in tests:
        try:
            fn()
            print(f"  PASS  {name}")
            passed += 1
        except Exception as e:
            print(f"  FAIL  {name}: {e}")
            failed += 1

    print(f"\n{passed} passed, {failed} failed")
    sys.exit(0 if failed == 0 else 1)

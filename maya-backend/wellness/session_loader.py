"""Loads wellness session JSON files from content/sessions/ directory."""
import json
import logging
import os
from functools import lru_cache
from typing import Optional

_SESSIONS_DIR = os.path.join(os.path.dirname(__file__), "..", "content", "sessions")


def _trimester_from_week(week: int) -> int:
    if week <= 13:
        return 1
    elif week <= 26:
        return 2
    return 3


@lru_cache(maxsize=1)
def load_all_sessions() -> list[dict]:
    """Load and cache all session JSONs. Returns list of session dicts."""
    sessions = []
    sessions_dir = os.path.abspath(_SESSIONS_DIR)
    if not os.path.isdir(sessions_dir):
        logging.warning("[Wellness] Sessions directory not found: %s", sessions_dir)
        return sessions

    for fname in sorted(os.listdir(sessions_dir)):
        if not fname.endswith(".json"):
            continue
        fpath = os.path.join(sessions_dir, fname)
        try:
            with open(fpath, encoding="utf-8") as f:
                data = json.load(f)
            if "id" not in data or "category" not in data:
                logging.warning("[Wellness] Skipping malformed session: %s", fname)
                continue
            sessions.append(data)
        except (json.JSONDecodeError, OSError) as e:
            logging.error("[Wellness] Failed to load %s: %s", fname, e)

    logging.info("[Wellness] Loaded %d sessions.", len(sessions))
    return sessions


def get_session_by_id(session_id: str) -> Optional[dict]:
    for s in load_all_sessions():
        if s["id"] == session_id:
            return s
    return None


def get_sessions_by_category(
    category: Optional[str] = None,
    trimester: Optional[int] = None,
    week: Optional[int] = None,
) -> list[dict]:
    """Filter sessions by category and/or trimester. week overrides trimester if both given."""
    all_sessions = load_all_sessions()
    if week is not None:
        trimester = _trimester_from_week(week)

    result = []
    for s in all_sessions:
        if category and s.get("category") != category:
            continue
        if trimester is not None:
            allowed = s.get("allowed_trimesters", [1, 2, 3])
            if trimester not in allowed:
                continue
        result.append(s)
    return result


def invalidate_cache():
    """Clear the session cache so new JSON files are picked up."""
    load_all_sessions.cache_clear()

"""Mood → session recommendation logic."""
from typing import Optional
from wellness.session_loader import get_sessions_by_category, get_session_by_id, _trimester_from_week

# Primary session picks per mood (ordered by preference)
_MOOD_PICKS: dict[str, list[str]] = {
    "tender":  ["loving_kindness", "peaceful_visualization", "body_scan"],
    "happy":   ["loving_kindness", "peaceful_visualization", "body_scan"],
    "okay":    ["kegels", "pelvic_tilts", "wall_pushups"],
    "tired":   ["box_breathing", "body_scan", "deep_relaxation"],
    "worried": ["478_breathing", "body_scan", "deep_relaxation"],
    "heavy":   ["butterfly_stretch", "cat_cow", "pelvic_tilts"],
}

_DEFAULT_ORDER = ["box_breathing", "kegels", "body_scan", "loving_kindness", "bedtime_body_scan"]


def _filter_by_trimester(session: dict, trimester: int) -> bool:
    return trimester in session.get("allowed_trimesters", [1, 2, 3])


def _filter_by_conditions(session: dict, conditions: list[str]) -> bool:
    contraindications = session.get("contraindications", [])
    for c in conditions:
        if c in contraindications:
            return False
    return True


def recommend(
    mood: str,
    week: int = 20,
    conditions: Optional[list[str]] = None,
    max_alternates: int = 3,
) -> dict:
    """
    Returns {primary: session_dict | None, alternates: [session_dict, ...]}.
    Filters by trimester and patient conditions (contraindications).
    """
    if conditions is None:
        conditions = []

    trimester = _trimester_from_week(week)
    picks = _MOOD_PICKS.get(mood.lower(), _DEFAULT_ORDER)

    all_valid = [
        s for s in get_sessions_by_category(trimester=trimester)
        if _filter_by_conditions(s, conditions)
    ]

    # Build ordered candidate list: mood picks first, then remaining
    seen_ids: set[str] = set()
    ordered: list[dict] = []

    for pick_id in picks:
        s = get_session_by_id(pick_id)
        if s and s["id"] not in seen_ids and _filter_by_trimester(s, trimester) and _filter_by_conditions(s, conditions):
            ordered.append(s)
            seen_ids.add(s["id"])

    for s in all_valid:
        if s["id"] not in seen_ids:
            ordered.append(s)
            seen_ids.add(s["id"])

    primary = ordered[0] if ordered else None
    alternates = ordered[1: 1 + max_alternates]

    return {"primary": primary, "alternates": alternates}

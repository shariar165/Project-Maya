import csv
import logging
import random
from typing import Optional

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

log = logging.getLogger("maya.emotion_classifier")

_EMOTION_TO_BUCKET: dict[str, str] = {
    "Anger":       "high_distress",
    "Fear":        "high_distress",
    "Frustration": "high_distress",
    "Sadness":     "high_distress",
    "Neutral":     "medium_distress",
    "Boredom":     "medium_distress",
    "Contempt":    "medium_distress",
    "Disgust":     "medium_distress",
    "Calm":        "positive",
    "Happiness":   "positive",
    "Excitement":  "positive",
    "Pride":       "positive",
    "Surprise":    "positive",
}

BUCKET_SCORES: dict[str, float] = {
    "high_distress":   0.85,
    "medium_distress": 0.50,
    "positive":        0.15,
}

_BENGALI_DISTRESS_KEYWORDS = [
    "কেউ বোঝে না",
    "সব কঠিন",
    "ভালো লাগছে না",
    "আর পারছি না",
    "কষ্ট হচ্ছে",
    "একা লাগছে",
    "ভয় লাগছে",
    "কাঁদতে ইচ্ছে",
]

CONFIDENCE_THRESHOLD = 0.60

_vectorizer: Optional[TfidfVectorizer] = None
_classifier: Optional[LogisticRegression] = None


def build_emotion_classifier(csv_path: str) -> None:
    global _vectorizer, _classifier

    texts: list[str] = []
    labels: list[str] = []

    try:
        with open(csv_path, encoding="utf-8") as f:
            reader = csv.reader(f)
            headers = next(reader)
            for row in reader:
                for col_idx, cell in enumerate(row):
                    cell = cell.strip()
                    if not cell or col_idx >= len(headers):
                        continue
                    emotion_name = headers[col_idx].strip()
                    bucket = _EMOTION_TO_BUCKET.get(emotion_name)
                    if bucket:
                        texts.append(cell)
                        labels.append(bucket)
    except Exception as e:
        log.error("Failed to load emotion CSV from %s: %s", csv_path, e)
        return

    if not texts:
        log.error("No training samples loaded from emotion CSV.")
        return

    vect = TfidfVectorizer(ngram_range=(1, 2), min_df=1)
    X = vect.fit_transform(texts)

    clf = LogisticRegression(max_iter=1000, C=1.0)
    clf.fit(X, labels)

    _vectorizer = vect
    _classifier = clf

    from collections import Counter
    dist = Counter(labels)
    log.info("Emotion classifier trained: %d samples — %s", len(texts), dict(dist))


def classify_text(text: str) -> tuple[str, float]:
    for kw in _BENGALI_DISTRESS_KEYWORDS:
        if kw in text:
            return ("high_distress", 1.0)

    if _classifier is None or _vectorizer is None:
        return ("unknown", 0.0)

    try:
        X = _vectorizer.transform([text])
        proba = _classifier.predict_proba(X)[0]
        confidence = float(proba.max())
        label = _classifier.classes_[proba.argmax()]
        return (label, confidence)
    except Exception as e:
        log.warning("classify_text error: %s", e)
        return ("unknown", 0.0)


def score_conversation_turns(turns: list[str]) -> Optional[float]:
    if not turns:
        return None

    scores: list[float] = []
    for turn in turns:
        label, confidence = classify_text(turn)
        if confidence < CONFIDENCE_THRESHOLD:
            continue
        bucket_score = BUCKET_SCORES.get(label)
        if bucket_score is not None:
            scores.append(bucket_score)

    if not scores:
        return None

    return sum(scores) / len(scores)

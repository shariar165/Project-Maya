import logging
from sentence_transformers import CrossEncoder

log = logging.getLogger("maya.reranker")
_reranker = None


def _get_reranker() -> CrossEncoder:
    global _reranker
    if _reranker is None:
        log.info("Loading cross-encoder/ms-marco-MiniLM-L-6-v2 ...")
        _reranker = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")
        log.info("Reranker model loaded.")
    return _reranker


def rerank(query: str, docs: list[str], top_n: int = 3) -> list[str]:
    if not docs:
        return []
    pairs  = [(query, doc) for doc in docs]
    scores = _get_reranker().predict(pairs)
    ranked = sorted(zip(docs, scores), key=lambda x: x[1], reverse=True)
    return [doc for doc, _ in ranked[:top_n]]

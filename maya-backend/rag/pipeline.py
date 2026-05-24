from rag.retriever import hybrid_search


def search(query: str, filters: dict | None = None, top_k: int = 3) -> list[str]:
    """Convenience wrapper over hybrid_search."""
    return hybrid_search(query, filters, top_k=max(top_k, 3))

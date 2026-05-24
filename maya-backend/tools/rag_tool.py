from rag.retriever import hybrid_search


def rag_search(query: str, filters: dict | None = None) -> list[str]:
    """
    Search Maya's maternal health knowledge base.
    Use for: pregnancy symptoms, nutrition, DGHS protocols,
             danger signs, baby development, medication info.
    """
    return hybrid_search(query, filters)

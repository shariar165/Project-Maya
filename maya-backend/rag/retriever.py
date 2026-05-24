import chromadb
from rank_bm25 import BM25Okapi
from config import CHROMA_PATH
from rag.embedder import get_embedding
from rag.reranker import rerank

_chroma_client = None
_collection = None


def _get_collection():
    global _chroma_client, _collection
    if _collection is None:
        _chroma_client = chromadb.PersistentClient(path=CHROMA_PATH)
        _collection = _chroma_client.get_or_create_collection("maya_knowledge")
    return _collection


def hybrid_search(query: str, filters: dict | None = None, top_k: int = 10) -> list[str]:
    """
    Hybrid BM25 + vector search with Reciprocal Rank Fusion, then BGE reranking.
    Returns top 3 chunks.
    """
    collection = _get_collection()

    # 1. Vector search
    query_embedding = get_embedding(query)
    where_filter    = filters if filters else None

    try:
        vector_results = collection.query(
            query_embeddings=[query_embedding],
            n_results=min(top_k, max(collection.count(), 1)),
            where=where_filter if where_filter else None,
        )
        vector_docs = vector_results["documents"][0]
        vector_ids  = vector_results["ids"][0]
    except Exception:
        vector_docs, vector_ids = [], []

    if not vector_docs:
        return []

    # 2. BM25 over all docs in collection
    try:
        all_data  = collection.get()
        corpus    = all_data["documents"]
        doc_ids   = all_data["ids"]

        if not corpus:
            return vector_docs[:3]

        tokenized = [doc.lower().split() for doc in corpus]
        bm25      = BM25Okapi(tokenized)
        scores    = bm25.get_scores(query.lower().split())

        bm25_ranked = sorted(
            zip(doc_ids, corpus, scores),
            key=lambda x: x[2], reverse=True
        )[:top_k]
        bm25_ids  = [id_ for id_, _, _ in bm25_ranked]
        bm25_docs = [doc for _, doc, _ in bm25_ranked]
    except Exception:
        bm25_ids, bm25_docs = [], []

    # 3. Reciprocal Rank Fusion
    def rrf(rank: int, k: int = 60) -> float:
        return 1.0 / (k + rank)

    scores_map: dict[str, float] = {}
    for rank, doc_id in enumerate(vector_ids):
        scores_map[doc_id] = scores_map.get(doc_id, 0.0) + rrf(rank)
    for rank, doc_id in enumerate(bm25_ids):
        scores_map[doc_id] = scores_map.get(doc_id, 0.0) + rrf(rank)

    top_ids  = sorted(scores_map, key=scores_map.get, reverse=True)[:top_k]
    id_to_doc = {}
    for id_, doc in zip(vector_ids, vector_docs):
        id_to_doc[id_] = doc
    for id_, doc in zip(bm25_ids, bm25_docs):
        id_to_doc[id_] = doc

    candidates = [id_to_doc[id_] for id_ in top_ids if id_ in id_to_doc]

    # 4. Rerank and return top 3
    return rerank(query, candidates, top_n=3)

import logging
from sentence_transformers import SentenceTransformer

log = logging.getLogger("maya.embedder")
_model = None


def _get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        log.info("Loading paraphrase-multilingual-MiniLM-L12-v2 ...")
        _model = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")
        log.info("Embedder model loaded.")
    return _model


def get_embedding(text: str) -> list[float]:
    return _get_model().encode(text, normalize_embeddings=True).tolist()

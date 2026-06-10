import logging

log = logging.getLogger("maya.embedder")
_model = None

_MODEL_NAME = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"


def _get_model():
    global _model
    if _model is None:
        from fastembed import TextEmbedding
        log.info("Loading %s via fastembed (ONNX) ...", _MODEL_NAME)
        _model = TextEmbedding(_MODEL_NAME)
        log.info("Embedder ready.")
    return _model


def get_embedding(text: str, task_type: str = "RETRIEVAL_QUERY") -> list[float]:
    model = _get_model()
    return next(model.embed([text])).tolist()

import json
import logging
from config import GEMINI_API_KEY, GEMINI_MODEL

log = logging.getLogger("maya.reranker")


def rerank(query: str, docs: list[str], top_n: int = 3) -> list[str]:
    if not docs:
        return []
    if len(docs) <= top_n:
        return docs[:top_n]
    try:
        from google import genai
        client = genai.Client(api_key=GEMINI_API_KEY)
        numbered = "\n".join(f"{i}: {d[:300]}" for i, d in enumerate(docs))
        prompt = (
            f"Query: {query}\n\nCandidates:\n{numbered}\n\n"
            f"Return the indices of the {top_n} most relevant candidates "
            f"as a JSON array of integers, most relevant first. Output only the JSON array."
        )
        resp = client.models.generate_content(model=GEMINI_MODEL, contents=prompt)
        indices = json.loads(resp.text.strip())
        return [docs[i] for i in indices if isinstance(i, int) and 0 <= i < len(docs)][:top_n]
    except Exception as e:
        log.warning("Gemini reranker failed (%s): %s — using original order", type(e).__name__, e)
        return docs[:top_n]

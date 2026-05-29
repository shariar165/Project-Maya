import os
import sys
import json
import logging
import httpx
import anthropic
from dotenv import load_dotenv

load_dotenv()

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(name)s %(levelname)s %(message)s",
    handlers=[logging.StreamHandler(sys.stderr)],
)
log = logging.getLogger("maya")

ANTHROPIC_API_KEY  = os.getenv("ANTHROPIC_API_KEY", "")
GEMINI_API_KEY     = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL       = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
GROQ_API_KEY       = os.getenv("GROQ_API_KEY", "")
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "")
TARA_VOICE_ID      = os.getenv("TARA_VOICE_ID", "9BWtsMINqrJLrRacOk9x")
MCP_API_KEY        = os.getenv("MCP_API_KEY", "maya-mcp-secret-key-change-in-production")
N8N_BASE_URL       = os.getenv("N8N_BASE_URL", "http://localhost:5678")
DATABASE_URL       = os.getenv("DATABASE_URL", "sqlite:///./maya.db")
DEBUG              = os.getenv("DEBUG", "True").lower() == "true"

PRIMARY_MODEL  = "claude-sonnet-4-6"
HAIKU_MODEL    = "claude-haiku-4-5-20251001"
GROQ_MODEL     = "llama-3.3-70b-versatile"
CHROMA_PATH    = os.getenv("CHROMA_PATH", "./chroma_db")
RISK_MODEL_PATH = os.getenv("RISK_MODEL_PATH", "./models/risk_model.pkl")

MCP_KNOWLEDGE_URL = "http://localhost:8001"
MCP_PATIENT_URL   = "http://localhost:8002"


def call_llm_with_fallback(messages: list, system: str, max_tokens: int = 400) -> str:
    """Call Gemini; fall back to Groq on failure; return hardcoded message on both failure."""
    if GEMINI_API_KEY:
        try:
            from google import genai
            from google.genai import types as gtypes
            client = genai.Client(api_key=GEMINI_API_KEY)
            contents = [
                gtypes.Content(
                    role="model" if m["role"] == "assistant" else "user",
                    parts=[gtypes.Part(text=m["content"])],
                )
                for m in messages
            ]
            resp = client.models.generate_content(
                model=GEMINI_MODEL,
                contents=contents,
                config=gtypes.GenerateContentConfig(
                    system_instruction=system,
                    max_output_tokens=max_tokens,
                ),
            )
            return resp.text
        except Exception as e:
            log.warning("Gemini failed (%s): %s. Trying Groq...", type(e).__name__, e)

    try:
        payload = {
            "model": GROQ_MODEL,
            "messages": [{"role": "system", "content": system}, *messages],
            "max_tokens": max_tokens,
            "response_format": {"type": "json_object"},
        }
        res = httpx.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=20,
        )
        res.raise_for_status()
        return res.json()["choices"][0]["message"]["content"]
    except Exception as e2:
        log.warning("Groq also failed (%s): %s", type(e2).__name__, e2)

    return json.dumps({
        "emotion": "caring",
        "message": "একটু সমস্যা হচ্ছে। একটু পরে আবার চেষ্টা করুন।",
    })


def parse_llm_json(text: str) -> dict:
    """Safely parse JSON from LLM output, stripping markdown fences if present."""
    text = text.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        text = "\n".join(lines[1:-1]) if lines[-1].strip() == "```" else "\n".join(lines[1:])
    try:
        return json.loads(text)
    except Exception:
        return {"emotion": "caring", "message": text}

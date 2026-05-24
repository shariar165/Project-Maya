import os
import logging

from tts.edge_tts_provider import synthesize_async as edge_synthesize_async, detect_language

logger = logging.getLogger(__name__)


async def get_tara_voice_async(text: str) -> tuple[bytes | None, bool]:
    """
    Waterfall TTS router. Returns (audio_bytes, use_browser_fallback).
    (audio_bytes, False) — audio ready to stream
    (None, True)         — tell frontend to use Web Speech API
    """
    if not text or not text.strip():
        return None, True

    language = detect_language(text)

    # ── Provider 1: Edge TTS (Microsoft) — free, no key needed ───────────────
    try:
        audio = await edge_synthesize_async(text, language)
        logger.info(f"[TTS] Edge TTS OK — {len(audio)} bytes — lang: {language}")
        return audio, False
    except Exception as e:
        logger.warning(f"[TTS] Edge TTS failed: {e}")

    # ── Provider 2: Google Cloud TTS — optional, needs GOOGLE_TTS_API_KEY ────
    google_key = os.getenv("GOOGLE_TTS_API_KEY")
    if google_key:
        try:
            import base64
            import httpx

            voices = {
                "bangla":  {"languageCode": "bn-BD", "name": "bn-BD-Standard-A", "ssmlGender": "FEMALE"},
                "english": {"languageCode": "en-US", "name": "en-US-Neural2-F",  "ssmlGender": "FEMALE"},
            }
            payload = {
                "input":       {"text": text},
                "voice":       voices.get(language, voices["bangla"]),
                "audioConfig": {"audioEncoding": "MP3", "pitch": 2.0, "speakingRate": 0.95},
            }
            async with httpx.AsyncClient(timeout=15) as client:
                res = await client.post(
                    f"https://texttospeech.googleapis.com/v1/text:synthesize?key={google_key}",
                    json=payload,
                )
            if res.status_code == 200:
                audio = base64.b64decode(res.json()["audioContent"])
                logger.info(f"[TTS] Google TTS OK — {len(audio)} bytes")
                return audio, False
            raise RuntimeError(f"Google TTS {res.status_code}: {res.text}")
        except Exception as e:
            logger.warning(f"[TTS] Google TTS failed: {e}")

    # ── Provider 3: Browser Web Speech API — frontend handles this ───────────
    logger.warning("[TTS] All providers failed — returning browser fallback signal")
    return None, True

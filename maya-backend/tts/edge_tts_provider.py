import io
import edge_tts


TARA_VOICES = {
    "bangla":  "bn-BD-NabanitaNeural",
    "english": "en-US-AriaNeural",
    "hindi":   "hi-IN-SwaraNeural",
}

TARA_RATE   = "-5%"
TARA_PITCH  = "+10Hz"
TARA_VOLUME = "+0%"


def detect_language(text: str) -> str:
    bangla_chars = sum(1 for c in text if 'ঀ' <= c <= '৿')
    return "bangla" if bangla_chars > len(text) * 0.2 else "english"


async def synthesize_async(text: str, language: str = "bangla") -> bytes:
    voice = TARA_VOICES.get(language, TARA_VOICES["bangla"])

    communicate = edge_tts.Communicate(
        text=text,
        voice=voice,
        rate=TARA_RATE,
        pitch=TARA_PITCH,
        volume=TARA_VOLUME,
    )

    audio_buffer = io.BytesIO()
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio_buffer.write(chunk["data"])

    audio_buffer.seek(0)
    audio_bytes = audio_buffer.read()

    if not audio_bytes:
        raise RuntimeError("Edge TTS returned empty audio")

    return audio_bytes

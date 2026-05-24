import httpx
from config import ELEVENLABS_API_KEY, TARA_VOICE_ID


def synthesize_tara_voice(text: str) -> bytes:
    """
    Convert text to Tara's voice using ElevenLabs.
    Returns raw MP3 bytes.
    Uses eleven_multilingual_v2 model which supports Bangla.
    """
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{TARA_VOICE_ID}"

    response = httpx.post(
        url,
        headers={
            "xi-api-key":   ELEVENLABS_API_KEY,
            "Content-Type": "application/json",
        },
        json={
            "text":     text,
            "model_id": "eleven_multilingual_v2",
            "voice_settings": {
                "stability":        0.35,
                "similarity_boost": 0.85,
                "style":            0.40,
                "use_speaker_boost": True,
            },
        },
        timeout=30,
    )

    if response.status_code != 200:
        raise ValueError(f"ElevenLabs error {response.status_code}: {response.text}")

    return response.content

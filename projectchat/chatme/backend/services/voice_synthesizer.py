import os
import requests
from dotenv import load_dotenv

load_dotenv()

async def generate_voice_audio_bytes(voice_id: str, text: str) -> bytes:
    ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")

    
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    headers = {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg"
    }

    data = {
        "text": text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.75
        }
    }

    response = requests.post(url, json=data, headers=headers)
    if response.status_code == 200:
        return response.content
    else:
        raise Exception(f"ElevenLabs TTS failed: {response.status_code} - {response.text}")

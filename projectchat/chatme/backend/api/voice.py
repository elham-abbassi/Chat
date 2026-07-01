import os
import requests
from dotenv import load_dotenv
import sys
import os.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from services.voicesStorage import get_voice_id

load_dotenv()

ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
print("test ->", get_voice_id("test"))

async def generate_voice_response(voice_id: str, text: str, output_path: str = None):
    
    if not voice_id:
        raise ValueError("No voice_id found for user.")

  

    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    headers = {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg"
    }
    
    data = {
        "text":text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.75
        }
    }

    response = requests.post(url, json=data, headers=headers)

    if response.status_code == 200:

        audio_dir = "voices"
        os.makedirs(audio_dir, exist_ok=True)
        audio_path = os.path.join(audio_dir, f"response_{voice_id}.mp3")
        with open(audio_path, "wb") as f:
            f.write(response.content)

        return audio_path
    else:
         raise Exception(f"ElevenLabs TTS failed: {response.status_code} - {response.text}")
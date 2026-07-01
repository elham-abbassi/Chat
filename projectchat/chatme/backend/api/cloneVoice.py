from fastapi import UploadFile, File, Form, HTTPException
import requests
import os
import logging
import mimetypes
from dotenv import load_dotenv

load_dotenv()

ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
ELEVENLABS_CLONE_URL = "https://api.elevenlabs.io/v1/voices/add"
print("VoiceClone API Key:", ELEVENLABS_API_KEY)

if not ELEVENLABS_API_KEY:
    raise ValueError("ELEVENLABS_API_KEY is missing! Check your .env file.")


logging.basicConfig(level=logging.INFO)

async def clone_voice(file: UploadFile, voice_name: str): 
  
    headers = {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Accept": "application/json"
    }
    try:
        logging.info(f"Sending file {file.filename}  to ElevenLabs with voice name: {voice_name}")
        

        file_content = await file.read()
        mime_type = file.content_type or mimetypes.guess_type(file.filename)[0] or "audio/mpeg"
        
        files = {
            "files": (file.filename, file_content, mime_type)
        }
        data = {
            "name": voice_name,
            "description": "Voice cloned from user upload"
        }

        response = requests.post(ELEVENLABS_CLONE_URL, headers=headers, files=files, data=data)
        
        
        if response.status_code in [200, 201]:
            return response.json()  
        else:
            logging.error(f"ElevenLabs API Error: {response.text}")
            return {"error": response.text}

    except Exception as e:
        return {"error": str(e)}
    
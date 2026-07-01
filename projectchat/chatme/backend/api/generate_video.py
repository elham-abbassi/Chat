import os
import requests
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()
FAL_API_KEY = os.getenv("FAL_API_KEY")  
print(f"Authorization header being sent: Bearer {FAL_API_KEY}")

headers = {
    "Authorization": f"Bearer {FAL_API_KEY}",
    "Content-Type": "application/json"
}

class TalkingVideoRequest(BaseModel):
    image_url: str
    audio_url: str

app = APIRouter()


async def generate_talking_video(request: TalkingVideoRequest):
    try:
        ray2flash_url = "https://fal.run/fal-ai/luma-dream-machine/ray-2-flash/image-to-video"
        ray_payload = {
            "image_url": request.image_url,
            "motion": "natural",
            "duration": 4
        }

        ray_response = requests.post(ray2flash_url, headers=headers, json=ray_payload)
        if ray_response.status_code != 200:
            raise HTTPException(status_code=500, detail=f"Ray2Flash error: {ray_response.text}")

        ray_data = ray_response.json()
        generated_video_url = ray_data.get("video_url")
        if not generated_video_url:
            raise HTTPException(status_code=500, detail="Video URL not returned by Ray2Flash")


        musetalk_url = "https://fal.run/fal-ai/musetalk/musetalk-lip-sync"
        muse_payload = {
            "video_url": generated_video_url,
            "audio_url": request.audio_url
        }

        muse_response = requests.post(musetalk_url, headers=headers, json=muse_payload)
        if muse_response.status_code != 200:
            raise HTTPException(status_code=500, detail=f"MuseTalk error: {muse_response.text}")

        muse_data = muse_response.json()
        final_video_url = muse_data.get("video_url")
        if not final_video_url:
            raise HTTPException(status_code=500, detail="Final video URL not returned by MuseTalk")

        return JSONResponse(content={"video_url": final_video_url})

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

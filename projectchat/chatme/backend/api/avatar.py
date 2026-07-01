from fastapi import UploadFile, File, HTTPException
import requests
from openai import OpenAI
import httpx
import os
import shutil



DALL_E_API_URL = "https://api.openai.com/v1/images/edits"
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
TEMP_FOLDER = "temps/avatars"  
AVATAR_FOLDER = "avatars"      


os.makedirs(TEMP_FOLDER, exist_ok=True)
os.makedirs(AVATAR_FOLDER, exist_ok=True)

async def generate_avatar(file: UploadFile, prompt: str ):
    """Processes user photo + prompt and returns an avatar"""
    try:
        temp_file_path = os.path.join(TEMP_FOLDER, file.filename)
        final_image_path = os.path.join(AVATAR_FOLDER, file.filename)

        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        mask_path = temp_file_path 

        headers = {"Authorization": f"Bearer {OPENAI_API_KEY}", "Content-Type": "application/json"}
        files = {
            "image": (file.filename, open(temp_file_path, "rb"), "image/png"), 
            "mask": (file.filename, open(mask_path, "rb"), "image/png")
        }

        data = {
            "prompt": prompt,
            "n": 1,
            "size": "1024x1024"
        }
        async with httpx.AsyncClient() as client:
            dalle_response = await client.post(DALL_E_API_URL, headers=headers, files=files, data=data)
        
        if not dalle_response.ok:
            raise HTTPException(status_code=dalle_response.status_code, detail=f"DALL·E API Error: {dalle_response.text}")

        edited_image_url = dalle_response.json().get("data", [{}])[0].get("url", "")
        if not edited_image_url:
            raise HTTPException(status_code=500, detail="Failed to generate an avatar.")
        
        
        shutil.move(temp_file_path, final_image_path)

        return {"message": "New image generated successfully", "edited_image": edited_image_url, "saved_image": f"/{final_image_path}"}
    
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))   

   

async def generate_avatar_from_prompt(prompt: str):
    """Generates an avatar from a prompt only (no image)"""
    try:
       
        response = client.images.generate(
            model="dall-e-3",
            prompt=prompt,
            size="1024x1024",
            quality="standard",
            n=1
        )
        image_url = response.data[0].url

        return {
            "message": "Image generated from prompt successfully",
            "edited_image": image_url
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


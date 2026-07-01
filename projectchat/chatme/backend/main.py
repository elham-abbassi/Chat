from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Request, APIRouter
import inspect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.responses import FileResponse
from pydantic import BaseModel
import requests
from api.chat import get_chat_response
from api.voice import generate_voice_response
from api.cloneVoice import clone_voice
from api.avatar import generate_avatar_from_prompt
from api.edit_photo import edit_photo_pipeline_advanced
import logging
from services.voicesStorage import save_voice_id, get_voice_id
from fastapi.staticfiles import StaticFiles
import os, uuid, subprocess
import shutil
from api.generate_video import generate_talking_video, TalkingVideoRequest
from api.fal_proxy import proxy_fal_logic
import os
from dotenv import load_dotenv
import fal_client
import tempfile
from fastapi.staticfiles import StaticFiles
from api.upload_doc import router as upload_doc_router
from api.scrape_url import router as scrape_url_router
from api.chat import router as chat_router


app = FastAPI()
load_dotenv()
FAL_KEY = os.getenv("FAL_KEY")

app.include_router(upload_doc_router)
app.include_router(scrape_url_router)
app.include_router(chat_router)
app.mount("/avatars/edited", StaticFiles(directory="avatars/edited"), name="avatars-edited")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)


os.makedirs("voices", exist_ok=True)
app.mount("/voices", StaticFiles(directory="voices"), name="voices")


custom_prompt_storage = ""


class ChatRequest(BaseModel):
    message: str
    persona: str
    voice_id: str = None
    chat_type: str = "General"
    custom_prompt: str = ""
    language: str = "en-US"
  

class CustomPromptRequest(BaseModel):
    customPrompt: str


class ChatResponse(BaseModel):
    response: str
    audio_url: str

class TalkingVideoRequest(BaseModel):
    image_url: str
    audio_url: str 
  
@app.get("/")
def read_root():
    return {"message": "Welcome to the Chat API"}

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    try:
        print(f"Received Chat Request: {request.dict()}")
        response_text = get_chat_response(
            request.message, request.persona, request.chat_type, request.custom_prompt
        )

        voice_id = request.voice_id or os.getenv(request.userId)
        if not voice_id:
            raise HTTPException(status_code=400, detail="No valid voice ID found.")
        
        audio_path = await generate_voice_response(voice_id, response_text, request.language)
        audio_url = f"/voices/{os.path.basename(audio_path)}"
        print(" Chat response text:", response_text)
        print(" Audio file path:", audio_path)
        print("Returning audio URL:", audio_url)

        return ChatResponse(response=response_text, audio_url=audio_url)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/set-prompt")
async def set_custom_prompt(request: CustomPromptRequest):
    """
    Stores the custom prompt sent from the frontend.
    """
    global custom_prompt_storage
    custom_prompt_storage = request.customPrompt
    logging.info(f"Custom prompt updated: {custom_prompt_storage}")
    return {"message": "Custom prompt updated successfully"}


@app.get("/get-prompt")
async def get_custom_prompt():
    """
    Retrieves the stored custom prompt.
    """
    return {"customPrompt": custom_prompt_storage}    

@app.options("/clone-voice/")
async def preflight():
    """
    Handles CORS preflight requests
    """
    from fastapi.responses import JSONResponse
    response = JSONResponse(content={"message": "Preflight request successful"})
    response.headers["Access-Control-Allow-Origin"] = "http://localhost:3000"
    response.headers["Access-Control-Allow-Methods"] = "POST, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response

@app.post("/clone-voice")
async def clone_voice_endpoint(file: UploadFile = File(...), voice_name: str = Form(...)):

    existing_voice_id = get_voice_id(voice_name)

    if existing_voice_id:
        return {"success": True, "voice_id": existing_voice_id}

    if not file:
        raise HTTPException(status_code=400, detail="No voice file provided and no saved voice found.")
    
    voice_clone_response = await clone_voice(file, voice_name=voice_name)

    if "voice_id" in voice_clone_response:
        save_voice_id(voice_name, voice_clone_response["voice_id"])
        return {"success": True, "voice_id": voice_clone_response["voice_id"]}
    else:
        return {"success": False, "error": "Voice cloning failed"}


@app.get("/get-voice/{voice_name}")
def get_voice(voice_name: str):
    voice_id = get_voice_id(voice_name)
    if voice_id:
        return {"voice_id": voice_id}
    else:
        raise HTTPException(status_code=404, detail="Voice not found")
    
@app.post("/generate_avatar")
async def generate_avatar_endpoint(file: UploadFile = File(None), prompt: str = Form(...)):
    try:
        avatar_data = await generate_avatar_from_prompt(prompt)
        return JSONResponse(content=avatar_data)
    except Exception as e:
        logging.error(f"Error generating avatar: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    
    
@app.post("/edit_photo")
async def edit_photo_endpoint(
    file: UploadFile = File(...),
    mask: UploadFile = File(None),
    operations: str = Form(...)
):
    try:
        temp_path = os.path.join("temps/avatars", file.filename)
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        mask_path = None
        if mask:
            mask_path = os.path.join("temps/avatars", f"mask_{mask.filename}")
            with open(mask_path, "wb") as buffer:
                shutil.copyfileobj(mask.file, buffer)

        ops = [op.strip() for op in operations.split(",")]
        final_path = await edit_photo_pipeline_advanced(temp_path, operations=ops, mask_path=mask_path)

        return {"edited_image": f"http://localhost:8000/{final_path}"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
   
@app.post("/upload-image")
async def upload_image(file: UploadFile = File(...)):
    try:
        temp_dir = tempfile.gettempdir()
        temp_path = os.path.join(temp_dir, file.filename)
        with open(temp_path, "wb") as f:
            f.write(await file.read())

        url = fal_client.upload_file(temp_path)

        os.remove(temp_path)

        return {"url": url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload-audio")
async def upload_audio(file: UploadFile = File(...)):
    try:
      
        temp_dir = tempfile.gettempdir()
        temp_path = os.path.join(temp_dir, file.filename)
        with open(temp_path, "wb") as f:
            f.write(await file.read())

        
        url = fal_client.upload_file(temp_path)
        os.remove(temp_path)

        return {"url": url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/proxy-fal")
async def proxy_fal(request: Request):
    return await proxy_fal_logic(request)

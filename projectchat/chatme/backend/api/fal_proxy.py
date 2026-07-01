import os
import requests
from fastapi import Request, HTTPException, UploadFile, File, APIRouter
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

load_dotenv()

FAL_KEY = os.getenv("FAL_KEY")

async def proxy_fal_logic(request: Request):
    fal_url = request.headers.get("x-fal-target-url")
    if not fal_url:
        raise HTTPException(status_code=400, detail="Missing x-fal-target-url header")

    if not FAL_KEY:
        raise HTTPException(status_code=500, detail="Missing FAL_KEY environment variable")

    try:
        request_body = await request.body()
        headers = {
            "Authorization": f"Key {FAL_KEY}",
            "Content-Type": "application/json",
        }

        fal_response = requests.post(fal_url, headers=headers, data=request_body)
        return JSONResponse(
            status_code=fal_response.status_code,
            content=fal_response.json()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

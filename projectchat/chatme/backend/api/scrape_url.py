from fastapi import APIRouter, Request
from services.document_reader import scrape_website
from services.embedding import embed_text_chunks, reset_index, stored_chunks, index
from fastapi.responses import JSONResponse
from fastapi import status
import uuid

router = APIRouter()

@router.post("/scrape-website/")
async def scrape_website_endpoint(request: Request):
    
    data = await request.json()
    url = data.get("url")

    if not url:
        return {"error": "URL is required"}

    chunks = scrape_website(url)
    print(f"[scrape_website] Extracted {len(chunks)} text chunks.")

    if not chunks:
        return {"error": "No content to embed from this URL."}

    metadata = {
        "source_type": "url",
        "source_path": url,
    }

    try:
        reset_index()
        embed_text_chunks(chunks, metadata)
        return {
            "message": "Website scraped and embedded",
            "session_id": "web-session-001"
        }
    except Exception as e:
        print("Embedding failed:", e)
        return {"error": f"Embedding failed: {str(e)}"}
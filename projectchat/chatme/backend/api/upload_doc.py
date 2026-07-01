from fastapi import APIRouter, UploadFile, File
from services.document_reader import read_document
from services.embedding import embed_text_chunks

router = APIRouter()

@router.post("/upload-document/")
async def upload_document(file: UploadFile = File(...)):
    try: 
        text_chunks = await read_document(file)
        print("Extracted chunks:", text_chunks)

        if not text_chunks:
            return {"message": "No readable text found in the document."}

        metadata = {
            "document_title": file.filename,
            "source_type": "pdf",
            "source_path": file.filename
        }


        formatted_chunks = [{"text": chunk, "metadata": metadata} for chunk in text_chunks]
        embed_text_chunks(formatted_chunks, metadata)


        return {
            "message": f"Document processed and embedded",
            "chunks_embedded": len(text_chunks),
            "filename": file.filename
        }

    except Exception as e:

        print(f"Error processing document: {e}")
        return {"error": str(e)}


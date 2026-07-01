from openai import OpenAI
import faiss
import numpy as np
from dotenv import load_dotenv
import os
import tiktoken


load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
index = faiss.IndexFlatL2(1536)
stored_chunks = []
index = faiss.IndexFlatL2(1536)
stored_chunks = [] 

def embed_text_chunks(chunks, metadata=None):
   
    texts = [chunk["text"].strip() for chunk in chunks if "text" in chunk and chunk["text"].strip()]
    
    def truncate(text, max_tokens=4000):
        enc = tiktoken.encoding_for_model("text-embedding-ada-002")
        tokens = enc.encode(text)
        return enc.decode(tokens[:max_tokens])
    
    texts = [truncate(t) for t in texts]

    if not texts:
        raise ValueError("No valid text chunks found for embedding.")

    try:
        response = client.embeddings.create(
            model="text-embedding-ada-002",
            input=texts
        )
    
        vectors = [res.embedding for res in response.data]
        
        index.add(np.array(vectors).astype("float32"))
        
        for text in texts:
            stored_chunks.append({
                "text": text,
                "metadata": metadata or {}
            })
    except Exception as e:
        print("Embedding error:", e)
        raise

def reset_index():
    """Optional: clear the current index and chunks"""
    index.reset()
    stored_chunks.clear()
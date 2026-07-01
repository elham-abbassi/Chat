from openai import OpenAI
import os
import numpy as np
from fastapi.responses import Response, FileResponse
from dotenv import load_dotenv
from fastapi import APIRouter, Response, Request
from services.embedding import index, stored_chunks



load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
print("Your OpenAI API Key is:", client.api_key)
router = APIRouter()


CATEGORY_PROMPTS = {
    "Educational": "You are a knowledgeable teacher. Provide structured and detailed educational responses.",
    "Scientific": "You are a scientist. Give fact-based and technical explanations with references when needed.",
    "Historical": "You are a historian. Provide detailed and accurate historical facts.",
    "Casual": "You are a friendly chatbot. Engage in light-hearted and fun conversations.",
}

def get_chat_response(message: str, persona: str, chat_type: str = "General", custom_prompt: str = "") -> str:
    print(f"OpenAI API Call: {message}, Persona: {persona}, Chat Type: {chat_type}")
    """
    Uses the OpenAI Chat API to generate a response.
    The prompt instructs the model to answer as the given persona.
    """
    if chat_type in CATEGORY_PROMPTS:
        category_prompt = f"{persona}, {CATEGORY_PROMPTS[chat_type]}"
    else:
        category_prompt = f"You are {persona} an expert in {chat_type}. Answer questions in a relevant and professional manner."

    prompt = (
        f"You are {persona}.{category_prompt} {custom_prompt} "
        f"Please answer the following question in the same language as it is asked: {message}"
    )
   
    response = client.chat.completions.create(  
            model="gpt-4",
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": message}
                ],
            temperature=0.7,
        )
    result = response.choices[0].message.content.strip()
    print(f" OpenAI Response: {result}")
    
    return result


@router.post("/chat-document/")
async def chat_with_doc(request: Request):

    data = await request.json()
    query = data["message"]
    persona = data.get("persona", "a helpful assistant")
    fallback_allowed = data.get("fallback_allowed", False)
    voice_id = data.get("voice_id", None)

    if len(stored_chunks) == 0:
        print("No chunks found in memory!")
        return {
        "response": "No document context is available. Please upload a document or scrape a website first.",
        "context_warning": True
    }

    query_vector = client.embeddings.create(
        input=query,
        model="text-embedding-ada-002"
    ).data[0].embedding

    D, I = index.search(np.array([query_vector]).astype("float32"), k=4)

    print("FAISS returned indices:", I[0])
    valid_indices = [i for i in I[0] if 0 <= i < len(stored_chunks)]
    print("Valid indices:", valid_indices)

    if not valid_indices:
        return {
            "response": "No relevant document chunks found. Please verify the uploaded content.",
            "context_warning": True
        }
    retrieved_chunks = [stored_chunks[i]["text"] for i in valid_indices]
    context = "\n".join(retrieved_chunks)

    if all(dist > 0.7 for dist in D[0]) or not context.strip():
        if not fallback_allowed:
            return {
                "response": "The document seems unrelated to your question. Do you want an answer from general knowledge?",
                "context_warning": True
            } 
        else:
  
            return {
                "response": get_chat_response(query, persona="an expert", chat_type="General"),
                "context_warning": False
            }

    prompt = f"you are {persona}. Answer the question using ONLY the following context:\n{context}\n\nQuestion: {query}"

    completion = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": prompt}
        ]
    )

    return {
        "response": completion.choices[0].message.content,
        "context_warning": False
    }
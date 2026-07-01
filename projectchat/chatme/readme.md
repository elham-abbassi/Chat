
# AI-Powered Avatar Chatbot Application

This project is a full-stack AI-powered web application that enables users to:
- Upload or generate avatars using DALL·E.
- Clone a voice using ElevenLabs API.
- Chat with a historical or custom persona using GPT-4 (OpenAI).
- Generate synchronized talking videos using FAL (Ray2Flash + MuseTalk).
- Upload or scrape documents/websites to enrich conversation with contextual knowledge (RAG).

## 📁 Project Structure

```
frontend/
│
├── pages/
│   ├── HomePage.js         # Main interface (clone voice, upload docs, launch chat)
│   ├── AvatarPage.js       # Edit or generate avatar from image or prompt
│   └── ChatPage.js         # Voice/text chat with avatar
│
├── services/
│   ├── dalleService.js     # Calls OpenAI for DALL·E image generation/editing
│   ├── document.js         # Uploads files or scrapes URLs
│   └── falUpload.js        # Upload files to backend for Fal/MuseTalk

backend/
│
├── api/
│   ├── avatar.py           # Avatar generation/editing (OpenAI DALL·E API)
│   ├── chat.py             # Text generation (GPT-4) + optional RAG with documents
│   ├── clonevoice.py       # Clone voice using ElevenLabs API
│   ├── voice.py            # Generate TTS voice response using cloned voice
│   ├── generate-video.py   # Ray2Flash + MuseTalk pipeline for talking video
│   ├── upload-doc.py       # Document ingestion (PDF/TXT) and embedding
│   ├── scrape-url.py       # Web scraping and embedding
│   ├── fal-proxy.py        # Proxy API calls to FAL (bypass CORS issues)
│
└── services/
    ├── document-reader.py  # Extracts and chunks documents
    ├── embedding.py        # Embeds texts via OpenAI and stores FAISS index
    ├── voice-synthesizer.py# Low-level TTS generation
    └── voiceStorage.py     # Stores/retrieves cloned voice IDs


## Features & Flow

1. **Voice Cloning**
   - Upload a voice sample (.mp3)
   - ElevenLabs API clones the voice
   - Voice ID saved in local DB (`voices.json`)
   - Used later for TTS generation via `voice.py`

2. **Avatar Generation**
   - Upload image or type a prompt
   - Backend calls OpenAI DALL·E (with/without image mask)
   - Image URL returned and used in chat or video

3. **Document Upload / Scraping**
   - Upload .pdf/.txt → parsed and embedded via OpenAI
   - Or scrape a public webpage and embed extracted content
   - Embedded vectors used for contextual Q&A (RAG)

4. **Chat**
   - GPT-4 generates responses
   - If documents uploaded: answers come from retrieved chunks
   - Text returned + optionally converted to voice (TTS)

5. **Talking Video**
   - Avatar + Voice response → sent to Fal.ai pipeline
   - Ray2Flash generates video with motion
   - MuseTalk syncs lips with voice
   - Final video sent to frontend

## 🔧 Installation & Dependencies

### Backend Setup (FastAPI)

```bash
pip install fastapi uvicorn openai python-dotenv requests PyPDF2 beautifulsoup4 faiss-cpu tiktoken
```

**Environment Variables (`.env`):**

```
OPENAI_API_KEY=your_openai_key
ELEVENLABS_API_KEY=your_elevenlabs_key
FAL_API_KEY=your_fal_key
```

### Frontend Setup (React)

```bash
npm install react-konva use-image
```

You also need React Router and Tailwind for UI if not already included.

## Communication Flow (Frontend ↔ Backend ↔ APIs)

- **Frontend**
  - Sends user actions (upload file, image, prompt) via fetch calls.
  - Displays returned data (avatar, video, chat response, etc.)

- **Backend**
  - Handles logic per route:
    - `/generate_avatar`, `/edit_photo`, `/chat-document`, `/generate-voice`, etc.
  - Integrates with external APIs:
    - OpenAI (chat + image)
    - ElevenLabs (voice)
    - Fal (video generation)

- **External APIs**
  - OpenAI: for both GPT-4 + DALL·E
  - ElevenLabs: for cloning and TTS generation
  - Fal.ai: for image-to-video + lip sync

## Example Flow

1. User uploads photo & audio → HomePage
2. Avatar generated from image + prompt → AvatarPage
3. Voice cloned → saved
4. Chat starts → user speaks/texts
5. GPT-4 returns answer → converted to voice
6. Voice + avatar → animated into video → returned to ChatPage



# Sankshep.ai — One Input. Infinite Content.
### Multi-Provider AI Content Transformation & Comparison Platform

**Sankshep.ai** is an AI-powered content transformation platform that converts any document, web article, or draft into 13+ multi-channel formats with real-time streaming, multi-provider model selection, concurrent comparison mode, PowerPoint (.pptx) export, browser-native Text-to-Speech (TTS), and custom brand voice profiles.

---

## Key Features

| Feature | Details |
|---|---|
| **Multi-Provider AI Registry** | Choose between **Groq**, **OpenAI**, and **Anthropic** with safe server-side credential isolation |
| **Side-by-Side Comparison** | Compare multiple AI providers concurrently on the same source text with isolated error handling |
| **13+ Target Formats** | Blog Post, LinkedIn Post, X/Twitter Thread, Executive Summary, Email Newsletter, Video Script, SEO Meta, FAQ Section, Slide Outline, 5th-Grade Simplification, Captions (SRT), Alt-Text Suggestions, and Multi-Language Translation |
| **Real-Time Streaming** | Token-by-token streaming via FastAPI `StreamingResponse` → Browser `ReadableStream` |
| **Multi-Modal Ingestion** | PDF & DOCX text extraction, TXT/CSV/JSON support, OCR for scanned documents/images, and **instant Web URL scraping** |
| **PowerPoint (.pptx) Export** | One-click export of Slide Outlines to downloadable 16:9 widescreen presentation decks |
| **Brand Voice & Tone Engine** | Selectable tones (*Professional, Casual, Thought Leadership, Persuasive, Academic, Punchy, Storytelling*) and custom Brand Voice Profiles |
| **Text-to-Speech (TTS)** | Clean speech synthesis directly in the browser with audio wave telemetry |
| **Usage Analytics Dashboard** | Real-time tracking of transformations, input/output word volume, delta compression rates, and history log |

---

## 1. Backend Setup (FastAPI + Python)

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
copy .env.example .env   # Fill in your GROQ_API_KEY, OPENAI_API_KEY, and/or ANTHROPIC_API_KEY
uvicorn main:app --reload --port 8000
```

Backend runs on **http://localhost:8000**. Interactive API documentation is available at **http://localhost:8000/docs**.

---

## 2. Frontend Setup (React + Vite + Tailwind CSS)

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on **http://localhost:5173**.

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET`  | `/providers` | List supported and configured AI providers (safe metadata only) |
| `GET`  | `/status` | Check platform status and active engine |
| `POST` | `/transform` | Stream transformed output token-by-token for a selected provider |
| `POST` | `/transform/compare` | Run concurrent multi-provider comparison |
| `POST` | `/extract/url` | Extract clean text from any webpage URL |
| `POST` | `/upload` | Extract text from PDF, DOCX, TXT, CSV, JSON, PNG, JPG (with OCR fallback) |
| `POST` | `/export/pptx` | Generate and stream downloadable `.pptx` PowerPoint file |
| `GET`  | `/history` | Retrieve recent transformation history |
| `GET`  | `/analytics` | Retrieve transformation KPI metrics & top formats |
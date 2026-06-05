# 🧠 NeuralVault — AI-Powered Personal Knowledge Management System

A full-stack, privacy-first AI knowledge management platform. Upload your documents, ask questions in natural language, and get AI-powered answers — all with your data staying in **your** accounts.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router) |
| UI | Tailwind CSS v4 + Custom CSS |
| Auth | Clerk |
| Hosting | Vercel |
| AI LLM | Google Gemini 1.5 Flash |
| Embeddings | Gemini embedding-004 |
| Vector DB | ChromaDB |
| Database | Supabase |
| File Storage | Supabase Storage |
| PDF Processing | PyPDF |
| OCR | Tesseract OCR (via pytesseract) |
| AI Backend | FastAPI (Python) |

---

## Project Structure

```
├── ai-pkm/          # Next.js frontend (deploy to Vercel)
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.js             # Landing page
│   │   │   ├── layout.js           # Root layout with Clerk
│   │   │   ├── (dashboard)/
│   │   │   │   ├── layout.js       # Dashboard sidebar
│   │   │   │   ├── knowledge-base/ # Upload & manage docs
│   │   │   │   ├── chat/           # 3D Avatar + AI Chat
│   │   │   │   └── insights/       # AI-generated insights
│   │   │   └── api/
│   │   │       ├── chat/route.js   # Proxies to FastAPI
│   │   │       └── upload/route.js # Supabase Storage upload
│   │   └── components/
│   │       └── Avatar3D.js         # Three.js 3D avatar with blinking
│   └── .env.local                  # Fill in your API keys
│
├── backend/         # FastAPI backend (deploy to Railway)
│   ├── main.py
│   ├── routes/
│   │   ├── ingest.py               # Document upload endpoint
│   │   └── query.py                # RAG query endpoint
│   ├── services/
│   │   ├── document_processor.py   # PyPDF + Tesseract OCR
│   │   ├── embedder.py             # Gemini Embeddings
│   │   ├── vector_store.py         # ChromaDB operations
│   │   └── rag_chain.py            # LangChain RAG pipeline
│   ├── requirements.txt
│   └── .env.example                # Copy to .env and fill in
│
└── supabase_schema.sql  # Run this in Supabase SQL editor
```

---

## 🚀 Getting Started

### 1. Get Your API Keys

| Service | URL | Key Needed |
|---|---|---|
| Google AI Studio | https://aistudio.google.com/apikey | `GEMINI_API_KEY` |
| Clerk | https://dashboard.clerk.com | Publishable + Secret Key |
| Supabase | https://supabase.com/dashboard | Project URL + Anon Key + Service Role Key |

### 2. Set Up Supabase
1. Create a new Supabase project
2. Go to **SQL Editor** and run `supabase_schema.sql`
3. Go to **Storage** → Create a bucket named `documents` (set to private)

### 3. Configure Frontend
```bash
cd ai-pkm
cp .env.local .env.local.backup  # Already created with placeholders
# Fill in all values in .env.local
npm install
npm run dev
```

### 4. Start Python Backend
```bash
cd backend
pip install -r requirements.txt

# On Windows, install Tesseract OCR:
# https://github.com/UB-Mannheim/tesseract/wiki

cp .env.example .env
# Fill in GEMINI_API_KEY in .env

python main.py
# Backend runs at http://localhost:8000
```

### 5. Use the App
1. Open http://localhost:3000
2. Sign up with Clerk
3. Upload a PDF or document in "Knowledge Base"
4. Ask a question in the "AI Chat" — the 3D avatar will blink and respond!

---

## 🌐 Deploy to Vercel + Railway

### Frontend → Vercel
1. Push `ai-pkm/` to a GitHub repository
2. Go to https://vercel.com/new → Import the repository
3. Set environment variables in the Vercel dashboard (same as `.env.local`)
4. Deploy!

### Backend → Railway
1. Push `backend/` to a separate GitHub repository
2. Go to https://railway.app → New Project → Deploy from GitHub
3. Set environment variables (same as `.env.example`)
4. Railway auto-detects the `Procfile` and deploys
5. Copy your Railway URL and set `NEXT_PUBLIC_BACKEND_URL` in Vercel

---

## 🧩 3D Avatar
The chat page features a fully procedural Three.js 3D avatar built without any external model files:
- **Blinking** — randomized, realistic eyelid animation every 2–5 seconds
- **Speaking glow** — pulsing violet rings appear when AI is generating a response
- **Thinking amber** — amber glow when AI is processing
- **Idle float** — subtle floating animation

---

## 📋 Supabase Storage Setup
Create a bucket named `documents` in your Supabase dashboard and add this storage policy:
```sql
CREATE POLICY "Users can upload their own files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
```

from fastapi import FastAPI, UploadFile, File, Form, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from contextlib import asynccontextmanager
import uvicorn, os
from routes.ingest import router as ingest_router
from routes.query import router as query_router
from services.vector_store import init_chromadb


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize services on startup."""
    print("🚀 NeuralVault AI Backend starting...")
    init_chromadb()
    print("✅ ChromaDB initialized")
    yield
    print("🛑 Backend shutting down")


app = FastAPI(
    title="NeuralVault AI Backend",
    description="RAG-powered knowledge management backend using LangChain + Gemini",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict to your Vercel domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ingest_router, prefix="/ingest", tags=["Ingestion"])
app.include_router(query_router, prefix="", tags=["Query"])


@app.get("/")
def health():
    return {"status": "ok", "service": "NeuralVault AI Backend", "version": "1.0.0"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)

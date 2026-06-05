import os, uuid, tempfile
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, Form, Header, HTTPException
from services.document_processor import process_document
from services.vector_store import add_documents_to_collection
from services.embedder import embed_texts

router = APIRouter()


@router.post("/")
async def ingest_document(
    file: UploadFile = File(...),
    user_id: str = Form(default="demo"),
    file_url: str = Form(default=""),
    x_api_key: str = Header(default=""),
):
    """
    Ingest a document:
    1. Save uploaded file to a temp path
    2. Extract text with PyPDF / Tesseract OCR
    3. Chunk text into segments
    4. Embed with Gemini Embeddings
    5. Store in ChromaDB with user_id metadata
    """
    api_key = x_api_key or os.environ.get("GEMINI_API_KEY", "")
    if not api_key:
        raise HTTPException(status_code=400, detail="GEMINI_API_KEY is required")

    suffix = Path(file.filename).suffix
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        # 1. Extract text chunks
        chunks = process_document(tmp_path, file.filename)
        if not chunks:
            raise HTTPException(status_code=422, detail="Could not extract text from document")

        # 2. Embed with Gemini
        embeddings = embed_texts(chunks, api_key)

        # 3. Store in ChromaDB
        doc_id = str(uuid.uuid4())
        metadatas = [{"user_id": user_id, "doc_name": file.filename, "doc_id": doc_id, "chunk_index": i} for i in range(len(chunks))]
        ids = [f"{doc_id}_chunk_{i}" for i in range(len(chunks))]

        add_documents_to_collection(
            collection_name=f"user_{user_id}",
            documents=chunks,
            embeddings=embeddings,
            metadatas=metadatas,
            ids=ids,
        )

        return {
            "success": True,
            "doc_id": doc_id,
            "chunks_indexed": len(chunks),
            "filename": file.filename,
        }
    finally:
        os.unlink(tmp_path)

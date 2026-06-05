import os
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel
from services.rag_chain import answer_question

router = APIRouter()


class QueryRequest(BaseModel):
    question: str
    user_id: str = "demo"
    top_k: int = 5


@router.post("/query")
async def query_knowledge_base(
    body: QueryRequest,
    x_api_key: str = Header(default=""),
):
    """
    Query the RAG pipeline:
    1. Embed the user's question with Gemini Embeddings
    2. Retrieve top-k relevant chunks from ChromaDB
    3. Build a context-aware prompt
    4. Send to Gemini Pro for a final answer
    5. Return answer + source document names
    """
    api_key = x_api_key or os.environ.get("GEMINI_API_KEY", "")
    if not api_key:
        raise HTTPException(status_code=400, detail="GEMINI_API_KEY required")

    try:
        result = answer_question(
            question=body.question,
            user_id=body.user_id,
            api_key=api_key,
            top_k=body.top_k,
        )
        return {
            "answer": result["answer"],
            "sources": result["sources"],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

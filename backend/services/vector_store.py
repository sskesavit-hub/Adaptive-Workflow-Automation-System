"""
ChromaDB Vector Store Service
Manages persistent vector storage for per-user document collections.
"""
import os
from typing import List, Dict, Optional
import chromadb
from chromadb.config import Settings

_client: Optional[chromadb.Client] = None


def init_chromadb():
    """Initialize the ChromaDB client with persistent storage."""
    global _client
    persist_dir = os.environ.get("CHROMA_PERSIST_DIR", "./chroma_db")
    os.makedirs(persist_dir, exist_ok=True)
    _client = chromadb.PersistentClient(
        path=persist_dir,
        settings=Settings(anonymized_telemetry=False),
    )
    print(f"ChromaDB initialized at {persist_dir}")


def get_client() -> chromadb.Client:
    global _client
    if _client is None:
        init_chromadb()
    return _client


def get_or_create_collection(collection_name: str):
    """Get or create a ChromaDB collection for a user."""
    client = get_client()
    return client.get_or_create_collection(
        name=collection_name,
        metadata={"hnsw:space": "cosine"},
    )


def add_documents_to_collection(
    collection_name: str,
    documents: List[str],
    embeddings: List[List[float]],
    metadatas: List[Dict],
    ids: List[str],
):
    """Add document chunks with embeddings to a user's collection."""
    collection = get_or_create_collection(collection_name)
    collection.add(
        documents=documents,
        embeddings=embeddings,
        metadatas=metadatas,
        ids=ids,
    )


def query_collection(
    collection_name: str,
    query_embedding: List[float],
    top_k: int = 5,
) -> Dict:
    """Query a user's collection using a vector embedding."""
    try:
        collection = get_or_create_collection(collection_name)
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=min(top_k, collection.count()),
            include=["documents", "metadatas", "distances"],
        )
        return results
    except Exception as e:
        print(f"ChromaDB query error: {e}")
        return {"documents": [[]], "metadatas": [[]], "distances": [[]]}


def delete_document(collection_name: str, doc_id: str):
    """Delete all chunks for a specific document."""
    collection = get_or_create_collection(collection_name)
    results = collection.get(where={"doc_id": doc_id})
    if results["ids"]:
        collection.delete(ids=results["ids"])

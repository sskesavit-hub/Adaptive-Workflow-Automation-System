"""
Gemini Embeddings Service
Generates vector embeddings for text chunks using Google's embedding-004 model.
"""
import time
from typing import List
import google.generativeai as genai


def embed_texts(texts: List[str], api_key: str) -> List[List[float]]:
    """
    Embed a list of text chunks using Google's Gemini embedding model.
    Returns a list of float vectors (one per text chunk).
    """
    genai.configure(api_key=api_key)

    embeddings = []
    batch_size = 10  # Gemini embedding API allows batches

    for i in range(0, len(texts), batch_size):
        batch = texts[i:i + batch_size]
        for text in batch:
            try:
                result = genai.embed_content(
                    model="models/embedding-004",
                    content=text,
                    task_type="retrieval_document",
                )
                embeddings.append(result["embedding"])
            except Exception as e:
                print(f"Embedding error for chunk: {e}")
                # Return a zero vector on failure to avoid breaking the pipeline
                embeddings.append([0.0] * 768)

        # Rate limiting: avoid hitting Gemini API limits
        if i + batch_size < len(texts):
            time.sleep(0.5)

    return embeddings


def embed_query(query: str, api_key: str) -> List[float]:
    """
    Embed a single search query using the retrieval_query task type.
    """
    genai.configure(api_key=api_key)
    result = genai.embed_content(
        model="models/embedding-004",
        content=query,
        task_type="retrieval_query",
    )
    return result["embedding"]

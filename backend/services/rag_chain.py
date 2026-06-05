"""
RAG Chain Service
Implements the Retrieval-Augmented Generation pipeline using LangChain + Gemini.
"""
import os
from typing import Dict, List
import google.generativeai as genai
from services.embedder import embed_query
from services.vector_store import query_collection

SYSTEM_PROMPT = """You are NeuralVault, an intelligent personal knowledge assistant.
You have access to the user's private knowledge base containing their documents, notes, and files.

Your role is to:
1. Answer questions based ONLY on the provided context from the user's documents.
2. Be precise, helpful, and cite which documents contain the information.
3. If the context doesn't contain enough information, say so clearly.
4. Never fabricate information — only use what is in the context.

Context from knowledge base:
{context}

User's question: {question}

Provide a helpful, well-structured answer based on the context above."""


def answer_question(
    question: str,
    user_id: str,
    api_key: str,
    top_k: int = 5,
) -> Dict:
    """
    Full RAG pipeline:
    1. Embed the question
    2. Retrieve relevant chunks from ChromaDB
    3. Build a prompt with context
    4. Generate answer with Gemini Pro
    5. Return answer + source document names
    """
    genai.configure(api_key=api_key)

    # Step 1: Embed the question
    query_embedding = embed_query(question, api_key)

    # Step 2: Retrieve relevant chunks from the user's collection
    collection_name = f"user_{user_id}"
    results = query_collection(collection_name, query_embedding, top_k=top_k)

    docs = results.get("documents", [[]])[0]
    metadatas = results.get("metadatas", [[]])[0]
    distances = results.get("distances", [[]])[0]

    # Step 3: Filter by relevance (cosine distance < 0.5 means high similarity)
    relevant_docs = []
    source_names = set()
    for doc, meta, dist in zip(docs, metadatas, distances):
        if dist < 0.6:  # Cosine similarity threshold
            relevant_docs.append(doc)
            if meta.get("doc_name"):
                source_names.add(meta["doc_name"])

    if not relevant_docs:
        return {
            "answer": "I couldn't find relevant information in your knowledge base for that question. Try uploading documents that contain this information.",
            "sources": [],
        }

    # Step 4: Build context and generate answer
    context = "\n\n---\n\n".join(relevant_docs)
    prompt = SYSTEM_PROMPT.format(context=context, question=question)

    model = genai.GenerativeModel("gemini-1.5-flash")
    response = model.generate_content(
        prompt,
        generation_config=genai.GenerationConfig(
            max_output_tokens=1024,
            temperature=0.3,
        ),
    )

    return {
        "answer": response.text,
        "sources": list(source_names),
    }

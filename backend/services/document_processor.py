"""
Document Processor Service
Extracts text from PDFs, images (via OCR), and plain text files.
"""
import os
from pathlib import Path
from typing import List


def process_document(file_path: str, filename: str) -> List[str]:
    """
    Extract text from a document and return a list of chunked text segments.
    Supports: PDF, TXT, MD, PNG/JPG (OCR), DOCX
    """
    ext = Path(filename).suffix.lower()
    text = ""

    if ext == ".pdf":
        text = _extract_pdf(file_path)
    elif ext in [".png", ".jpg", ".jpeg", ".webp", ".tiff", ".bmp"]:
        text = _extract_ocr(file_path)
    elif ext in [".txt", ".md"]:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            text = f.read()
    elif ext == ".docx":
        text = _extract_docx(file_path)
    else:
        # Fallback: try reading as plain text
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                text = f.read()
        except Exception:
            return []

    if not text.strip():
        return []

    return _chunk_text(text)


def _extract_pdf(file_path: str) -> str:
    """Extract text from PDF using PyPDF."""
    try:
        import pypdf
        reader = pypdf.PdfReader(file_path)
        pages = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                pages.append(text)

        full_text = "\n\n".join(pages)

        # If PDF is image-based (no extractable text), try OCR
        if len(full_text.strip()) < 100:
            full_text = _extract_pdf_ocr(file_path)

        return full_text
    except ImportError:
        raise RuntimeError("pypdf not installed. Run: pip install pypdf")
    except Exception as e:
        raise RuntimeError(f"PDF extraction failed: {e}")


def _extract_pdf_ocr(file_path: str) -> str:
    """Convert PDF pages to images then OCR each page."""
    try:
        import pypdf
        import pytesseract
        from PIL import Image
        import fitz  # PyMuPDF

        doc = fitz.open(file_path)
        texts = []
        for page in doc:
            pix = page.get_pixmap(dpi=200)
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            text = pytesseract.image_to_string(img)
            texts.append(text)
        return "\n\n".join(texts)
    except ImportError:
        # Fallback without PyMuPDF
        return ""


def _extract_ocr(file_path: str) -> str:
    """Extract text from an image using Tesseract OCR."""
    try:
        import pytesseract
        from PIL import Image
        img = Image.open(file_path)
        return pytesseract.image_to_string(img)
    except ImportError:
        raise RuntimeError("pytesseract or Pillow not installed. Run: pip install pytesseract Pillow")
    except Exception as e:
        raise RuntimeError(f"OCR extraction failed: {e}")


def _extract_docx(file_path: str) -> str:
    """Extract text from DOCX using python-docx."""
    try:
        from docx import Document
        doc = Document(file_path)
        return "\n".join([para.text for para in doc.paragraphs if para.text.strip()])
    except ImportError:
        raise RuntimeError("python-docx not installed. Run: pip install python-docx")


def _chunk_text(text: str, chunk_size: int = 800, overlap: int = 150) -> List[str]:
    """
    Split text into overlapping chunks for better retrieval.
    Uses a simple sliding window approach.
    """
    words = text.split()
    if not words:
        return []

    chunks = []
    start = 0
    while start < len(words):
        end = start + chunk_size
        chunk = " ".join(words[start:end])
        if chunk.strip():
            chunks.append(chunk)
        start += chunk_size - overlap

    return chunks

"""CGPA extraction endpoint – reads an uploaded PDF transcript and uses
Gemini AI to intelligently extract the CGPA value. Falls back to regex
if the AI service is unavailable."""

import io
import re
import os
import base64
import logging
import httpx
from fastapi import APIRouter, UploadFile, File, HTTPException

from pypdf import PdfReader

router = APIRouter()
logger = logging.getLogger(__name__)

ALLOWED_MIME = "application/pdf"

# Regex fallback patterns (most-specific first)
CGPA_PATTERNS = [
    re.compile(
        r'(?:CGPA|C\.?\s*G\.?\s*P\.?\s*A\.?|'
        r'Cumulative\s+G\.?P\.?A\.?|'
        r'Cumulative\s+Grade\s+Point\s+Average)'
        r'\s*[:\-=]?\s*'
        r'([0-5]\.\d{1,3})',
        re.IGNORECASE,
    ),
    re.compile(
        r'Grade\s+Point\s+Average'
        r'\s*[:\-=]?\s*'
        r'([0-5]\.\d{1,3})',
        re.IGNORECASE,
    ),
    re.compile(
        r'\bGPA\b'
        r'\s*[:\-=]?\s*'
        r'([0-5]\.\d{1,3})',
        re.IGNORECASE,
    ),
]


def _regex_extract(text: str) -> str | None:
    """Try to extract CGPA from text using regex patterns."""
    for pattern in CGPA_PATTERNS:
        match = pattern.search(text)
        if match:
            return f"{float(match.group(1)):.2f}"
    return None


async def _gemini_extract(pdf_bytes: bytes, extracted_text: str) -> str | None:
    """Use Gemini AI to extract CGPA from the PDF content."""
    api_key = os.getenv("GEMINI_API_KEY", "")
    if not api_key:
        return None

    # Build the prompt using extracted text (works for both text-based and
    # partially-readable PDFs). Also encode first page as image for scanned docs.
    prompt = (
        "You are a document analysis assistant. The following text was extracted "
        "from a Nigerian university academic transcript PDF.\n\n"
        "Your task: Find and return ONLY the student's Cumulative Grade Point Average (CGPA). "
        "This is the overall/final GPA across all semesters — NOT a single semester GPA.\n\n"
        "Rules:\n"
        "- Return ONLY the numeric value (e.g. '3.75' or '4.20'), nothing else.\n"
        "- If you find multiple GPA values, return the CUMULATIVE one (usually the last or highest-level one).\n"
        "- Nigerian universities use a 5.0 scale. Values will be between 0.00 and 5.00.\n"
        "- If you cannot find any CGPA, return exactly: NOT_FOUND\n\n"
        f"Extracted transcript text:\n{extracted_text[:4000]}"
    )

    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"gemini-2.0-flash:generateContent?key={api_key}"
    )
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.0, "maxOutputTokens": 20},
    }

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(url, json=payload)

        if resp.status_code != 200:
            logger.warning("Gemini CGPA extraction failed: %s", resp.text)
            return None

        data = resp.json()
        raw = (
            data.get("candidates", [{}])[0]
            .get("content", {})
            .get("parts", [{}])[0]
            .get("text", "")
            .strip()
        )

        if not raw or raw == "NOT_FOUND":
            return None

        # Validate the returned value looks like a real CGPA
        match = re.search(r'([0-5]\.\d{1,3})', raw)
        if match:
            return f"{float(match.group(1)):.2f}"
        return None

    except Exception as exc:
        logger.error("Gemini CGPA extraction exception: %s", exc)
        return None


@router.post("/extract-cgpa/")
async def extract_cgpa(file: UploadFile = File(...)):
    """Accept a PDF upload and extract the CGPA using Gemini AI, with regex fallback."""

    if file.content_type != ALLOWED_MIME:
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are accepted. Please upload a valid PDF.",
        )

    contents = await file.read()
    pdf_stream = io.BytesIO(contents)

    try:
        reader = PdfReader(pdf_stream)
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="The uploaded file could not be read as a valid PDF.",
        )

    # Extract all text from the PDF
    full_text = ""
    for page in reader.pages:
        page_text = page.extract_text() or ""
        full_text += page_text + "\n"

    logger.info("PDF text extracted (%d chars)", len(full_text))

    # 1. Try regex first (fastest, no API cost)
    cgpa = _regex_extract(full_text)
    if cgpa:
        logger.info("CGPA extracted via regex: %s", cgpa)
        return {"success": True, "cgpa": cgpa, "method": "regex"}

    # 2. Try Gemini AI (handles complex layouts, scanned docs with some text)
    cgpa = await _gemini_extract(contents, full_text)
    if cgpa:
        logger.info("CGPA extracted via Gemini: %s", cgpa)
        return {"success": True, "cgpa": cgpa, "method": "ai"}

    # 3. Neither method found anything
    return {
        "success": False,
        "error": (
            "Could not extract CGPA from this PDF. "
            "Please verify its format or enter your CGPA manually."
        ),
    }

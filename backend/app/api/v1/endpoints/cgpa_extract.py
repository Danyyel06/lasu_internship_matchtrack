"""CGPA extraction endpoint – reads an uploaded PDF transcript in-memory
and returns the first CGPA value found via regex."""

import io
import logging
import re
from fastapi import APIRouter, UploadFile, File, HTTPException

from pypdf import PdfReader

router = APIRouter()
logger = logging.getLogger(__name__)

# Ordered from most specific to most lenient.  We try each pattern in
# sequence and return the first successful match.
CGPA_PATTERNS = [
    # Pattern 1 – labelled CGPA with 1-3 decimal digits
    # Handles: "CGPA: 3.75", "C.G.P.A  -  4.20", "Cumulative GPA\n3.50"
    re.compile(
        r'(?:CGPA|C\.?\s*G\.?\s*P\.?\s*A\.?|'
        r'Cumulative\s+G\.?P\.?A\.?|'
        r'Cumulative\s+Grade\s+Point\s+Average)'
        r'\s*[:\-=]?\s*'
        r'([0-5]\.\d{1,3})',
        re.IGNORECASE,
    ),
    # Pattern 2 – "Grade Point Average" followed by a number (looser label)
    re.compile(
        r'Grade\s+Point\s+Average'
        r'\s*[:\-=]?\s*'
        r'([0-5]\.\d{1,3})',
        re.IGNORECASE,
    ),
    # Pattern 3 – "GPA" as a standalone word followed by a number
    re.compile(
        r'\bGPA\b'
        r'\s*[:\-=]?\s*'
        r'([0-5]\.\d{1,3})',
        re.IGNORECASE,
    ),
]

ALLOWED_MIME = "application/pdf"


@router.post("/extract-cgpa/")
async def extract_cgpa(file: UploadFile = File(...)):
    """Accept a PDF upload and attempt to extract a CGPA value."""

    # --- MIME-type safety check -----------------------------------------
    if file.content_type != ALLOWED_MIME:
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are accepted. Please upload a valid PDF.",
        )

    # --- Read file entirely in memory (no disk writes) ------------------
    contents = await file.read()
    pdf_stream = io.BytesIO(contents)

    try:
        reader = PdfReader(pdf_stream)
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="The uploaded file could not be read as a valid PDF.",
        )

    # --- Extract text from every page -----------------------------------
    full_text = ""
    for page in reader.pages:
        page_text = page.extract_text() or ""
        full_text += page_text + "\n"

    # Log the extracted text so we can debug pattern misses during dev
    logger.info("Extracted PDF text (%d chars): %s", len(full_text), full_text[:500])

    # --- Try each pattern in priority order -----------------------------
    for pattern in CGPA_PATTERNS:
        match = pattern.search(full_text)
        if match:
            raw = match.group(1)
            # Normalise to exactly 2 decimal places for consistency
            cgpa_value = f"{float(raw):.2f}"
            return {"success": True, "cgpa": cgpa_value}

    return {
        "success": False,
        "error": "Could not extract CGPA from this PDF. Please verify its format or enter your CGPA manually.",
    }

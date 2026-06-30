import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.v1.router import api_router

app = FastAPI(
    title="LASU Internship Platform API",
    description="API for the LASU SIWES Internship Management and Development Platform",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded artifact photos during development.
# Replace with CDN / cloud storage in production.
UPLOADS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "uploads", "artifacts")
os.makedirs(UPLOADS_DIR, exist_ok=True)
app.mount("/uploads/artifacts", StaticFiles(directory=UPLOADS_DIR), name="artifact_uploads")

app.include_router(api_router, prefix="/api/v1")

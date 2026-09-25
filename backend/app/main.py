import os
from dotenv import load_dotenv

# Load .env before anything else so os.getenv() calls pick up the values
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.v1.router import api_router
from app.core.config import settings

app = FastAPI(
    title="LASU Internship Platform API",
    description="API for the LASU SIWES Internship Management and Development Platform",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

configured_origins = [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=configured_origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.\d+\.\d+\.\d+)(:\d+)?$",
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

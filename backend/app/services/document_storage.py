import os
import uuid
import shutil
from abc import ABC, abstractmethod
from pathlib import Path

class DocumentStorage(ABC):
    @abstractmethod
    def save(self, file_bytes: bytes, filename: str, subfolder: str = "") -> str:
        """Save file and return internal storage path."""
        pass
    
    @abstractmethod
    def get_bytes(self, storage_path: str) -> bytes:
        """Retrieve file bytes by internal storage path."""
        pass

class LocalFileStorage(DocumentStorage):
    """Dev storage. Writes to ./uploads/verification-docs/. Never expose paths directly."""
    
    def __init__(self, base_dir: str | None = None):
        if base_dir is None:
            base_dir = os.path.join(
                os.path.dirname(__file__), "..", "..", "..", "uploads", "verification-docs"
            )
        self.base_dir = Path(base_dir).resolve()
        self.base_dir.mkdir(parents=True, exist_ok=True)
    
    def save(self, file_bytes: bytes, filename: str, subfolder: str = "") -> str:
        safe_name = f"{uuid.uuid4().hex}_{Path(filename).name}"
        target_dir = self.base_dir / subfolder
        target_dir.mkdir(parents=True, exist_ok=True)
        path = target_dir / safe_name
        path.write_bytes(file_bytes)
        relative = str(path.relative_to(self.base_dir))
        return relative  # storage_path is always relative to base_dir
    
    def get_bytes(self, storage_path: str) -> bytes:
        path = self.base_dir / storage_path
        if not path.exists():
            raise FileNotFoundError(f"Document not found: {storage_path}")
        return path.read_bytes()

def get_document_storage() -> DocumentStorage:
    env = os.getenv("ENV", "development")
    if env == "development" or not os.getenv("S3_BUCKET"):
        return LocalFileStorage()
    # TODO: return S3Storage() when S3_BUCKET is set
    return LocalFileStorage()

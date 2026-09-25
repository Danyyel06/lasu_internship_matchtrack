from __future__ import annotations
from datetime import datetime
from sqlalchemy import Integer, String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base

class VerificationDocument(Base):
    __tablename__ = "verification_documents"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    submission_id: Mapped[int] = mapped_column(Integer, ForeignKey("verification_submissions.id", ondelete="CASCADE"), nullable=False)
    doc_type: Mapped[str] = mapped_column(String(50), nullable=False)  # incorporation_cert|gov_id|proof_of_address|letter_of_authority|tin_cert
    storage_path: Mapped[str] = mapped_column(String(500), nullable=False)  # internal path, never exposed directly
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    review_status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)  # pending|approved|flagged
    review_note: Mapped[str | None] = mapped_column(Text, nullable=True)

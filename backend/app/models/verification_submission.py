from __future__ import annotations
import enum
from datetime import datetime
from sqlalchemy import Integer, SmallInteger, String, Text, DateTime, ForeignKey, func, Index
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base

class VerificationStatus(str, enum.Enum):
    DRAFT = "draft"
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    INFO_REQUESTED = "info_requested"

class VerificationSubmission(Base):
    __tablename__ = "verification_submissions"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    company_id: Mapped[int] = mapped_column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    tier: Mapped[int] = mapped_column(SmallInteger, nullable=False)  # 1-4
    payload: Mapped[dict | None] = mapped_column(JSONB, nullable=True)  # tier-specific field data
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    reviewer_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    reviewer_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    auto_check_result: Mapped[dict | None] = mapped_column(JSONB, nullable=True)  # CAC lookup results, duplicate flags
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

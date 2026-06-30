from __future__ import annotations
from datetime import datetime
from typing import TYPE_CHECKING
from sqlalchemy import Integer, String, Numeric, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import User

class Company(Base):
    __tablename__ = "companies"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    company_name: Mapped[str] = mapped_column(String(200), nullable=False)
    registration_no: Mapped[str | None] = mapped_column(String(50), nullable=True)
    industry: Mapped[str | None] = mapped_column(String(100), nullable=True)
    is_admin_verified: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    previous_fair_score: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)
    
    company_address: Mapped[str | None] = mapped_column(String(255), nullable=True)
    company_website: Mapped[str | None] = mapped_column(String(255), nullable=True)
    company_logo_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    company_size: Mapped[str | None] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

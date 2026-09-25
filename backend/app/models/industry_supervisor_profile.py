from __future__ import annotations
from typing import TYPE_CHECKING
from sqlalchemy import Integer, String, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.company import Company

class IndustrySupervisorProfile(Base):
    __tablename__ = "industry_supervisor_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    company_id: Mapped[int] = mapped_column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    phone_number: Mapped[str | None] = mapped_column(String(30), nullable=True)
    linkedin_profile: Mapped[str | None] = mapped_column(String(255), nullable=True)
    mentorship_philosophy: Mapped[str | None] = mapped_column(Text, nullable=True)

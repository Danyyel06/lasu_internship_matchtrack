from __future__ import annotations
from datetime import date, datetime
from typing import TYPE_CHECKING
from sqlalchemy import Integer, String, Text, Numeric, Date, DateTime, Boolean, ForeignKey, func
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.company import Company
    from app.models.job_family import JobFamily, SubRole

class Internship(Base):
    __tablename__ = "internships"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    company_id: Mapped[int] = mapped_column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    location: Mapped[str | None] = mapped_column(String(150), nullable=True)
    duration_weeks: Mapped[int | None] = mapped_column(Integer, nullable=True)
    stipend: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    application_deadline: Mapped[date | None] = mapped_column(Date, nullable=True)
    job_family_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("job_families.id", ondelete="SET NULL"), nullable=True)
    sub_role_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("sub_roles.id", ondelete="SET NULL"), nullable=True)
    track_type: Mapped[str | None] = mapped_column(String(20), nullable=True) # "competitive" or "equity"
    total_slots: Mapped[int | None] = mapped_column(Integer, nullable=True)
    accepted_tiers: Mapped[list[str] | None] = mapped_column(ARRAY(String(10)), nullable=True)
    status: Mapped[str | None] = mapped_column(String(20), default="draft")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    requirements: Mapped[list[InternshipRequirement]] = relationship(
        "InternshipRequirement", back_populates="internship", cascade="all, delete-orphan"
    )

class InternshipRequirement(Base):
    __tablename__ = "internship_requirements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    internship_id: Mapped[int] = mapped_column(Integer, ForeignKey("internships.id", ondelete="CASCADE"), nullable=False)
    skill_name: Mapped[str] = mapped_column(String(255), nullable=False)
    required_level: Mapped[int | None] = mapped_column(Integer, nullable=True) # 1-5 scale
    is_mandatory: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")

    internship: Mapped[Internship] = relationship("Internship", back_populates="requirements")

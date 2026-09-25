from __future__ import annotations
from typing import TYPE_CHECKING
from sqlalchemy import Integer, String, Text, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.student import StudentJobFamilySelection


class JobFamily(Base):
    __tablename__ = "job_families"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    # WSM weights JSON: {"cgpa": N, "skills": N, "projects": N, "coursework": N} — must sum to 100
    default_weights: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    coursework_options: Mapped[list | None] = mapped_column(JSONB, nullable=True)

    sub_roles: Mapped[list[SubRole]] = relationship("SubRole", back_populates="job_family", cascade="all, delete-orphan")


class SubRole(Base):
    __tablename__ = "sub_roles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    job_family_id: Mapped[int] = mapped_column(Integer, ForeignKey("job_families.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    # List of skill name strings for Step 5 of onboarding wizard
    skills: Mapped[list | None] = mapped_column(JSONB, nullable=True)

    job_family: Mapped[JobFamily] = relationship("JobFamily", back_populates="sub_roles")

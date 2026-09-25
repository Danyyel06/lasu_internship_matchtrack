from __future__ import annotations
from datetime import date, datetime
from typing import TYPE_CHECKING
from sqlalchemy import Integer, String, Numeric, Date, DateTime, ForeignKey, func, ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.job_family import JobFamily, SubRole


class Student(Base):
    __tablename__ = "students"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    matric_no: Mapped[str] = mapped_column(String(20), nullable=False, unique=True)
    faculty: Mapped[str] = mapped_column(String(100), nullable=False)
    department: Mapped[str] = mapped_column(String(100), nullable=False)
    level: Mapped[int | None] = mapped_column(Integer, nullable=True)
    cgpa: Mapped[float | None] = mapped_column(Numeric(3, 2), nullable=True)
    phone_number: Mapped[str | None] = mapped_column(String(20), nullable=True)
    date_of_birth: Mapped[date | None] = mapped_column(Date, nullable=True)
    gender: Mapped[str | None] = mapped_column(String(20), nullable=True)
    profile_photo_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    preliminary_fit_score: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)
    verified_fit_score: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)
    onboarding_completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    skill_verification_completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    current_tier: Mapped[str | None] = mapped_column(String(10), nullable=True)  # T1, T2, T3
    project_count: Mapped[int | None] = mapped_column(Integer, default=0, server_default="0")
    coursework_count: Mapped[int | None] = mapped_column(Integer, default=0, server_default="0")

    skills: Mapped[list[StudentSkill]] = relationship("StudentSkill", back_populates="student", cascade="all, delete-orphan")
    job_family_selection: Mapped[StudentJobFamilySelection | None] = relationship("StudentJobFamilySelection", back_populates="student", uselist=False, cascade="all, delete-orphan")


class StudentJobFamilySelection(Base):
    __tablename__ = "student_job_family_selections"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    student_id: Mapped[int] = mapped_column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False, unique=True)
    job_family_id: Mapped[int] = mapped_column(Integer, ForeignKey("job_families.id", ondelete="RESTRICT"), nullable=False)
    selected_sub_role_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("sub_roles.id", ondelete="SET NULL"), nullable=True)

    student: Mapped[Student] = relationship("Student", back_populates="job_family_selection")


class StudentSkill(Base):
    __tablename__ = "student_skills"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    student_id: Mapped[int] = mapped_column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    skill_name: Mapped[str] = mapped_column(String(100), nullable=False)
    claimed_level: Mapped[int | None] = mapped_column(Integer, nullable=True)  # 1-5
    verified_level: Mapped[int | None] = mapped_column(Integer, nullable=True)  # 1-5, set after diagnostic
    test_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    verification_status: Mapped[str] = mapped_column(String(20), default="unverified", server_default="unverified")
    successful_reverify_count: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    last_attempt_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    cooldown_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    student: Mapped[Student] = relationship("Student", back_populates="skills")

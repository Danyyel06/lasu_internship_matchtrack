from __future__ import annotations
from datetime import datetime
from typing import TYPE_CHECKING
from sqlalchemy import Integer, String, Numeric, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.student import Student
    from app.models.internship import Internship
    from app.models.user import User

class Application(Base):
    __tablename__ = "applications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    student_id: Mapped[int] = mapped_column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    internship_id: Mapped[int] = mapped_column(Integer, ForeignKey("internships.id", ondelete="CASCADE"), nullable=False)
    fit_score: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)
    tier_at_application: Mapped[str | None] = mapped_column(String(10), nullable=True) # T1/T2/T3
    status: Mapped[str] = mapped_column(String(20), default="applied")
    industry_supervisor_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    academic_supervisor_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    applied_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    decided_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships can be added here if needed, for instance:
    # student: Mapped[Student] = relationship("Student")
    # internship: Mapped[Internship] = relationship("Internship")

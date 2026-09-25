from sqlalchemy import Integer, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base

class AcademicSupervisorProfile(Base):
    __tablename__ = "academic_supervisor_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    head_of_department_id: Mapped[int] = mapped_column(Integer, ForeignKey("head_of_departments.id", ondelete="CASCADE"), nullable=False)
    department: Mapped[str | None] = mapped_column(String(100), nullable=True)
    faculty: Mapped[str | None] = mapped_column(String(100), nullable=True)
    phone_number: Mapped[str | None] = mapped_column(String(20), nullable=True)
    office_location: Mapped[str | None] = mapped_column(String(100), nullable=True)
    title: Mapped[str | None] = mapped_column(String(100), nullable=True)

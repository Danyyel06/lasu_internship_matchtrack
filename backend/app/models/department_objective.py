from datetime import datetime
from sqlalchemy import Integer, String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base

class DepartmentObjective(Base):
    __tablename__ = "department_objectives"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    department_name: Mapped[str] = mapped_column(String(100), nullable=False)
    faculty: Mapped[str | None] = mapped_column(String(100), nullable=True)
    objective_text: Mapped[str] = mapped_column(Text, nullable=False)
    display_order: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_by_admin_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

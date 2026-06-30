from __future__ import annotations
from datetime import date
from sqlalchemy import Integer, String, Date, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base

class InternshipCycle(Base):
    __tablename__ = "internship_cycles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")

from sqlalchemy import Integer, String, ForeignKey, Date, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func
from datetime import datetime, date

from app.db.base import Base

class Intervention(Base):
    __tablename__ = "interventions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    application_id: Mapped[int] = mapped_column(Integer, ForeignKey("applications.id"), nullable=False)
    academic_supervisor_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    contact_method: Mapped[str] = mapped_column(String(50), nullable=False)
    contact_date: Mapped[date] = mapped_column(Date, nullable=False)
    notes: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

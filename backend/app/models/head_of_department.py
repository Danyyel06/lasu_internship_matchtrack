from sqlalchemy import Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base

class HeadOfDepartment(Base):
    __tablename__ = "head_of_departments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    department: Mapped[str] = mapped_column(String(100), nullable=False)
    faculty: Mapped[str | None] = mapped_column(String(100), nullable=True)
    is_admin_verified: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")

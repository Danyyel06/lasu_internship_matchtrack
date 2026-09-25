import enum
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, func, Text
from sqlalchemy.dialects.postgresql import ENUM as PgEnum
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class UserRole(str, enum.Enum):
    STUDENT = "student"
    COMPANY_REP = "company_rep"
    INDUSTRY_SUPERVISOR = "industry_supervisor"
    HEAD_OF_DEPARTMENT = "head_of_department"
    ACADEMIC_SUPERVISOR = "academic_supervisor"
    SUPER_ADMIN = "super_admin"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(
        String(100), unique=True, nullable=False, index=True
    )
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        PgEnum(
            UserRole,
            name="user_role",
            create_type=True,
            values_callable=lambda obj: [e.value for e in obj],
        ),
        nullable=False,
    )
    first_name: Mapped[str] = mapped_column(String(50), nullable=False)
    last_name: Mapped[str] = mapped_column(String(50), nullable=False)
    is_verified: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default="false"
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, default=True, server_default="true"
    )
    # Invitation-based activation: set when an Industry Supervisor or Academic
    # Supervisor account is created by a Company Rep / HOD respectively.
    # Cleared once the user sets their own password via POST /auth/activate.
    activation_token: Mapped[str | None] = mapped_column(
        String(128), nullable=True, unique=True, index=True
    )
    is_activated: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default="false"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

"""
Model for the Industry Supervisor Monthly Review / Endorsement system.
"""
from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Integer, String, Text, Boolean, DateTime, ForeignKey, Enum, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

import enum


class EndorsementAction(str, enum.Enum):
    endorsed = "endorsed"
    flagged = "flagged"


class MonthlyEndorsement(Base):
    """
    One row per (placement / application, month_year) pair.
    Locked after the Industry Supervisor submits the endorsement or flag.
    """

    __tablename__ = "monthly_endorsements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    # FK to applications (accepted applications == placements in current schema)
    application_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("applications.id", ondelete="CASCADE"), nullable=False
    )
    industry_supervisor_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    # e.g. "2026-06" — ISO 8601 year-month
    month_year: Mapped[str] = mapped_column(String(7), nullable=False)

    action: Mapped[EndorsementAction] = mapped_column(
        Enum(EndorsementAction, name="endorsement_action_enum"), nullable=False
    )
    # Required when action == flagged
    flag_comment: Mapped[str | None] = mapped_column(Text, nullable=True)

    # West Africa Time timestamp of submission
    created_at_wat: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    # Once locked, cannot be modified
    is_locked: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default="false"
    )

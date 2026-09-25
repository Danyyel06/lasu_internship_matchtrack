from __future__ import annotations
from datetime import datetime
from typing import TYPE_CHECKING
from sqlalchemy import Integer, String, Numeric, Boolean, DateTime, ForeignKey, func, SmallInteger, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import User

class Company(Base):
    __tablename__ = "companies"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    company_name: Mapped[str] = mapped_column(String(200), nullable=False)
    registration_no: Mapped[str | None] = mapped_column(String(50), nullable=True)
    industry: Mapped[str | None] = mapped_column(String(100), nullable=True)
    is_admin_verified: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    rejection_note: Mapped[str | None] = mapped_column(String(500), nullable=True)
    previous_fair_score: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)
    
    company_address: Mapped[str | None] = mapped_column(String(255), nullable=True)
    company_website: Mapped[str | None] = mapped_column(String(255), nullable=True)
    company_logo_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    company_size: Mapped[str | None] = mapped_column(String(50), nullable=True)
    phone_number: Mapped[str | None] = mapped_column(String(30), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Trust tier system
    trust_tier: Mapped[int] = mapped_column(SmallInteger, default=1, server_default="1", nullable=False)
    tier_1_status: Mapped[str] = mapped_column(String(20), default='pending', server_default="'pending'", nullable=False)  # pending|approved|rejected|info_requested
    tier_2_status: Mapped[str | None] = mapped_column(String(20), nullable=True)  # None until submitted
    tier_3_status: Mapped[str | None] = mapped_column(String(20), nullable=True)
    tier_4_status: Mapped[str | None] = mapped_column(String(20), nullable=True)

    # Verification method (set at Tier 2)
    verification_method: Mapped[str | None] = mapped_column(String(30), nullable=True)  # cac_rc|cac_bn|tin|professional_body|referral|individual_anchored
    is_individual_verified: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")

    # Suspension
    suspended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    suspension_reason: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Tier 1 fields collected at onboarding
    state: Mapped[str | None] = mapped_column(String(100), nullable=True)
    lga: Mapped[str | None] = mapped_column(String(100), nullable=True)
    rep_job_title: Mapped[str | None] = mapped_column(String(100), nullable=True)
    rep_phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    internship_description: Mapped[str | None] = mapped_column(Text, nullable=True)  # "what would an intern do here"

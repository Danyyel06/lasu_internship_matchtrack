from pydantic import BaseModel, EmailStr, Field
from datetime import datetime

class CompanyRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    first_name: str = Field(..., min_length=1, max_length=50)
    last_name: str = Field(..., min_length=1, max_length=50)
    company_name: str = Field(..., min_length=1, max_length=200)

class CompanyOnboardingRequest(BaseModel):
    registration_no: str | None = None
    industry: str | None = None
    company_address: str | None = None
    company_website: str | None = None
    company_logo_url: str | None = None
    company_size: str | None = None

class CompanyResponse(BaseModel):
    id: int
    user_id: int
    company_name: str
    registration_no: str | None = None
    industry: str | None = None
    is_admin_verified: bool
    previous_fair_score: float | None = None
    company_address: str | None = None
    company_website: str | None = None
    company_logo_url: str | None = None
    company_size: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}

class CreateSupervisorRequest(BaseModel):
    full_name: str
    job_title: str
    work_email: EmailStr

class SupervisorResponse(BaseModel):
    id: int
    user_id: int
    name: str
    title: str
    email: str
    interns_assigned: int
    status: str
    activation_url: str | None = None  # Returned only on creation (dev mode)

from typing import Optional, Any

class CompanyOnboardingStartRequest(BaseModel):
    """Tier 1 onboarding — no documents required."""
    # About the organisation
    company_name: str = Field(..., min_length=1, max_length=200)
    industry: str
    company_size: str
    state: str
    lga: str
    # About you
    first_name: str = Field(..., min_length=1, max_length=50)
    last_name: str = Field(..., min_length=1, max_length=50)
    rep_job_title: str
    email: EmailStr
    rep_phone: str
    # About the internship
    internship_description: str = Field(..., min_length=80)
    # Account
    password: str = Field(..., min_length=8)
    confirm_password: str
    # Agreements
    agree_terms: bool
    agree_authorised: bool
    agree_consent: bool

class OtpVerifyRequest(BaseModel):
    session_id: str
    otp: str = Field(..., min_length=6, max_length=6)

class OtpStartResponse(BaseModel):
    session_id: str
    message: str
    dev_otp_email: Optional[str] = None  # Only in development
    dev_otp_phone: Optional[str] = None  # Only in development

class VerificationTierStatusResponse(BaseModel):
    tier: int
    name: str
    status: Optional[str] = None  # None = locked/not started
    submitted_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None
    reviewer_note: Optional[str] = None
    approval_date: Optional[datetime] = None
    submission_id: Optional[int] = None

class VerificationStatusResponse(BaseModel):
    trust_tier: int
    tiers: list[VerificationTierStatusResponse]
    capabilities: dict[str, Any]
    is_suspended: bool
    suspension_reason: Optional[str] = None
    is_individual_verified: bool

class SubmissionDraftRequest(BaseModel):
    payload: dict[str, Any]

class AdminQueueItem(BaseModel):
    submission_id: int
    company_id: int
    company_name: str
    rep_email: str
    rep_name: str
    tier: int
    tier_name: str
    status: str
    submitted_at: Optional[datetime] = None
    auto_flags: list[str] = []
    model_config = {"from_attributes": True}

class AdminSubmissionDetail(BaseModel):
    submission_id: int
    company_id: int
    company_name: str
    tier: int
    status: str
    payload: Optional[dict] = None
    auto_check_result: Optional[dict] = None
    reviewer_note: Optional[str] = None
    submitted_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None
    # Rep details
    rep_name: str
    rep_email: str
    rep_phone: Optional[str] = None
    rep_job_title: Optional[str] = None
    email_verified: bool = False
    phone_verified: bool = False
    # Company fields
    industry: Optional[str] = None
    company_size: Optional[str] = None
    state: Optional[str] = None
    lga: Optional[str] = None
    internship_description: Optional[str] = None
    is_individual_verified: bool = False
    model_config = {"from_attributes": True}

class AdminActionRequest(BaseModel):
    note: Optional[str] = None

class AdminDowngradeRequest(BaseModel):
    target_tier: int
    reason: str

class AdminSuspendRequest(BaseModel):
    reason: str

class CompanyDetailResponse(BaseModel):
    id: int
    company_name: str
    trust_tier: int
    tier_1_status: str
    tier_2_status: Optional[str] = None
    tier_3_status: Optional[str] = None
    tier_4_status: Optional[str] = None
    is_suspended: bool
    suspension_reason: Optional[str] = None
    is_individual_verified: bool
    verification_method: Optional[str] = None
    industry: Optional[str] = None
    company_size: Optional[str] = None
    state: Optional[str] = None
    created_at: datetime
    submissions: list[dict] = []
    events: list[dict] = []
    model_config = {"from_attributes": True}

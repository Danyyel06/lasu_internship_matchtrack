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

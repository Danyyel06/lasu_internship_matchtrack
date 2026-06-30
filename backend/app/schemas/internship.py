from pydantic import BaseModel
from datetime import date, datetime
from typing import List

class InternshipRequirementCreate(BaseModel):
    skill_name: str
    required_level: int
    is_mandatory: bool = True

class InternshipRequirementResponse(BaseModel):
    id: int
    skill_name: str
    required_level: int | None = None
    is_mandatory: bool

    model_config = {"from_attributes": True}

class InternshipCreate(BaseModel):
    title: str
    description: str | None = None
    location: str | None = None
    duration_weeks: int | None = None
    stipend: float | None = None
    application_deadline: date | None = None
    job_family_id: int | None = None
    sub_role_id: int | None = None
    track_type: str | None = None
    total_slots: int | None = None
    accepted_tiers: List[str] | None = None
    status: str = "draft"
    requirements: List[InternshipRequirementCreate] | None = None

class InternshipUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    location: str | None = None
    duration_weeks: int | None = None
    stipend: float | None = None
    application_deadline: date | None = None
    job_family_id: int | None = None
    sub_role_id: int | None = None
    track_type: str | None = None
    total_slots: int | None = None
    accepted_tiers: List[str] | None = None
    status: str | None = None
    requirements: List[InternshipRequirementCreate] | None = None

class InternshipResponse(BaseModel):
    id: int
    company_id: int
    title: str
    description: str | None = None
    location: str | None = None
    duration_weeks: int | None = None
    stipend: float | None = None
    application_deadline: date | None = None
    job_family_id: int | None = None
    sub_role_id: int | None = None
    track_type: str | None = None
    total_slots: int | None = None
    accepted_tiers: List[str] | None = None
    status: str
    created_at: datetime
    requirements: List[InternshipRequirementResponse] | None = None

    model_config = {"from_attributes": True}

class InternshipPublicResponse(InternshipResponse):
    match_percentage: float | None = None
    company_name: str | None = None
    gap_analysis: list[dict] | None = None

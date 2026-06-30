from pydantic import BaseModel
from datetime import datetime

class ApplicationCreate(BaseModel):
    internship_id: int

class ApplicationResponse(BaseModel):
    id: int
    student_id: int
    internship_id: int
    fit_score: float | None = None
    tier_at_application: str | None = None
    status: str
    industry_supervisor_id: int | None = None
    academic_supervisor_id: int | None = None
    applied_at: datetime
    decided_at: datetime | None = None

    model_config = {"from_attributes": True}

class ApplicationCompanyResponse(ApplicationResponse):
    applicant_name: str
    role: str
    track: str

class ApplicationStudentResponse(ApplicationResponse):
    company_name: str
    role: str
    track_type: str

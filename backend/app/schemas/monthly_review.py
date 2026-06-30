"""
Pydantic schemas for the Industry Supervisor Monthly Review API.
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class WeekSummary(BaseModel):
    week_number: int
    wed_submitted: bool
    sat_submitted: bool
    wed_content: Optional[dict] = None
    sat_content: Optional[dict] = None
    quiz_score: Optional[int] = None
    quiz_passed: Optional[bool] = None


class MonthlyDigestResponse(BaseModel):
    student_id: int
    student_name: str
    department: str
    month_year: str
    application_id: int
    log_submission_count: int  # total Wed+Sat submissions in month
    total_possible_submissions: int  # expected (e.g. 8 for a full month)
    weeks: List[WeekSummary]
    existing_review: Optional["MonthlyReviewResponse"] = None


class EndorseRequest(BaseModel):
    """Empty body — action is implicit from the endpoint path."""
    pass


class FlagRequest(BaseModel):
    flag_comment: str = Field(..., min_length=1, max_length=1000)


class MonthlyReviewResponse(BaseModel):
    id: int
    application_id: int
    industry_supervisor_id: int
    month_year: str
    action: str  # "endorsed" | "flagged"
    flag_comment: Optional[str] = None
    created_at_wat: datetime
    is_locked: bool

    model_config = {"from_attributes": True}


class PendingReviewResponse(BaseModel):
    student_id: int
    student_name: str
    department: str
    application_id: int
    month_year: str
    log_submission_count: int
    status: str  # "pending" | "endorsed" | "flagged"


# Allow forward reference
MonthlyDigestResponse.model_rebuild()

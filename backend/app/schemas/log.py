"""
Pydantic schemas for the Bi-Weekly Evidence Log API.
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# ── Artifact Upload ───────────────────────────────────────────────────────────

class ArtifactUploadResponse(BaseModel):
    artifact_id: int
    server_timestamp_wat: datetime


# ── Check-in Submission ───────────────────────────────────────────────────────

class LogCheckInRequest(BaseModel):
    """Body for both Wednesday and Saturday check-in submissions."""
    focus_area: str = Field(..., max_length=2000)
    core_action: str = Field(..., max_length=2000)
    the_blocker: str = Field(..., max_length=2000)
    the_takeaway: str = Field(..., max_length=2000)
    artifact_id: Optional[int] = None  # Artifact uploaded prior to submission


# ── Quiz ──────────────────────────────────────────────────────────────────────

class QuizSubmitRequest(BaseModel):
    weekly_log_id: int
    # Ordered list of chosen option indices (0-3). May be empty on tab-switch auto-fail.
    student_answers: List[int] = Field(default_factory=list)
    failed_due_to_tab_switch: bool = False


class QuizQuestion(BaseModel):
    question: str
    options: List[str]
    correct_index: Optional[int] = None  # Only revealed post-submission


class QuizResultResponse(BaseModel):
    weekly_log_id: int
    score: int
    passed: bool
    failed_due_to_tab_switch: bool
    questions: Optional[List[dict]] = None
    student_answers: Optional[List[int]] = None
    correct_answers: Optional[List[int]] = None


# ── Weekly Log Responses ──────────────────────────────────────────────────────

class WeeklyLogResponse(BaseModel):
    id: int
    application_id: int
    week_number: int
    wed_content: Optional[dict] = None
    sat_content: Optional[dict] = None
    wed_photo_url: Optional[str] = None
    sat_photo_url: Optional[str] = None
    wed_submitted_at: Optional[datetime] = None
    sat_submitted_at: Optional[datetime] = None
    quiz_score: Optional[int] = None
    quiz_passed: Optional[bool] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class CurrentWeekStatusResponse(BaseModel):
    week_number: int
    wed_status: str   # "not_started" | "submitted"
    sat_status: str   # "not_started" | "submitted" | "locked"  (locked until Wed done)
    quiz_status: str  # "unavailable" | "available" | "completed"
    weekly_log_id: Optional[int] = None
    quiz_result: Optional[QuizResultResponse] = None

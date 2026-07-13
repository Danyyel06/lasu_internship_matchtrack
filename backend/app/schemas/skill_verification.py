from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class SkillVerificationStatusItem(BaseModel):
    skill_name: str
    claimed_level: int
    verified_level: Optional[int] = None
    verification_status: str
    cooldown_until: Optional[datetime] = None
    
    model_config = {"from_attributes": True}

class SkillVerificationStatusResponse(BaseModel):
    preliminary_fit_score: Optional[float] = None
    verified_fit_score: Optional[float] = None
    skill_verification_completed_at: Optional[datetime] = None
    skills: List[SkillVerificationStatusItem]

class SkillQuestionItem(BaseModel):
    question: str
    options: List[str]

class SkillQuestionGroup(BaseModel):
    skill_name: str
    claimed_level: int
    difficulty_tier: str
    difficulty_label: str
    questions: List[SkillQuestionItem]
    question_snapshot_id: int

class BeginVerificationResponse(BaseModel):
    skill_groups: List[SkillQuestionGroup]
    profile_snapshot_hash: str

class SubmitSkillRequest(BaseModel):
    skill_name: str
    student_answers: List[int]
    questions_snapshot_id: int
    failed_due_to_tab_switch: bool = False

class SubmitSkillResponse(BaseModel):
    skill_name: str
    passed: bool
    score: int
    total_questions: int
    verification_status: str
    correct_answers: Optional[List[int]] = None

class CompleteVerificationResponse(BaseModel):
    verified_fit_score: float
    current_tier: str
    skills_verified_count: int
    skills_failed_count: int

class AddSkillRequest(BaseModel):
    skill_name: str
    claimed_level: int = Field(..., ge=1, le=5)

class ReVerifyRequest(BaseModel):
    skill_name: str

class ReVerifyResponse(BaseModel):
    allowed: bool
    cooldown_until: Optional[datetime] = None
    skill_groups: Optional[List[SkillQuestionGroup]] = None

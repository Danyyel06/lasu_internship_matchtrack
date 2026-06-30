from datetime import date
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, constr, HttpUrl

# --- Job Families & Sub Roles ---

class SubRoleResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    skills: Optional[List[str]] = []

    model_config = {"from_attributes": True}

class JobFamilyResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    default_weights: Optional[Dict[str, Any]] = None
    sub_roles: List[SubRoleResponse] = []

    model_config = {"from_attributes": True}

# --- Onboarding Request Schemas ---

class SkillLevel(BaseModel):
    skill_name: str
    claimed_level: int = Field(..., ge=1, le=5)

class OnboardingRequest(BaseModel):
    # Step 1: Personal
    phone_number: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    
    # Step 2: Academic
    matric_no: str
    faculty: str
    department: str
    level: int
    cgpa: float = Field(..., ge=0.0, le=5.0)

    # Step 3 & 4: Job Family & Sub Role
    job_family_id: int
    selected_sub_role_id: Optional[int] = None
    
    # Step 5: Skills
    skills: List[SkillLevel] = []

    # Other steps are tracked but maybe not persisted or persist loosely for now
    # as per schema, projects and coursework are not strongly modelled yet
    # but we can accept them in request.
    projects: Optional[List[Dict[str, Any]]] = None
    coursework: Optional[List[str]] = None
    preferences: Optional[Dict[str, Any]] = None

# --- Student Response ---

class StudentResponse(BaseModel):
    id: int
    user_id: int
    matric_no: str
    faculty: str
    department: str
    level: Optional[int]
    cgpa: Optional[float]
    preliminary_fit_score: Optional[float]
    current_tier: Optional[str]

    model_config = {"from_attributes": True}

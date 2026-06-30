from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from app.models.user import UserRole


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    first_name: str = Field(..., min_length=1, max_length=50)
    last_name: str = Field(..., min_length=1, max_length=50)
    role: UserRole
    # Student specific fields
    matric_no: str | None = None
    faculty: str | None = None
    department: str | None = None
    year_of_study: str | None = None
    cgpa: float | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class UserResponse(BaseModel):
    id: int
    email: str
    first_name: str
    last_name: str
    role: UserRole
    is_verified: bool
    created_at: datetime

    model_config = {"from_attributes": True}

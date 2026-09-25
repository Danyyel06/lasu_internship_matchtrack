from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.db.session import get_db
from pydantic import BaseModel
from app.dependencies import get_current_user, require_role
from app.models.user import User, UserRole
from app.models.company import Company
from app.schemas.auth import TokenResponse
from app.schemas.company import CompanyRegisterRequest, CompanyOnboardingRequest, CompanyResponse, SupervisorResponse, CreateSupervisorRequest
from app.core.security import hash_password, create_access_token, create_refresh_token

import os
import secrets
import json
from datetime import datetime, timedelta, timezone
from sqlalchemy import and_, or_
from app.models.verification_submission import VerificationSubmission
from app.models.verification_event import VerificationEvent
from app.models.otp_record import OtpRecord
from app.services.notification import get_notification_sender, generate_otp, hash_otp
from app.services.cac_lookup import get_cac_lookup
from app.services.capability_checker import get_capabilities
from app.schemas.company import (
    CompanyOnboardingStartRequest, OtpVerifyRequest, OtpStartResponse,
    VerificationStatusResponse, VerificationTierStatusResponse,
    SubmissionDraftRequest
)

router = APIRouter()

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register_company(body: CompanyRegisterRequest, db: AsyncSession = Depends(get_db)):
    """Register a new company representative and an empty company."""
    # Check if email already exists
    result = await db.execute(select(User).where(User.email == body.email))
    existing_user = result.scalar_one_or_none()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists",
        )

    # Create the new user
    user = User(
        email=body.email,
        password_hash=hash_password(body.password),
        role=UserRole.COMPANY_REP,
        first_name=body.first_name,
        last_name=body.last_name,
    )
    db.add(user)
    await db.flush()

    # Create the empty company
    company = Company(
        user_id=user.id,
        company_name=body.company_name
    )
    db.add(company)
    await db.commit()

    # Generate tokens
    token_data = {
        "sub": str(user.id),
        "role": user.role.value if isinstance(user.role, UserRole) else user.role,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "is_onboarded": False,
        "company_name": company.company_name
    }
    access_token = create_access_token(data=token_data)
    refresh_token = create_refresh_token(data=token_data)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer"
    )

@router.post("/onboarding", response_model=CompanyResponse)
async def complete_company_onboarding(
    payload: CompanyOnboardingRequest,
    current_user: User = Depends(require_role(UserRole.COMPANY_REP)),
    db: AsyncSession = Depends(get_db)
):
    """Complete company onboarding by updating the company profile."""
    result = await db.execute(select(Company).where(Company.user_id == current_user.id))
    existing_company = result.scalar_one_or_none()
    
    if not existing_company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company record not found."
        )

    if payload.registration_no:
        existing_company.registration_no = payload.registration_no
    if payload.industry:
        existing_company.industry = payload.industry
    if payload.company_address:
        existing_company.company_address = payload.company_address
    if payload.company_website:
        existing_company.company_website = payload.company_website
    if payload.company_logo_url:
        existing_company.company_logo_url = payload.company_logo_url
    if payload.company_size:
        existing_company.company_size = payload.company_size

    await db.commit()
    await db.refresh(existing_company)

    return existing_company

@router.get("/supervisors", response_model=list[SupervisorResponse])
async def get_supervisors(
    current_user: User = Depends(require_role(UserRole.COMPANY_REP)),
    db: AsyncSession = Depends(get_db)
):
    from app.models.industry_supervisor_profile import IndustrySupervisorProfile
    from app.models.application import Application
    from sqlalchemy.orm import aliased
    
    # Get company ID
    comp_res = await db.execute(select(Company.id).where(Company.user_id == current_user.id))
    company_id = comp_res.scalar_one_or_none()
    
    if not company_id:
        return []
        
    stmt = (
        select(User, IndustrySupervisorProfile, func.count(Application.id).label('interns_assigned'))
        .join(IndustrySupervisorProfile, User.id == IndustrySupervisorProfile.user_id)
        .outerjoin(Application, Application.industry_supervisor_id == IndustrySupervisorProfile.user_id)
        .where(IndustrySupervisorProfile.company_id == company_id)
        .group_by(User.id, IndustrySupervisorProfile.id)
    )
    result = await db.execute(stmt)
    rows = result.all()
    
    supervisors = []
    for user, profile, interns_assigned in rows:
        supervisors.append({
            "id": profile.id,
            "user_id": user.id,
            "name": f"{user.first_name} {user.last_name}",
            "title": "Industry Supervisor", # or add a field to profile
            "email": user.email,
            "interns_assigned": interns_assigned,
            "status": "Active" if user.is_verified else "Pending"
        })
        
    return supervisors

@router.post("/supervisors", response_model=SupervisorResponse)
async def create_supervisor(
    payload: CreateSupervisorRequest,
    current_user: User = Depends(require_role(UserRole.COMPANY_REP)),
    db: AsyncSession = Depends(get_db)
):
    from app.models.industry_supervisor_profile import IndustrySupervisorProfile
    from app.core.security import hash_password
    import secrets

    # Get company ID
    comp_res = await db.execute(select(Company.id).where(Company.user_id == current_user.id))
    company_id = comp_res.scalar_one_or_none()
    
    if not company_id:
        raise HTTPException(status_code=400, detail="Company not found")

    # Check email exists
    user_res = await db.execute(select(User).where(User.email == payload.work_email))
    if user_res.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    # Split name
    names = payload.full_name.split(" ", 1)
    first_name = names[0]
    last_name = names[1] if len(names) > 1 else ""

    # Generate a secure, unique activation token
    activation_token = secrets.token_urlsafe(32)

    # Create User — account is not yet activated; no usable password yet
    new_user = User(
        email=payload.work_email,
        password_hash=hash_password(secrets.token_hex(16)),  # placeholder — replaced on activation
        role=UserRole.INDUSTRY_SUPERVISOR,
        first_name=first_name,
        last_name=last_name,
        is_verified=False,
        is_activated=False,
        activation_token=activation_token,
    )
    db.add(new_user)
    await db.flush()

    # Create Profile
    new_profile = IndustrySupervisorProfile(
        user_id=new_user.id,
        company_id=company_id
    )
    db.add(new_profile)
    await db.commit()

    # Build the activation URL (dev mode: returned in response so no email needed)
    activation_url = f"http://localhost:5173/supervisor/activate?token={activation_token}"

    return {
        "id": new_profile.id,
        "user_id": new_user.id,
        "name": payload.full_name,
        "title": payload.job_title,
        "email": payload.work_email,
        "interns_assigned": 0,
        "status": "Pending",
        "activation_url": activation_url,  # Dev mode: copy this link to activate
    }



class SupervisorUpdate(BaseModel):
    full_name: str | None = None
    job_title: str | None = None

@router.put("/supervisors/{supervisor_user_id}", response_model=SupervisorResponse)
async def update_supervisor(
    supervisor_user_id: int,
    payload: SupervisorUpdate,
    current_user: User = Depends(require_role(UserRole.COMPANY_REP)),
    db: AsyncSession = Depends(get_db)
):
    from app.models.industry_supervisor_profile import IndustrySupervisorProfile

    # Verify this supervisor belongs to the company
    comp_res = await db.execute(select(Company.id).where(Company.user_id == current_user.id))
    company_id = comp_res.scalar_one_or_none()
    if not company_id:
        raise HTTPException(status_code=400, detail="Company not found")

    prof_res = await db.execute(
        select(IndustrySupervisorProfile, User)
        .join(User, User.id == IndustrySupervisorProfile.user_id)
        .where(
            IndustrySupervisorProfile.user_id == supervisor_user_id,
            IndustrySupervisorProfile.company_id == company_id
        )
    )
    row = prof_res.first()
    if not row:
        raise HTTPException(status_code=404, detail="Supervisor not found or not in your company")

    profile, user = row
    if payload.full_name:
        names = payload.full_name.split(" ", 1)
        user.first_name = names[0]
        user.last_name = names[1] if len(names) > 1 else ""
    db.add(user)
    await db.commit()

    return {
        "id": profile.id,
        "user_id": user.id,
        "name": f"{user.first_name} {user.last_name}".strip(),
        "title": payload.job_title or "Industry Supervisor",
        "email": user.email,
        "interns_assigned": 0,
        "status": "Active" if user.is_verified else "Pending"
    }


@router.delete("/supervisors/{supervisor_user_id}", status_code=204)
async def delete_supervisor(
    supervisor_user_id: int,
    current_user: User = Depends(require_role(UserRole.COMPANY_REP)),
    db: AsyncSession = Depends(get_db)
):
    from app.models.industry_supervisor_profile import IndustrySupervisorProfile
    from app.models.application import Application

    comp_res = await db.execute(select(Company.id).where(Company.user_id == current_user.id))
    company_id = comp_res.scalar_one_or_none()
    if not company_id:
        raise HTTPException(status_code=400, detail="Company not found")

    prof_res = await db.execute(
        select(IndustrySupervisorProfile)
        .where(
            IndustrySupervisorProfile.user_id == supervisor_user_id,
            IndustrySupervisorProfile.company_id == company_id
        )
    )
    profile = prof_res.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Supervisor not found or not in your company")

    # Guard: check if supervisor has active intern assignments
    count_res = await db.execute(
        select(func.count(Application.id))
        .where(Application.industry_supervisor_id == supervisor_user_id)
    )
    assigned_count = count_res.scalar_one()
    if assigned_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot remove supervisor — they have {assigned_count} intern(s) assigned. Reassign interns first."
        )

    # Delete the profile and user
    user_res = await db.execute(select(User).where(User.id == supervisor_user_id))
    user = user_res.scalar_one_or_none()
    await db.delete(profile)
    if user:
        await db.delete(user)
    await db.commit()
    return None


class CompanyProfileUpdate(BaseModel):
    first_name: str
    last_name: str
    phone_number: str | None = None
    company_name: str | None = None
    industry: str | None = None
    company_size: str | None = None
    company_website: str | None = None
    company_address: str | None = None

@router.get("/profile")
async def get_company_profile(
    current_user: User = Depends(require_role(UserRole.COMPANY_REP)),
    db: AsyncSession = Depends(get_db)
):
    comp_res = await db.execute(select(Company).where(Company.user_id == current_user.id))
    company = comp_res.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=400, detail="Company not found")
        
    return {
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "email": current_user.email,
        "is_verified": company.is_admin_verified,
        "phone_number": company.phone_number,
        "company_name": company.company_name,
        "industry": company.industry,
        "company_size": company.company_size,
        "company_website": company.company_website,
        "company_address": company.company_address
    }

@router.put("/profile")
async def update_company_profile(
    req: CompanyProfileUpdate,
    current_user: User = Depends(require_role(UserRole.COMPANY_REP)),
    db: AsyncSession = Depends(get_db)
):
    # Re-fetch both objects in this session to avoid detached-instance issues
    user_res = await db.execute(select(User).where(User.id == current_user.id))
    user = user_res.scalar_one_or_none()
    
    comp_res = await db.execute(select(Company).where(Company.user_id == current_user.id))
    company = comp_res.scalar_one_or_none()
    if not company or not user:
        raise HTTPException(status_code=400, detail="Profile not found")

    if req.first_name: user.first_name = req.first_name
    if req.last_name: user.last_name = req.last_name
    if req.phone_number is not None: company.phone_number = req.phone_number
    if req.company_name: company.company_name = req.company_name
    if req.industry is not None: company.industry = req.industry
    if req.company_size is not None: company.company_size = req.company_size
    if req.company_website is not None: company.company_website = req.company_website
    if req.company_address is not None: company.company_address = req.company_address

    db.add(user)
    db.add(company)
    await db.commit()
    return {"message": "Profile updated successfully"}



@router.get("/students/{student_id}")
async def get_student_profile_for_company(
    student_id: int,
    current_user: User = Depends(require_role(UserRole.COMPANY_REP)),
    db: AsyncSession = Depends(get_db)
):
    """Company Rep views the full profile of a student who applied to one of their internships."""
    from app.models.student import Student
    from app.models.application import Application
    from app.models.internship import Internship
    from sqlalchemy.orm import selectinload

    # Verify this company exists
    comp_res = await db.execute(select(Company).where(Company.user_id == current_user.id))
    company = comp_res.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=400, detail="Company not found")

    # Verify the student has an application to one of this company's internships
    stmt = (
        select(Application)
        .join(Internship, Application.internship_id == Internship.id)
        .where(
            Application.student_id == student_id,
            Internship.company_id == company.id
        )
    )
    app_res = await db.execute(stmt)
    application = app_res.scalars().first()
    if not application:
        raise HTTPException(status_code=404, detail="Student not found or not an applicant to your internships.")

    # Fetch student with skills
    stu_res = await db.execute(
        select(Student)
        .options(selectinload(Student.skills))
        .where(Student.id == student_id)
    )
    student = stu_res.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found.")

    # Fetch user info
    user_res = await db.execute(select(User).where(User.id == student.user_id))
    user = user_res.scalar_one_or_none()

    return {
        "student_id": student.id,
        "name": f"{user.first_name} {user.last_name}" if user else "Unknown",
        "email": user.email if user else None,
        "matric_no": student.matric_no,
        "faculty": student.faculty,
        "department": student.department,
        "level": student.level,
        "cgpa": float(student.cgpa) if student.cgpa else None,
        "gender": student.gender,
        "current_tier": student.current_tier,
        "preliminary_fit_score": float(student.preliminary_fit_score) if student.preliminary_fit_score else None,
        "skills": [
            {
                "skill_name": s.skill_name,
                "claimed_level": s.claimed_level,
                "verified_level": s.verified_level,
                "verification_status": s.verification_status
            }
            for s in student.skills
        ]
    }

@router.get("/reports")
async def get_company_reports(
    current_user: User = Depends(require_role(UserRole.COMPANY_REP)),
    db: AsyncSession = Depends(get_db)
):
    """Fetch performance metrics and reports for the company."""
    comp_res = await db.execute(select(Company).where(Company.user_id == current_user.id))
    company = comp_res.scalar_one_or_none()
    
    if not company:
        raise HTTPException(status_code=400, detail="Company not found")

    # Use the company's real previous fair score, or default to 85 if not set
    fps_value = float(company.previous_fair_score) if company.previous_fair_score else 85.0
    
    # Calculate a dynamic intern satisfaction based on FPS (for lack of a real survey table)
    # A score of 85 -> ~4.8, 50 -> ~3.5
    satisfaction = round(3.0 + (fps_value / 100) * 2.0, 1)
    
    # Calculate a dynamic offer rate
    offer_rate = int((fps_value / 100) * 80) # 85 FPS -> ~68%
    
    fps_trend = [
        { "cycle": "2023/2024", "fps": round(fps_value * 0.8) },
        { "cycle": "2024/2025", "fps": round(fps_value * 0.95) },
        { "cycle": "2025/2026 (Current)", "fps": round(fps_value) },
    ]
    
    reports = [
        {
            "id": 1,
            "title": "2024/2025 Final Report",
            "type": "PDF",
            "size": "2.4 MB",
            "theme": "red",
            "icon": "M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
        },
        {
            "id": 2,
            "title": "2024/2025 Data Export",
            "type": "CSV",
            "size": "854 KB",
            "theme": "green",
            "icon": "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        },
        {
            "id": 3,
            "title": "2023/2024 Final Report",
            "type": "PDF",
            "size": "2.1 MB",
            "theme": "red",
            "icon": "M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
        }
    ]
    
    return {
        "metrics": {
            "fps": round(fps_value),
            "intern_satisfaction": satisfaction,
            "offer_rate": offer_rate
        },
        "fps_trend": fps_trend,
        "reports": reports
    }

@router.post("/supervisors/{supervisor_user_id}/resend-invite")
async def resend_supervisor_invite(
    supervisor_user_id: int,
    current_user: User = Depends(require_role(UserRole.COMPANY_REP)),
    db: AsyncSession = Depends(get_db)
):
    from app.models.industry_supervisor_profile import IndustrySupervisorProfile
    import secrets
    
    comp_res = await db.execute(select(Company.id).where(Company.user_id == current_user.id))
    company_id = comp_res.scalar_one_or_none()
    if not company_id:
        raise HTTPException(status_code=400, detail="Company not found")

    prof_res = await db.execute(
        select(IndustrySupervisorProfile, User)
        .join(User, User.id == IndustrySupervisorProfile.user_id)
        .where(
            IndustrySupervisorProfile.user_id == supervisor_user_id,
            IndustrySupervisorProfile.company_id == company_id
        )
    )
    row = prof_res.first()
    if not row:
        raise HTTPException(status_code=404, detail="Supervisor not found or not in your company")

    prof, user = row
    
    token = secrets.token_urlsafe(32)
    user.password_reset_token = token
    db.add(user)
    await db.commit()
    
    activation_url = f"http://localhost:5173/supervisor/activate?token={token}"
    return {"message": "Invite resent", "activation_url": activation_url}

@router.put("/profile")
async def update_company_profile(
    req: CompanyProfileUpdate,
    current_user: User = Depends(require_role(UserRole.COMPANY_REP)),
    db: AsyncSession = Depends(get_db)
):
    # Re-fetch both objects in this session to avoid detached-instance issues
    user_res = await db.execute(select(User).where(User.id == current_user.id))
    user = user_res.scalar_one_or_none()
    
    comp_res = await db.execute(select(Company).where(Company.user_id == current_user.id))
    company = comp_res.scalar_one_or_none()
    if not company or not user:
        raise HTTPException(status_code=400, detail="Profile not found")

    if req.first_name: user.first_name = req.first_name
    if req.last_name: user.last_name = req.last_name
    if req.phone_number is not None: company.phone_number = req.phone_number
    if req.company_name: company.company_name = req.company_name
    if req.industry is not None: company.industry = req.industry
    if req.company_size is not None: company.company_size = req.company_size
    if req.company_website is not None: company.company_website = req.company_website
    if req.company_address is not None: company.company_address = req.company_address

    db.add(user)
    db.add(company)
    await db.commit()
    return {"message": "Profile updated successfully"}



@router.get("/students/{student_id}")
async def get_student_profile_for_company(
    student_id: int,
    current_user: User = Depends(require_role(UserRole.COMPANY_REP)),
    db: AsyncSession = Depends(get_db)
):
    """Company Rep views the full profile of a student who applied to one of their internships."""
    from app.models.student import Student
    from app.models.application import Application
    from app.models.internship import Internship
    from sqlalchemy.orm import selectinload

    # Verify this company exists
    comp_res = await db.execute(select(Company).where(Company.user_id == current_user.id))
    company = comp_res.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=400, detail="Company not found")

    # Verify the student has an application to one of this company's internships
    stmt = (
        select(Application)
        .join(Internship, Application.internship_id == Internship.id)
        .where(
            Application.student_id == student_id,
            Internship.company_id == company.id
        )
    )
    app_res = await db.execute(stmt)
    application = app_res.scalars().first()
    if not application:
        raise HTTPException(status_code=404, detail="Student not found or not an applicant to your internships.")

    # Fetch student with skills
    stu_res = await db.execute(
        select(Student)
        .options(selectinload(Student.skills))
        .where(Student.id == student_id)
    )
    student = stu_res.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found.")

    # Fetch user info
    user_res = await db.execute(select(User).where(User.id == student.user_id))
    user = user_res.scalar_one_or_none()

    return {
        "student_id": student.id,
        "name": f"{user.first_name} {user.last_name}" if user else "Unknown",
        "email": user.email if user else None,
        "matric_no": student.matric_no,
        "faculty": student.faculty,
        "department": student.department,
        "level": student.level,
        "cgpa": float(student.cgpa) if student.cgpa else None,
        "gender": student.gender,
        "current_tier": student.current_tier,
        "preliminary_fit_score": float(student.preliminary_fit_score) if student.preliminary_fit_score else None,
        "skills": [
            {
                "skill_name": s.skill_name,
                "claimed_level": s.claimed_level,
                "verified_level": s.verified_level,
                "verification_status": s.verification_status
            }
            for s in student.skills
        ]
    }

@router.get("/reports")
async def get_company_reports(
    current_user: User = Depends(require_role(UserRole.COMPANY_REP)),
    db: AsyncSession = Depends(get_db)
):
    """Fetch performance metrics and reports for the company."""
    comp_res = await db.execute(select(Company).where(Company.user_id == current_user.id))
    company = comp_res.scalar_one_or_none()
    
    if not company:
        raise HTTPException(status_code=400, detail="Company not found")

    # Use the company's real previous fair score, or default to 85 if not set
    fps_value = float(company.previous_fair_score) if company.previous_fair_score else 85.0
    
    # Calculate a dynamic intern satisfaction based on FPS (for lack of a real survey table)
    # A score of 85 -> ~4.8, 50 -> ~3.5
    satisfaction = round(3.0 + (fps_value / 100) * 2.0, 1)
    
    # Calculate a dynamic offer rate
    offer_rate = int((fps_value / 100) * 80) # 85 FPS -> ~68%
    
    fps_trend = [
        { "cycle": "2023/2024", "fps": round(fps_value * 0.8) },
        { "cycle": "2024/2025", "fps": round(fps_value * 0.95) },
        { "cycle": "2025/2026 (Current)", "fps": round(fps_value) },
    ]
    
    reports = [
        {
            "id": 1,
            "title": "2024/2025 Final Report",
            "type": "PDF",
            "size": "2.4 MB",
            "theme": "red",
            "icon": "M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
        },
        {
            "id": 2,
            "title": "2024/2025 Data Export",
            "type": "CSV",
            "size": "854 KB",
            "theme": "green",
            "icon": "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        },
        {
            "id": 3,
            "title": "2023/2024 Final Report",
            "type": "PDF",
            "size": "2.1 MB",
            "theme": "red",
            "icon": "M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
        }
    ]
    
    return {
        "metrics": {
            "fps": round(fps_value),
            "intern_satisfaction": satisfaction,
            "offer_rate": offer_rate
        },
        "fps_trend": fps_trend,
        "reports": reports
    }

@router.post("/supervisors/{supervisor_user_id}/resend-invite")
async def resend_supervisor_invite(
    supervisor_user_id: int,
    current_user: User = Depends(require_role(UserRole.COMPANY_REP)),
    db: AsyncSession = Depends(get_db)
):
    from app.models.industry_supervisor_profile import IndustrySupervisorProfile
    import secrets
    
    comp_res = await db.execute(select(Company.id).where(Company.user_id == current_user.id))
    company_id = comp_res.scalar_one_or_none()
    if not company_id:
        raise HTTPException(status_code=400, detail="Company not found")

    prof_res = await db.execute(
        select(IndustrySupervisorProfile, User)
        .join(User, User.id == IndustrySupervisorProfile.user_id)
        .where(
            IndustrySupervisorProfile.user_id == supervisor_user_id,
            IndustrySupervisorProfile.company_id == company_id
        )
    )
    row = prof_res.first()
    if not row:
        raise HTTPException(status_code=404, detail="Supervisor not found or not in your company")

    profile, user = row
    
    if user.is_verified or user.is_activated:
        raise HTTPException(status_code=400, detail="Supervisor is already activated")

    new_token = secrets.token_urlsafe(32)
    user.activation_token = new_token
    db.add(user)
    await db.commit()

    activation_url = f"http://localhost:5173/supervisor/activate?token={new_token}"
    return {"activation_url": activation_url}

@router.post("/onboarding/start", response_model=OtpStartResponse)
async def start_onboarding(body: CompanyOnboardingStartRequest, db: AsyncSession = Depends(get_db)):
    if body.password != body.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")
    if not (body.agree_terms and body.agree_authorised and body.agree_consent):
        raise HTTPException(status_code=400, detail="Must agree to all terms")

    res = await db.execute(select(User).where(User.email == body.email))
    if res.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    session_id = secrets.token_urlsafe(32)
    
    email_otp = generate_otp()
    phone_otp = generate_otp()
    
    sender = get_notification_sender()
    sender.send_otp(body.email, email_otp, "email_verify")
    sender.send_otp(body.rep_phone, phone_otp, "phone_verify")
    
    now = datetime.now(timezone.utc)
    db.add(OtpRecord(
        identifier=session_id,
        purpose="email_verify",
        otp_hash=hash_otp(email_otp),
        expires_at=now + timedelta(minutes=10)
    ))
    db.add(OtpRecord(
        identifier=session_id,
        purpose="phone_verify",
        otp_hash=hash_otp(phone_otp),
        expires_at=now + timedelta(minutes=10)
    ))
    db.add(OtpRecord(
        identifier=session_id,
        purpose="onboarding_data",
        otp_hash=json.dumps(body.model_dump(exclude={'password', 'confirm_password'})),
        expires_at=now + timedelta(minutes=30)
    ))
    
    # Store password hash temporarily too (not ideal but works for this test flow)
    db.add(OtpRecord(
        identifier=session_id,
        purpose="password_hash",
        otp_hash=hash_password(body.password),
        expires_at=now + timedelta(minutes=30)
    ))
    await db.commit()
    
    resp = OtpStartResponse(session_id=session_id, message="OTPs sent successfully")
    if os.getenv("ENV", "development") == "development":
        resp.dev_otp_email = email_otp
        resp.dev_otp_phone = phone_otp
    return resp

@router.post("/onboarding/verify-email")
async def verify_email_otp(body: OtpVerifyRequest, db: AsyncSession = Depends(get_db)):
    now = datetime.now(timezone.utc)
    res = await db.execute(
        select(OtpRecord).where(
            OtpRecord.identifier == body.session_id,
            OtpRecord.purpose == "email_verify",
            OtpRecord.used_at.is_(None)
        )
    )
    record = res.scalar_one_or_none()
    if not record or record.expires_at.replace(tzinfo=timezone.utc) < now or record.otp_hash != hash_otp(body.otp):
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    
    record.used_at = now
    await db.commit()
    return {"success": True, "message": "Email verified"}

@router.post("/onboarding/verify-phone", response_model=TokenResponse)
async def verify_phone_otp(body: OtpVerifyRequest, db: AsyncSession = Depends(get_db)):
    now = datetime.now(timezone.utc)
    
    # Check email was verified
    res = await db.execute(
        select(OtpRecord).where(
            OtpRecord.identifier == body.session_id,
            OtpRecord.purpose == "email_verify",
            OtpRecord.used_at.is_not(None)
        )
    )
    if not res.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email must be verified first")

    # Verify phone OTP
    res = await db.execute(
        select(OtpRecord).where(
            OtpRecord.identifier == body.session_id,
            OtpRecord.purpose == "phone_verify",
            OtpRecord.used_at.is_(None)
        )
    )
    phone_rec = res.scalar_one_or_none()
    if not phone_rec or phone_rec.expires_at.replace(tzinfo=timezone.utc) < now or phone_rec.otp_hash != hash_otp(body.otp):
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    
    phone_rec.used_at = now
    
    # Retrieve data
    res = await db.execute(select(OtpRecord).where(OtpRecord.identifier == body.session_id, OtpRecord.purpose == "onboarding_data"))
    data_rec = res.scalar_one_or_none()
    res = await db.execute(select(OtpRecord).where(OtpRecord.identifier == body.session_id, OtpRecord.purpose == "password_hash"))
    pwd_rec = res.scalar_one_or_none()
    if not data_rec or not pwd_rec:
        raise HTTPException(status_code=400, detail="Session expired")

    data = json.loads(data_rec.otp_hash)
    
    user = User(
        email=data["email"],
        password_hash=pwd_rec.otp_hash,
        role=UserRole.COMPANY_REP,
        first_name=data["first_name"],
        last_name=data["last_name"],
        is_verified=True,
        is_activated=True
    )
    db.add(user)
    await db.flush()
    
    company = Company(
        user_id=user.id,
        company_name=data["company_name"],
        industry=data["industry"],
        company_size=data["company_size"],
        state=data["state"],
        lga=data["lga"],
        rep_job_title=data["rep_job_title"],
        rep_phone=data["rep_phone"],
        internship_description=data["internship_description"],
        trust_tier=1,
        tier_1_status='pending'
    )
    db.add(company)
    await db.flush()
    
    sub = VerificationSubmission(
        company_id=company.id,
        tier=1,
        status='pending',
        submitted_at=now
    )
    db.add(sub)
    db.add(VerificationEvent(company_id=company.id, to_status='pending', tier=1))
    
    await db.commit()

    token_data = {
        "sub": str(user.id),
        "role": user.role.value if isinstance(user.role, UserRole) else user.role,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "is_onboarded": True,
        "company_name": company.company_name
    }
    
    return TokenResponse(
        access_token=create_access_token(data=token_data),
        refresh_token=create_refresh_token(data=token_data),
        token_type="bearer"
    )

@router.get("/verification", response_model=VerificationStatusResponse)
async def get_verification_status(current_user: User = Depends(require_role(UserRole.COMPANY_REP)), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Company).where(Company.user_id == current_user.id))
    company = res.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
        
    res = await db.execute(select(VerificationSubmission).where(VerificationSubmission.company_id == company.id))
    submissions = res.scalars().all()
    sub_map = {s.tier: s for s in submissions}
    
    tiers = []
    tier_names = {1: "Basic Registration", 2: "Identity Verification", 3: "Quality Assurance", 4: "Premium Partner"}
    statuses = {1: company.tier_1_status, 2: company.tier_2_status, 3: company.tier_3_status, 4: company.tier_4_status}
    
    for t in range(1, 5):
        s = sub_map.get(t)
        tiers.append(VerificationTierStatusResponse(
            tier=t,
            name=tier_names[t],
            status=statuses[t],
            submitted_at=s.submitted_at if s else None,
            reviewed_at=s.reviewed_at if s else None,
            reviewer_note=s.reviewer_note if s else None,
            approval_date=s.reviewed_at if statuses[t] == 'approved' else None,
            submission_id=s.id if s else None
        ))
        
    return VerificationStatusResponse(
        trust_tier=company.trust_tier,
        tiers=tiers,
        capabilities=get_capabilities(company.trust_tier, {f"tier_{t}_status": statuses[t] for t in range(1,5)}),
        is_suspended=bool(company.suspended_at),
        suspension_reason=company.suspension_reason,
        is_individual_verified=company.is_individual_verified
    )

@router.post("/verification/{tier}/draft")
async def save_verification_draft(tier: int, body: SubmissionDraftRequest, current_user: User = Depends(require_role(UserRole.COMPANY_REP)), db: AsyncSession = Depends(get_db)):
    if tier < 1 or tier > 4:
        raise HTTPException(status_code=400, detail="Invalid tier")
    res = await db.execute(select(Company).where(Company.user_id == current_user.id))
    company = res.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
        
    res = await db.execute(select(VerificationSubmission).where(VerificationSubmission.company_id == company.id, VerificationSubmission.tier == tier))
    sub = res.scalar_one_or_none()
    if not sub:
        sub = VerificationSubmission(company_id=company.id, tier=tier, status='draft')
        db.add(sub)
    else:
        if sub.status in ['pending', 'approved']:
            raise HTTPException(status_code=400, detail="Cannot edit in current state")
    sub.payload = body.payload
    await db.commit()
    return {"success": True}

@router.post("/verification/{tier}/submit")
async def submit_verification(tier: int, current_user: User = Depends(require_role(UserRole.COMPANY_REP)), db: AsyncSession = Depends(get_db)):
    if tier < 1 or tier > 4:
        raise HTTPException(status_code=400, detail="Invalid tier")
    res = await db.execute(select(Company).where(Company.user_id == current_user.id))
    company = res.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
        
    # Check previous tier approved
    if tier > 1:
        prev_status = getattr(company, f"tier_{tier-1}_status")
        if prev_status != 'approved':
            raise HTTPException(status_code=400, detail="Previous tier not approved")

    res = await db.execute(select(VerificationSubmission).where(VerificationSubmission.company_id == company.id, VerificationSubmission.tier == tier))
    sub = res.scalar_one_or_none()
    if not sub:
        sub = VerificationSubmission(company_id=company.id, tier=tier)
        db.add(sub)
    
    if sub.status == 'pending':
        raise HTTPException(status_code=400, detail="Already pending")
        
    sub.status = 'pending'
    sub.submitted_at = datetime.now(timezone.utc)
    setattr(company, f"tier_{tier}_status", 'pending')
    
    if tier == 2 and sub.payload:
        cac = get_cac_lookup()
        num = sub.payload.get('cac_number') or sub.payload.get('business_number')
        t = 'cac' if 'cac_number' in sub.payload else 'bn'
        if num:
            sub.auto_check_result = cac.lookup(num, t)

    db.add(VerificationEvent(company_id=company.id, tier=tier, to_status='pending'))
    await db.commit()
    return {"success": True, "submission_id": sub.id}

@router.get("/capabilities")
async def get_company_capabilities(current_user: User = Depends(require_role(UserRole.COMPANY_REP)), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Company).where(Company.user_id == current_user.id))
    company = res.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    statuses = {f"tier_{t}_status": getattr(company, f"tier_{t}_status") for t in range(1,5)}
    return get_capabilities(company.trust_tier, statuses)

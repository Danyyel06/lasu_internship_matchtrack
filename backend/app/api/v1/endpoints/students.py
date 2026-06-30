from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.dependencies import get_current_user, require_role
from app.models.user import User, UserRole
from app.models.student import Student, StudentJobFamilySelection, StudentSkill
from app.schemas.student import OnboardingRequest, StudentResponse
from app.services.matching import FitScoreCalculator, TierBander

router = APIRouter()

@router.post("/onboarding", response_model=StudentResponse)
async def complete_onboarding(
    payload: OnboardingRequest,
    current_user: User = Depends(require_role(UserRole.STUDENT)),
    db: AsyncSession = Depends(get_db)
):
    """Complete student onboarding."""
    # 1. Get existing student (created during registration)
    result = await db.execute(select(Student).where(Student.user_id == current_user.id))
    existing_student = result.scalar_one_or_none()
    
    if not existing_student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student record not found. Please complete registration first."
        )
        
    if existing_student.onboarding_completed_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student onboarding already completed."
        )

    # 2. Update Student record with new counts
    project_count = len(payload.projects) if payload.projects else 0
    coursework_count = len(payload.coursework) if payload.coursework else 0
    existing_student.project_count = project_count
    existing_student.coursework_count = coursework_count

    existing_student.phone_number = payload.phone_number or existing_student.phone_number
    existing_student.date_of_birth = payload.date_of_birth or existing_student.date_of_birth
    existing_student.gender = payload.gender or existing_student.gender
    existing_student.onboarding_completed_at = datetime.now(timezone.utc)
    
    await db.flush()
    new_student = existing_student

    # 4. Create Job Family Selection
    jf_selection = StudentJobFamilySelection(
        student_id=new_student.id,
        job_family_id=payload.job_family_id,
        selected_sub_role_id=payload.selected_sub_role_id
    )
    db.add(jf_selection)

    # 5. Create Skills
    for skill_data in payload.skills:
        skill = StudentSkill(
            student_id=new_student.id,
            skill_name=skill_data.skill_name,
            claimed_level=skill_data.claimed_level
        )
        db.add(skill)

    # 6. Calculate True Fit Score using Weighted Sum Model
    await db.flush()
    prelim_score = await FitScoreCalculator.calculate_profile_fit_score(new_student.id, db)
    new_student.preliminary_fit_score = prelim_score
    new_student.current_tier = TierBander.assign_tier(prelim_score)

    # Commit transaction
    await db.commit()
    await db.refresh(new_student)

    return new_student

@router.get("/profile", response_model=StudentResponse)
async def get_student_profile(
    current_user: User = Depends(require_role(UserRole.STUDENT)),
    db: AsyncSession = Depends(get_db)
):
    """Get the current student's profile."""
    result = await db.execute(select(Student).where(Student.user_id == current_user.id))
    student = result.scalar_one_or_none()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found."
        )
        
    return student

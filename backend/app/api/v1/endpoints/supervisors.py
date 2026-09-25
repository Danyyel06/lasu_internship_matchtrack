from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List
from pydantic import BaseModel

from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.application import Application
from app.models.student import Student
from app.models.industry_supervisor_profile import IndustrySupervisorProfile
from app.models.internship import Internship
from app.dependencies import get_current_user, require_role
from app.schemas.pagination import PaginatedResponse

router = APIRouter()


class InternGrowthResponse(BaseModel):
    id: int
    application_id: int
    name: str
    department: str
    level: str
    status: str
    progress: str
    current_week: int
    log_status: str
    last_activity: str
    role: str


@router.get("/interns/growth", response_model=PaginatedResponse[InternGrowthResponse])
async def get_interns_growth(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_role(UserRole.INDUSTRY_SUPERVISOR)),
    db: AsyncSession = Depends(get_db)
):
    # Get supervisor profile
    prof_res = await db.execute(
        select(IndustrySupervisorProfile).where(
            IndustrySupervisorProfile.user_id == current_user.id
        )
    )
    profile = prof_res.scalar_one_or_none()

    if not profile:
        raise HTTPException(status_code=400, detail="Supervisor profile not found")

    # Get assigned applications
    stmt = (
        select(Application, Student, User)
        .join(Student, Application.student_id == Student.id)
        .join(User, Student.user_id == User.id)
        .where(Application.industry_supervisor_id == current_user.id)
        .where(Application.status.in_(["accepted", "Accepted"]))
    )
    result = await db.execute(stmt)
    rows = result.all()

    interns = []
    for app, student, user in rows:
        from app.models.weekly_log import WeeklyLog

        log_count = await db.scalar(
            select(func.count(WeeklyLog.id)).where(WeeklyLog.application_id == app.id)
        )
        log_count = log_count or 0

        internship_res = await db.execute(
            select(Internship).where(Internship.id == app.internship_id)
        )
        internship = internship_res.scalar_one_or_none()
        role = internship.title if internship else "Intern"

        # Determine log status from the most recent WeeklyLog
        from app.models.weekly_log import WeeklyLog as WL
        latest_log_res = await db.execute(
            select(WL)
            .where(WL.application_id == app.id)
            .order_by(WL.week_number.desc())
            .limit(1)
        )
        latest_log = latest_log_res.scalar_one_or_none()

        if latest_log and (latest_log.wed_submitted_at or latest_log.sat_submitted_at):
            log_status = "submitted"
            last_activity = "This week"
        else:
            log_status = "pending"
            last_activity = "Never" if log_count == 0 else "Last week"

        interns.append(
            InternGrowthResponse(
                id=student.id,
                application_id=app.id,
                name=f"{user.first_name} {user.last_name}",
                department=student.department or "Unknown",
                level="400L",
                status="Active" if log_count > 0 else "Starting",
                progress=f"{log_count} / {internship.duration_weeks if internship and internship.duration_weeks else 24}",
                current_week=log_count + 1,
                log_status=log_status,
                last_activity=last_activity,
                role=role,
            )
        )

    total = len(interns)
    skip = (page - 1) * limit
    paginated_interns = interns[skip : skip + limit]

    return {
        "items": paginated_interns,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit if limit > 0 else 1
    }


@router.get("/interns/{student_id}")
async def get_intern_detail(
    student_id: int,
    current_user: User = Depends(require_role(UserRole.INDUSTRY_SUPERVISOR)),
    db: AsyncSession = Depends(get_db)
):
    """Get full profile for a single assigned intern."""
    from app.models.weekly_log import WeeklyLog
    from sqlalchemy.orm import selectinload

    # Confirm this student is assigned to this supervisor
    stmt = (
        select(Application, Student, User)
        .join(Student, Application.student_id == Student.id)
        .join(User, Student.user_id == User.id)
        .where(
            Application.industry_supervisor_id == current_user.id,
            Application.student_id == student_id,
            Application.status.in_(["accepted", "Accepted"])
        )
    )
    result = await db.execute(stmt)
    row = result.first()
    if not row:
        raise HTTPException(status_code=404, detail="Intern not found or not assigned to you.")

    app, student, user = row

    # Fetch skills via selectinload-compatible query
    student_res = await db.execute(
        select(Student)
        .options(selectinload(Student.skills))
        .where(Student.id == student_id)
    )
    student_full = student_res.scalar_one_or_none()

    internship_res = await db.execute(select(Internship).where(Internship.id == app.internship_id))
    internship = internship_res.scalar_one_or_none()

    log_count = await db.scalar(
        select(func.count(WeeklyLog.id)).where(WeeklyLog.application_id == app.id)
    ) or 0

    LEVEL_LABELS = {1: 'Beginner', 2: 'Elementary', 3: 'Intermediate', 4: 'Advanced', 5: 'Expert'}

    return {
        "id": student.id,
        "application_id": app.id,
        "name": f"{user.first_name} {user.last_name}",
        "email": user.email,
        "matric_no": student.matric_no,
        "faculty": student.faculty or "",
        "department": student.department or "",
        "level": f"{student.level}L" if student.level else "—",
        "cgpa": float(student.cgpa) if student.cgpa else None,
        "gender": student.gender,
        "current_tier": student.current_tier,
        "role": internship.title if internship else "Intern",
        "log_count": log_count,
        "skills": [
            {
                "skill_name": s.skill_name,
                "claimed_level": s.claimed_level,
                "verified_level": s.verified_level,
                "level_label": LEVEL_LABELS.get(s.verified_level or s.claimed_level or 0, ""),
                "verification_status": s.verification_status,
            }
            for s in (student_full.skills if student_full else [])
        ],
        "duration_weeks": internship.duration_weeks if internship and internship.duration_weeks else 24
    }



class IndSupProfileUpdate(BaseModel):
    first_name: str
    last_name: str
    phone_number: str | None = None
    linkedin_profile: str | None = None
    mentorship_philosophy: str | None = None


@router.get("/profile")
async def get_ind_sup_profile(
    current_user: User = Depends(require_role(UserRole.INDUSTRY_SUPERVISOR)),
    db: AsyncSession = Depends(get_db)
):
    prof_res = await db.execute(
        select(IndustrySupervisorProfile).where(
            IndustrySupervisorProfile.user_id == current_user.id
        )
    )
    profile = prof_res.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=400, detail="Profile not found")

    return {
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "email": current_user.email,
        "is_verified": current_user.is_verified,
        "phone_number": profile.phone_number or "",
        "linkedin_profile": profile.linkedin_profile or "",
        "mentorship_philosophy": profile.mentorship_philosophy or "",
    }


@router.put("/profile")
async def update_ind_sup_profile(
    req: IndSupProfileUpdate,
    current_user: User = Depends(require_role(UserRole.INDUSTRY_SUPERVISOR)),
    db: AsyncSession = Depends(get_db)
):
    # Re-fetch user and profile in this session to avoid detached-instance issues
    user_res = await db.execute(select(User).where(User.id == current_user.id))
    user = user_res.scalar_one_or_none()

    prof_res = await db.execute(
        select(IndustrySupervisorProfile).where(
            IndustrySupervisorProfile.user_id == current_user.id
        )
    )
    profile = prof_res.scalar_one_or_none()
    if not profile or not user:
        raise HTTPException(status_code=400, detail="Profile not found")

    if req.first_name: user.first_name = req.first_name
    if req.last_name: user.last_name = req.last_name
    if req.phone_number is not None: profile.phone_number = req.phone_number
    if req.linkedin_profile is not None: profile.linkedin_profile = req.linkedin_profile
    if req.mentorship_philosophy is not None: profile.mentorship_philosophy = req.mentorship_philosophy

    db.add(user)
    db.add(profile)
    await db.commit()
    return {"message": "Profile updated successfully"}

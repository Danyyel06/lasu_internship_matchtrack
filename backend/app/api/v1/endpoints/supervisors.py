from fastapi import APIRouter, Depends, HTTPException, status
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


@router.get("/interns/growth", response_model=List[InternGrowthResponse])
async def get_interns_growth(
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
                progress=f"{log_count} / 24",
                current_week=log_count + 1,
                log_status=log_status,
                last_activity=last_activity,
                role=role,
            )
        )

    return interns


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
        "phone_number": getattr(current_user, "phone_number", None) or "+234 XXX XXX XXXX",
        "linkedin_profile": getattr(profile, "linkedin_profile", None) or "",
        "mentorship_philosophy": getattr(profile, "mentorship_philosophy", None) or "",
    }


@router.put("/profile")
async def update_ind_sup_profile(
    req: IndSupProfileUpdate,
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

    current_user.first_name = req.first_name
    current_user.last_name = req.last_name

    await db.commit()
    return {"message": "Profile updated successfully"}

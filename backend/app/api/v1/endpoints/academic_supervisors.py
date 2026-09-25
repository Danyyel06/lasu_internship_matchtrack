from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, date

from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.student import Student
from app.models.application import Application
from app.models.internship import Internship
from app.models.company import Company
from app.models.academic_supervisor_profile import AcademicSupervisorProfile
from app.models.intervention import Intervention
from app.models.notification import Notification
from app.dependencies import get_current_user, require_role

router = APIRouter()


class AcadSupStudentResponse(BaseModel):
    id: int
    applicationId: int
    name: str
    company: str
    role: str
    logStatus: str
    logDate: str


@router.get("/students", response_model=List[AcadSupStudentResponse])
async def get_assigned_students(
    current_user: User = Depends(require_role(UserRole.ACADEMIC_SUPERVISOR)),
    db: AsyncSession = Depends(get_db)
):
    prof_res = await db.execute(
        select(AcademicSupervisorProfile).where(
            AcademicSupervisorProfile.user_id == current_user.id
        )
    )
    profile = prof_res.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=400, detail="Profile not found")

    stmt = (
        select(Student, User, Application, Internship, Company)
        .join(User, Student.user_id == User.id)
        .join(Application, Application.student_id == Student.id)
        .join(Internship, Application.internship_id == Internship.id)
        .join(Company, Internship.company_id == Company.id)
        .where(Application.academic_supervisor_id == current_user.id)
        .where(Application.status.in_(["accepted", "Accepted"]))
    )
    res = await db.execute(stmt)
    rows = res.all()

    response = []
    for student, user, app_obj, int_obj, comp_obj in rows:
        from app.models.weekly_log import WeeklyLog

        now = datetime.now()
        week_number = now.isocalendar()[1]

        # Check log for current week
        log_res = await db.execute(
            select(WeeklyLog).where(
                WeeklyLog.application_id == app_obj.id,
                WeeklyLog.week_number == week_number
            )
        )
        log = log_res.scalar_one_or_none()

        if log and (log.wed_submitted_at and log.sat_submitted_at):
            log_status = "submitted"
            log_date = log.sat_submitted_at.strftime("%Y-%m-%d")
        elif log and log.wed_submitted_at:
            log_status = "in_progress"
            log_date = log.wed_submitted_at.strftime("%Y-%m-%d")
        else:
            log_status = "pending"
            log_date = "-"

        response.append(
            AcadSupStudentResponse(
                id=student.id,
                applicationId=app_obj.id,
                name=f"{user.first_name} {user.last_name}",
                company=comp_obj.company_name,
                role=int_obj.title,
                logStatus=log_status,
                logDate=log_date,
            )
        )

    return response


# ── Log Wall endpoints ────────────────────────────────────────────────────────

class LogWallItem(BaseModel):
    studentId: int
    studentName: str
    applicationId: int
    weekNumber: int
    wedPhotoUrl: Optional[str] = None
    satPhotoUrl: Optional[str] = None
    wedStatus: str  # submitted | pending | missed
    satStatus: str
    quizPassed: Optional[bool] = None
    wedContent: Optional[dict] = None
    satContent: Optional[dict] = None


@router.get("/log-wall", response_model=List[LogWallItem])
async def get_log_wall(
    current_user: User = Depends(require_role(UserRole.ACADEMIC_SUPERVISOR)),
    db: AsyncSession = Depends(get_db)
):
    """Returns artifact thumbnails for assigned students with submission status."""
    prof_res = await db.execute(
        select(AcademicSupervisorProfile).where(
            AcademicSupervisorProfile.user_id == current_user.id
        )
    )
    profile = prof_res.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=400, detail="Profile not found")

    # Get all assigned accepted applications
    stmt = (
        select(Student, User, Application)
        .join(User, Student.user_id == User.id)
        .join(Application, Application.student_id == Student.id)
        .where(Application.academic_supervisor_id == current_user.id)
        .where(Application.status.in_(["accepted", "Accepted"]))
    )
    res = await db.execute(stmt)
    rows = res.all()

    from app.models.weekly_log import WeeklyLog, Artifact, AIQuizAttempt

    wall_items = []
    for student, user, app_obj in rows:
        # Get all logs for this application
        logs_res = await db.execute(
            select(WeeklyLog)
            .where(WeeklyLog.application_id == app_obj.id)
            .order_by(WeeklyLog.week_number.desc())
            .limit(8)  # last 8 weeks
        )
        logs = logs_res.scalars().all()

        for log in logs:
            # Get artifacts for this log
            wed_artifact_res = await db.execute(
                select(Artifact).where(
                    Artifact.weekly_log_id == log.id,
                    Artifact.check_in_type == "wednesday"
                )
            )
            sat_artifact_res = await db.execute(
                select(Artifact).where(
                    Artifact.weekly_log_id == log.id,
                    Artifact.check_in_type == "saturday"
                )
            )
            wed_artifact = wed_artifact_res.scalar_one_or_none()
            sat_artifact = sat_artifact_res.scalar_one_or_none()

            # Get quiz attempt
            quiz_res = await db.execute(
                select(AIQuizAttempt).where(
                    AIQuizAttempt.weekly_log_id == log.id
                )
            )
            quiz = quiz_res.scalar_one_or_none()

            wall_items.append(
                LogWallItem(
                    studentId=student.id,
                    studentName=f"{user.first_name} {user.last_name}",
                    applicationId=app_obj.id,
                    weekNumber=log.week_number,
                    wedPhotoUrl=wed_artifact.photo_url if wed_artifact else None,
                    satPhotoUrl=sat_artifact.photo_url if sat_artifact else None,
                    wedStatus="submitted" if log.wed_submitted_at else "pending",
                    satStatus="submitted" if log.sat_submitted_at else "pending",
                    quizPassed=quiz.passed if quiz else None,
                    wedContent=log.wed_content,
                    satContent=log.sat_content,
                )
            )

    return wall_items


class LogDetailResponse(BaseModel):
    studentId: int
    studentName: str
    weekNumber: int
    wedContent: Optional[dict] = None
    satContent: Optional[dict] = None
    wedPhotoUrl: Optional[str] = None
    satPhotoUrl: Optional[str] = None
    wedSubmittedAt: Optional[str] = None
    satSubmittedAt: Optional[str] = None
    quizScore: Optional[int] = None
    quizPassed: Optional[bool] = None
    quizQuestions: Optional[list] = None
    quizStudentAnswers: Optional[list] = None


@router.get("/log-wall/{student_id}/week/{week_id}", response_model=LogDetailResponse)
async def get_log_detail(
    student_id: int,
    week_id: int,
    current_user: User = Depends(require_role(UserRole.ACADEMIC_SUPERVISOR)),
    db: AsyncSession = Depends(get_db)
):
    """Returns full log content, both artifact URLs, and quiz attempt data."""
    # Verify this student is assigned to this supervisor
    app_res = await db.execute(
        select(Application)
        .join(Student, Application.student_id == Student.id)
        .where(
            Student.id == student_id,
            Application.academic_supervisor_id == current_user.id,
            Application.status.in_(["accepted", "Accepted"])
        )
    )
    application = app_res.scalar_one_or_none()
    if not application:
        raise HTTPException(status_code=403, detail="Not authorized for this student")

    from app.models.weekly_log import WeeklyLog, Artifact, AIQuizAttempt

    log_res = await db.execute(
        select(WeeklyLog).where(
            WeeklyLog.application_id == application.id,
            WeeklyLog.week_number == week_id
        )
    )
    log = log_res.scalar_one_or_none()
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")

    # Get student name
    user_res = await db.execute(
        select(User).join(Student, Student.user_id == User.id).where(Student.id == student_id)
    )
    user = user_res.scalar_one_or_none()

    wed_art_res = await db.execute(
        select(Artifact).where(
            Artifact.weekly_log_id == log.id,
            Artifact.check_in_type == "wednesday"
        )
    )
    sat_art_res = await db.execute(
        select(Artifact).where(
            Artifact.weekly_log_id == log.id,
            Artifact.check_in_type == "saturday"
        )
    )
    wed_art = wed_art_res.scalar_one_or_none()
    sat_art = sat_art_res.scalar_one_or_none()

    quiz_res = await db.execute(
        select(AIQuizAttempt).where(AIQuizAttempt.weekly_log_id == log.id)
    )
    quiz = quiz_res.scalar_one_or_none()

    return LogDetailResponse(
        studentId=student_id,
        studentName=f"{user.first_name} {user.last_name}" if user else "Unknown",
        weekNumber=log.week_number,
        wedContent=log.wed_content,
        satContent=log.sat_content,
        wedPhotoUrl=wed_art.photo_url if wed_art else None,
        satPhotoUrl=sat_art.photo_url if sat_art else None,
        wedSubmittedAt=log.wed_submitted_at.isoformat() if log.wed_submitted_at else None,
        satSubmittedAt=log.sat_submitted_at.isoformat() if log.sat_submitted_at else None,
        quizScore=quiz.score if quiz else None,
        quizPassed=quiz.passed if quiz else None,
        quizQuestions=quiz.questions if quiz else None,
        quizStudentAnswers=quiz.student_answers if quiz else None,
    )


# ── Intervention / Log Contact endpoints ─────────────────────────────────────

class InterventionCreate(BaseModel):
    contact_method: str
    contact_date: str  # YYYY-MM-DD
    notes: str


@router.post("/students/{student_id}/interventions")
async def log_intervention(
    student_id: int,
    payload: InterventionCreate,
    current_user: User = Depends(require_role(UserRole.ACADEMIC_SUPERVISOR)),
    db: AsyncSession = Depends(get_db)
):
    app_res = await db.execute(
        select(Application)
        .where(Application.student_id == student_id)
        .where(Application.status.in_(["accepted", "Accepted"]))
    )
    application = app_res.scalar_one_or_none()

    if not application or application.academic_supervisor_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to log intervention for this student"
        )

    try:
        dt = datetime.strptime(payload.contact_date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    new_intervention = Intervention(
        application_id=application.id,
        academic_supervisor_id=current_user.id,
        contact_method=payload.contact_method,
        contact_date=dt,
        notes=payload.notes,
    )

    db.add(new_intervention)
    await db.commit()

    return {"status": "success", "message": "Intervention logged successfully"}


# ── Profile endpoints ─────────────────────────────────────────────────────────

class AcadSupProfileUpdate(BaseModel):
    first_name: str
    last_name: str
    phone_number: str | None = None
    office_location: str | None = None
    title: str | None = None


@router.get("/profile")
async def get_acad_sup_profile(
    current_user: User = Depends(require_role(UserRole.ACADEMIC_SUPERVISOR)),
    db: AsyncSession = Depends(get_db)
):
    prof_res = await db.execute(
        select(AcademicSupervisorProfile).where(
            AcademicSupervisorProfile.user_id == current_user.id
        )
    )
    profile = prof_res.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=400, detail="Profile not found")

    return {
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "email": current_user.email,
        "department": profile.department,
        "faculty": profile.faculty or "",
        "is_verified": current_user.is_verified,
        "phone_number": profile.phone_number or "",
        "office_location": profile.office_location or "",
        "title": profile.title or "",
    }


@router.put("/profile")
async def update_acad_sup_profile(
    req: AcadSupProfileUpdate,
    current_user: User = Depends(require_role(UserRole.ACADEMIC_SUPERVISOR)),
    db: AsyncSession = Depends(get_db)
):
    prof_res = await db.execute(
        select(AcademicSupervisorProfile).where(
            AcademicSupervisorProfile.user_id == current_user.id
        )
    )
    profile = prof_res.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=400, detail="Profile not found")

    current_user.first_name = req.first_name
    current_user.last_name = req.last_name
    if req.phone_number is not None:
        profile.phone_number = req.phone_number
    if req.office_location is not None:
        profile.office_location = req.office_location
    if req.title is not None:
        profile.title = req.title

    await db.commit()
    return {"message": "Profile updated successfully"}

class AcadSupAlertResponse(BaseModel):
    id: int
    type: str
    message: str
    is_read: bool
    created_at: datetime
    related_entity_id: Optional[int] = None
    related_entity_type: Optional[str] = None

@router.get("/alerts", response_model=List[AcadSupAlertResponse])
async def get_alerts(
    current_user: User = Depends(require_role(UserRole.ACADEMIC_SUPERVISOR)),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(Notification)
        .where(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
    )
    res = await db.execute(stmt)
    notifications = res.scalars().all()
    
    return [
        AcadSupAlertResponse(
            id=n.id,
            type=n.type,
            message=n.message,
            is_read=n.is_read,
            created_at=n.created_at,
            related_entity_id=n.related_entity_id,
            related_entity_type=n.related_entity_type
        )
        for n in notifications
    ]

"""
Industry Supervisor Monthly Review endpoints.

GET  /pending                          — all students with pending reviews
GET  /{studentId}/{monthYear}/digest   — full compiled month digest
POST /{studentId}/{monthYear}/endorse  — save endorsement
POST /{studentId}/{monthYear}/flag     — save flag with required comment
"""
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.dependencies import require_role
from app.models.user import User, UserRole
from app.models.application import Application
from app.models.student import Student
from app.models.internship import Internship
from app.models.company import Company
from app.models.weekly_log import WeeklyLog, AIQuizAttempt
from app.models.monthly_endorsement import MonthlyEndorsement, EndorsementAction
from app.schemas.monthly_review import (
    PendingReviewResponse,
    MonthlyDigestResponse,
    MonthlyReviewResponse,
    WeekSummary,
    EndorseRequest,
    FlagRequest,
)

router = APIRouter()


def _current_month_year() -> str:
    """Return current month in 'YYYY-MM' format."""
    return datetime.now(timezone.utc).strftime("%Y-%m")


def _month_year_to_week_range(month_year: str):
    """
    Return (start_week, end_week) ISO week numbers that fall within the given month.
    This is an approximation — a month spans roughly 4-5 weeks.
    """
    year, month = map(int, month_year.split("-"))
    from datetime import date
    import calendar

    first_day = date(year, month, 1)
    last_day = date(year, month, calendar.monthrange(year, month)[1])
    start_week = first_day.isocalendar()[1]
    end_week = last_day.isocalendar()[1]
    # Handle year boundary (week 52/53 → week 1 of next year)
    if end_week < start_week:
        end_week = 52 + end_week
    return start_week, end_week


async def _get_supervisor_interns(supervisor_user_id: int, db: AsyncSession):
    """Return accepted applications assigned to this supervisor."""
    stmt = (
        select(Application, Student, User)
        .join(Student, Application.student_id == Student.id)
        .join(User, Student.user_id == User.id)
        .where(Application.industry_supervisor_id == supervisor_user_id)
        .where(Application.status.in_(["accepted", "Accepted"]))
    )
    result = await db.execute(stmt)
    return result.all()


# ── 1. Pending Reviews ────────────────────────────────────────────────────────

@router.get("/pending", response_model=List[PendingReviewResponse])
async def get_pending_reviews(
    current_user: User = Depends(require_role(UserRole.INDUSTRY_SUPERVISOR)),
    db: AsyncSession = Depends(get_db),
):
    """Returns all students with pending monthly reviews for the authenticated supervisor."""
    month_year = _current_month_year()
    rows = await _get_supervisor_interns(current_user.id, db)

    pending = []
    for app, student, user in rows:
        # Check if endorsement already exists for this month
        end_res = await db.execute(
            select(MonthlyEndorsement).where(
                MonthlyEndorsement.application_id == app.id,
                MonthlyEndorsement.month_year == month_year,
            )
        )
        endorsement = end_res.scalar_one_or_none()

        # Count log submissions for the month
        start_week, end_week = _month_year_to_week_range(month_year)
        logs_res = await db.execute(
            select(WeeklyLog).where(
                WeeklyLog.application_id == app.id,
                WeeklyLog.week_number >= start_week,
                WeeklyLog.week_number <= end_week,
            )
        )
        logs = logs_res.scalars().all()
        submission_count = sum(
            (1 if l.wed_submitted_at else 0) + (1 if l.sat_submitted_at else 0)
            for l in logs
        )

        pending.append(
            PendingReviewResponse(
                student_id=student.id,
                student_name=f"{user.first_name} {user.last_name}",
                department=student.department or "Unknown",
                application_id=app.id,
                month_year=month_year,
                log_submission_count=submission_count,
                status=endorsement.action.value if endorsement else "pending",
            )
        )

    return pending


# ── 2. Monthly Digest ─────────────────────────────────────────────────────────

@router.get("/{student_id}/{month_year}/digest", response_model=MonthlyDigestResponse)
async def get_monthly_digest(
    student_id: int,
    month_year: str,
    current_user: User = Depends(require_role(UserRole.INDUSTRY_SUPERVISOR)),
    db: AsyncSession = Depends(get_db),
):
    """Returns compiled month digest for the given student and month."""
    # Verify this student is assigned to this supervisor
    app_res = await db.execute(
        select(Application)
        .join(Student, Application.student_id == Student.id)
        .where(
            Student.id == student_id,
            Application.industry_supervisor_id == current_user.id,
            Application.status.in_(["accepted", "Accepted"]),
        )
    )
    application = app_res.scalar_one_or_none()
    if not application:
        raise HTTPException(status_code=403, detail="Not authorized for this student")

    # Get student details
    user_res = await db.execute(
        select(User, Student)
        .join(Student, Student.user_id == User.id)
        .where(Student.id == student_id)
    )
    user_row = user_res.first()
    if not user_row:
        raise HTTPException(status_code=404, detail="Student not found")
    user, student = user_row

    # Get weekly logs for the month
    start_week, end_week = _month_year_to_week_range(month_year)
    logs_res = await db.execute(
        select(WeeklyLog).where(
            WeeklyLog.application_id == application.id,
            WeeklyLog.week_number >= start_week,
            WeeklyLog.week_number <= end_week,
        ).order_by(WeeklyLog.week_number)
    )
    logs = logs_res.scalars().all()

    weeks = []
    submission_count = 0
    for log in logs:
        if log.wed_submitted_at:
            submission_count += 1
        if log.sat_submitted_at:
            submission_count += 1

        quiz = log.quiz_attempt
        weeks.append(
            WeekSummary(
                week_number=log.week_number,
                wed_submitted=bool(log.wed_submitted_at),
                sat_submitted=bool(log.sat_submitted_at),
                wed_content=log.wed_content,
                sat_content=log.sat_content,
                quiz_score=quiz.score if quiz else None,
                quiz_passed=quiz.passed if quiz else None,
            )
        )

    # Check existing endorsement
    end_res = await db.execute(
        select(MonthlyEndorsement).where(
            MonthlyEndorsement.application_id == application.id,
            MonthlyEndorsement.month_year == month_year,
        )
    )
    existing = end_res.scalar_one_or_none()
    existing_review = None
    if existing:
        existing_review = MonthlyReviewResponse(
            id=existing.id,
            application_id=existing.application_id,
            industry_supervisor_id=existing.industry_supervisor_id,
            month_year=existing.month_year,
            action=existing.action.value,
            flag_comment=existing.flag_comment,
            created_at_wat=existing.created_at_wat,
            is_locked=existing.is_locked,
        )

    # Total possible: 2 per week (Wed + Sat) × weeks in month (approx 4)
    total_possible = (end_week - start_week + 1) * 2

    return MonthlyDigestResponse(
        student_id=student.id,
        student_name=f"{user.first_name} {user.last_name}",
        department=student.department or "Unknown",
        month_year=month_year,
        application_id=application.id,
        log_submission_count=submission_count,
        total_possible_submissions=total_possible,
        weeks=weeks,
        existing_review=existing_review,
    )


# ── 3. Endorse ────────────────────────────────────────────────────────────────

@router.post("/{student_id}/{month_year}/endorse", response_model=MonthlyReviewResponse)
async def endorse_monthly(
    student_id: int,
    month_year: str,
    _: EndorseRequest,
    current_user: User = Depends(require_role(UserRole.INDUSTRY_SUPERVISOR)),
    db: AsyncSession = Depends(get_db),
):
    """Save endorsement for the student's month. Locks immediately."""
    app_res = await db.execute(
        select(Application)
        .join(Student, Application.student_id == Student.id)
        .where(
            Student.id == student_id,
            Application.industry_supervisor_id == current_user.id,
            Application.status.in_(["accepted", "Accepted"]),
        )
    )
    application = app_res.scalar_one_or_none()
    if not application:
        raise HTTPException(status_code=403, detail="Not authorized for this student")

    # Prevent duplicate
    end_res = await db.execute(
        select(MonthlyEndorsement).where(
            MonthlyEndorsement.application_id == application.id,
            MonthlyEndorsement.month_year == month_year,
        )
    )
    if end_res.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Review already submitted for this month")

    endorsement = MonthlyEndorsement(
        application_id=application.id,
        industry_supervisor_id=current_user.id,
        month_year=month_year,
        action=EndorsementAction.endorsed,
        is_locked=True,
    )
    db.add(endorsement)
    await db.commit()
    await db.refresh(endorsement)

    # Dispatch notification (best-effort)
    try:
        from app.services.monthly_endorsement_service import MonthlyEndorsementService
        await MonthlyEndorsementService.dispatch_notifications(endorsement, db)
    except Exception:
        pass

    return MonthlyReviewResponse(
        id=endorsement.id,
        application_id=endorsement.application_id,
        industry_supervisor_id=endorsement.industry_supervisor_id,
        month_year=endorsement.month_year,
        action=endorsement.action.value,
        flag_comment=endorsement.flag_comment,
        created_at_wat=endorsement.created_at_wat,
        is_locked=endorsement.is_locked,
    )


# ── 4. Flag ───────────────────────────────────────────────────────────────────

@router.post("/{student_id}/{month_year}/flag", response_model=MonthlyReviewResponse)
async def flag_monthly(
    student_id: int,
    month_year: str,
    payload: FlagRequest,
    current_user: User = Depends(require_role(UserRole.INDUSTRY_SUPERVISOR)),
    db: AsyncSession = Depends(get_db),
):
    """Save flag with required comment. Locks immediately and dispatches early-warning alert."""
    if not payload.flag_comment or not payload.flag_comment.strip():
        raise HTTPException(status_code=400, detail="flag_comment is required when flagging")

    app_res = await db.execute(
        select(Application)
        .join(Student, Application.student_id == Student.id)
        .where(
            Student.id == student_id,
            Application.industry_supervisor_id == current_user.id,
            Application.status.in_(["accepted", "Accepted"]),
        )
    )
    application = app_res.scalar_one_or_none()
    if not application:
        raise HTTPException(status_code=403, detail="Not authorized for this student")

    end_res = await db.execute(
        select(MonthlyEndorsement).where(
            MonthlyEndorsement.application_id == application.id,
            MonthlyEndorsement.month_year == month_year,
        )
    )
    if end_res.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Review already submitted for this month")

    endorsement = MonthlyEndorsement(
        application_id=application.id,
        industry_supervisor_id=current_user.id,
        month_year=month_year,
        action=EndorsementAction.flagged,
        flag_comment=payload.flag_comment.strip(),
        is_locked=True,
    )
    db.add(endorsement)
    await db.commit()
    await db.refresh(endorsement)

    # Dispatch early-warning alert to academic supervisor (best-effort)
    try:
        from app.services.monthly_endorsement_service import MonthlyEndorsementService
        await MonthlyEndorsementService.dispatch_notifications(endorsement, db)
    except Exception:
        pass

    return MonthlyReviewResponse(
        id=endorsement.id,
        application_id=endorsement.application_id,
        industry_supervisor_id=endorsement.industry_supervisor_id,
        month_year=endorsement.month_year,
        action=endorsement.action.value,
        flag_comment=endorsement.flag_comment,
        created_at_wat=endorsement.created_at_wat,
        is_locked=endorsement.is_locked,
    )

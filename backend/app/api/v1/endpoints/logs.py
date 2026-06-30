"""
Bi-Weekly Evidence Log endpoints (Student).

Check-in schedule:
  Wednesday — 4 text fields + required rear-camera photo (KYC artifact)
  Saturday  — same 4 fields + required rear-camera photo → unlocks AI quiz

All check-in/history endpoints require an authenticated student with an accepted placement.
The artifact upload endpoint only requires an authenticated student (photo is pre-uploaded
before the check-in form is submitted).
"""
import os
import uuid
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.dependencies import require_role
from app.models.user import User, UserRole
from app.models.application import Application
from app.models.student import Student
from app.models.weekly_log import WeeklyLog, Artifact, AIQuizAttempt, CheckInType
from app.schemas.log import (
    LogCheckInRequest,
    ArtifactUploadResponse,
    WeeklyLogResponse,
    CurrentWeekStatusResponse,
    QuizSubmitRequest,
    QuizResultResponse,
)

router = APIRouter()

# Directory to store uploaded artifacts during development.
# Replace with cloud storage (e.g., GCS) in production.
UPLOAD_DIR = os.path.join(
    os.path.dirname(__file__), "..", "..", "..", "..", "uploads", "artifacts"
)


def _get_upload_dir() -> str:
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    return UPLOAD_DIR


def _wat_now() -> datetime:
    """Return current UTC time. WAT = UTC+1; displayed as WAT on frontend."""
    return datetime.now(timezone.utc)


def _current_week_number() -> int:
    return datetime.now(timezone.utc).isocalendar()[1]


async def _get_student_accepted_application(
    current_user: User, db: AsyncSession
) -> Application:
    """Resolve the student record → their accepted application, or raise HTTP errors."""
    student_res = await db.execute(
        select(Student).where(Student.user_id == current_user.id)
    )
    student = student_res.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=400, detail="Student profile not found")

    app_res = await db.execute(
        select(Application).where(
            Application.student_id == student.id,
            Application.status.in_(["accepted", "Accepted"]),
        )
    )
    application = app_res.scalar_one_or_none()
    if not application:
        raise HTTPException(
            status_code=400,
            detail="No active placement found. You must have an accepted internship to submit logs.",
        )
    return application


# ── 1. Artifact Upload ────────────────────────────────────────────────────────

@router.post("/artifact-upload", response_model=ArtifactUploadResponse)
async def upload_artifact(
    file: UploadFile = File(...),
    upload_source: str = Form("camera"),
    check_in_type: Optional[str] = Form(None),  # "wednesday" | "saturday" | None
    current_user: User = Depends(require_role(UserRole.STUDENT)),
    db: AsyncSession = Depends(get_db),
):
    """
    Accept a photo from the student's device camera.
    upload_source must be 'camera' — gallery uploads are rejected server-side.
    check_in_type is optional; it will be linked when the check-in is submitted.
    Returns an artifact_id to attach to the subsequent check-in submission.
    """
    if upload_source != "camera":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only camera uploads are permitted (upload_source must be 'camera')",
        )

    resolved_check_in_type = None
    if check_in_type and check_in_type in ("wednesday", "saturday"):
        resolved_check_in_type = CheckInType(check_in_type)

    # Persist file to local upload directory
    upload_dir = _get_upload_dir()
    ext = os.path.splitext(file.filename or "photo.jpg")[1] or ".jpg"
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(upload_dir, filename)

    contents = await file.read()
    with open(filepath, "wb") as f:
        f.write(contents)

    # Public URL served via /uploads static mount on main.py
    photo_url = f"/uploads/artifacts/{filename}"
    server_ts = _wat_now()

    artifact = Artifact(
        weekly_log_id=None,  # linked when check-in is submitted
        check_in_type=resolved_check_in_type,
        photo_url=photo_url,
        server_timestamp_wat=server_ts,
        upload_source=upload_source,
    )
    db.add(artifact)
    await db.commit()
    await db.refresh(artifact)

    return ArtifactUploadResponse(artifact_id=artifact.id, server_timestamp_wat=server_ts)


# ── 2. Wednesday Check-in ─────────────────────────────────────────────────────

@router.post("/wednesday")
async def submit_wednesday(
    payload: LogCheckInRequest,
    current_user: User = Depends(require_role(UserRole.STUDENT)),
    db: AsyncSession = Depends(get_db),
):
    """Save Wednesday check-in for the current ISO week."""
    application = await _get_student_accepted_application(current_user, db)
    week_number = _current_week_number()

    # Upsert WeeklyLog row for this week
    log_res = await db.execute(
        select(WeeklyLog).where(
            WeeklyLog.application_id == application.id,
            WeeklyLog.week_number == week_number,
        )
    )
    log = log_res.scalar_one_or_none()

    if not log:
        log = WeeklyLog(application_id=application.id, week_number=week_number)
        db.add(log)
        await db.flush()

    if log.wed_submitted_at:
        raise HTTPException(
            status_code=400,
            detail="Wednesday check-in already submitted for this week",
        )

    log.wed_content = {
        "focus_area": payload.focus_area,
        "core_action": payload.core_action,
        "the_blocker": payload.the_blocker,
        "the_takeaway": payload.the_takeaway,
    }
    log.wed_submitted_at = _wat_now()

    # Link artifact if provided and tag it as wednesday
    if payload.artifact_id:
        art_res = await db.execute(
            select(Artifact).where(Artifact.id == payload.artifact_id)
        )
        artifact = art_res.scalar_one_or_none()
        if artifact and artifact.weekly_log_id is None:
            artifact.weekly_log_id = log.id
            artifact.check_in_type = CheckInType.wednesday

    await db.commit()
    return {"message": "Wednesday check-in submitted", "weekly_log_id": log.id, "week_number": week_number}


# ── 3. Saturday Check-in ──────────────────────────────────────────────────────

@router.post("/saturday")
async def submit_saturday(
    payload: LogCheckInRequest,
    current_user: User = Depends(require_role(UserRole.STUDENT)),
    db: AsyncSession = Depends(get_db),
):
    """
    Save Saturday check-in. Requires Wednesday to be submitted first.
    Triggers AI quiz generation after successful save.
    """
    application = await _get_student_accepted_application(current_user, db)
    week_number = _current_week_number()

    log_res = await db.execute(
        select(WeeklyLog).where(
            WeeklyLog.application_id == application.id,
            WeeklyLog.week_number == week_number,
        )
    )
    log = log_res.scalar_one_or_none()

    if not log or not log.wed_submitted_at:
        raise HTTPException(
            status_code=400,
            detail="Wednesday check-in must be completed before Saturday submission",
        )

    if log.sat_submitted_at:
        raise HTTPException(
            status_code=400,
            detail="Saturday check-in already submitted for this week",
        )

    log.sat_content = {
        "focus_area": payload.focus_area,
        "core_action": payload.core_action,
        "the_blocker": payload.the_blocker,
        "the_takeaway": payload.the_takeaway,
    }
    log.sat_submitted_at = _wat_now()

    if payload.artifact_id:
        art_res = await db.execute(
            select(Artifact).where(Artifact.id == payload.artifact_id)
        )
        artifact = art_res.scalar_one_or_none()
        if artifact and artifact.weekly_log_id is None:
            artifact.weekly_log_id = log.id
            artifact.check_in_type = CheckInType.saturday

    await db.commit()

    # Trigger quiz generation (best-effort; failure does not block response)
    try:
        from app.services.quiz_service import AIQuizService
        await AIQuizService.generate_and_save(log_id=log.id, db=db)
    except Exception:
        pass

    return {"message": "Saturday check-in submitted", "weekly_log_id": log.id, "week_number": week_number}


# ── 4. Current Week Status ────────────────────────────────────────────────────

@router.get("/current-week", response_model=CurrentWeekStatusResponse)
async def get_current_week_status(
    current_user: User = Depends(require_role(UserRole.STUDENT)),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns submission status for the current ISO week.
    Status values:
      wed_status / sat_status: "not_started" | "submitted"
      sat_status also: "locked" (when Wednesday not yet submitted)
      quiz_status: "unavailable" | "available" | "completed"
    """
    application = await _get_student_accepted_application(current_user, db)
    week_number = _current_week_number()

    log_res = await db.execute(
        select(WeeklyLog).where(
            WeeklyLog.application_id == application.id,
            WeeklyLog.week_number == week_number,
        )
    )
    log = log_res.scalar_one_or_none()

    if not log:
        return CurrentWeekStatusResponse(
            week_number=week_number,
            wed_status="not_started",
            sat_status="locked",
            quiz_status="unavailable",
            weekly_log_id=None,
        )

    wed_status = "submitted" if log.wed_submitted_at else "not_started"

    if log.sat_submitted_at:
        sat_status = "submitted"
    elif log.wed_submitted_at:
        sat_status = "not_started"
    else:
        sat_status = "locked"

    quiz_status = "unavailable"
    quiz_result = None
    if log.sat_submitted_at:
        if log.quiz_attempt and log.quiz_attempt.attempted_at:
            quiz_status = "completed"
            quiz_result = QuizResultResponse(
                weekly_log_id=log.id,
                score=log.quiz_attempt.score or 0,
                passed=log.quiz_attempt.passed or False,
                failed_due_to_tab_switch=log.quiz_attempt.failed_due_to_tab_switch or False,
                questions=log.quiz_attempt.questions,
                student_answers=log.quiz_attempt.student_answers,
                correct_answers=log.quiz_attempt.correct_answers,
            )
        elif log.quiz_attempt and log.quiz_attempt.questions:
            quiz_status = "available"
        else:
            # Saturday submitted but quiz not yet generated (Gemini may still be processing)
            quiz_status = "generating"

    return CurrentWeekStatusResponse(
        week_number=week_number,
        wed_status=wed_status,
        sat_status=sat_status,
        quiz_status=quiz_status,
        weekly_log_id=log.id,
        quiz_result=quiz_result,
    )


# ── 5. Log History ────────────────────────────────────────────────────────────

@router.get("/my-logs", response_model=List[WeeklyLogResponse])
async def get_my_logs(
    current_user: User = Depends(require_role(UserRole.STUDENT)),
    db: AsyncSession = Depends(get_db),
):
    """Returns full log history for the authenticated student, newest first."""
    application = await _get_student_accepted_application(current_user, db)

    logs_res = await db.execute(
        select(WeeklyLog)
        .where(WeeklyLog.application_id == application.id)
        .order_by(WeeklyLog.week_number.desc())
    )
    logs = logs_res.scalars().all()

    result = []
    for log in logs:
        wed_photo = sat_photo = None
        quiz_score = quiz_passed = None

        # Resolve photos from artifacts
        for art in (log.artifacts or []):
            if art.check_in_type == CheckInType.wednesday:
                wed_photo = art.photo_url
            elif art.check_in_type == CheckInType.saturday:
                sat_photo = art.photo_url

        if log.quiz_attempt:
            quiz_score = log.quiz_attempt.score
            quiz_passed = log.quiz_attempt.passed

        result.append(
            WeeklyLogResponse(
                id=log.id,
                application_id=log.application_id,
                week_number=log.week_number,
                wed_content=log.wed_content,
                sat_content=log.sat_content,
                wed_photo_url=wed_photo,
                sat_photo_url=sat_photo,
                wed_submitted_at=log.wed_submitted_at,
                sat_submitted_at=log.sat_submitted_at,
                quiz_score=quiz_score,
                quiz_passed=quiz_passed,
                created_at=log.created_at,
            )
        )

    return result


# ── 6. Get Quiz Questions (for the quiz screen) ───────────────────────────────

@router.get("/quiz/{log_id}/questions")
async def get_quiz_questions(
    log_id: int,
    current_user: User = Depends(require_role(UserRole.STUDENT)),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns the generated quiz questions for a specific weekly log.
    Correct answers are NOT included — those are stored server-side only.
    The quiz screen uses this to render questions, then POSTs answers to /quiz/{log_id}/submit.
    """
    application = await _get_student_accepted_application(current_user, db)

    # Verify the log belongs to this student
    log_res = await db.execute(
        select(WeeklyLog).where(
            WeeklyLog.id == log_id,
            WeeklyLog.application_id == application.id,
        )
    )
    log = log_res.scalar_one_or_none()
    if not log:
        raise HTTPException(status_code=404, detail="Log not found or not authorized")

    if not log.sat_submitted_at:
        raise HTTPException(
            status_code=400,
            detail="Saturday check-in must be submitted before the quiz is available",
        )

    if not log.quiz_attempt or not log.quiz_attempt.questions:
        # Try to generate now if not yet available
        try:
            from app.services.quiz_service import AIQuizService
            attempt = await AIQuizService.generate_and_save(log_id=log.id, db=db)
            if attempt and attempt.questions:
                return {
                    "weekly_log_id": log.id,
                    "week_number": log.week_number,
                    "questions": attempt.questions,
                    "total_questions": len(attempt.questions),
                }
        except Exception:
            pass
        raise HTTPException(
            status_code=404,
            detail="Quiz not yet available. Please try again in a moment.",
        )

    # Return questions WITHOUT correct answers
    return {
        "weekly_log_id": log.id,
        "week_number": log.week_number,
        "questions": log.quiz_attempt.questions,
        "total_questions": len(log.quiz_attempt.questions),
        "already_attempted": log.quiz_attempt.attempted_at is not None,
    }


# ── 7. Quiz Submit ────────────────────────────────────────────────────────────

@router.post("/quiz/{log_id}/submit", response_model=QuizResultResponse)
async def submit_quiz(
    log_id: int,
    payload: QuizSubmitRequest,
    current_user: User = Depends(require_role(UserRole.STUDENT)),
    db: AsyncSession = Depends(get_db),
):
    """Submit quiz answers for a specific weekly log."""
    application = await _get_student_accepted_application(current_user, db)

    log_res = await db.execute(
        select(WeeklyLog).where(
            WeeklyLog.id == log_id,
            WeeklyLog.application_id == application.id,
        )
    )
    log = log_res.scalar_one_or_none()
    if not log:
        raise HTTPException(status_code=404, detail="Log not found or not authorized")

    if not log.sat_submitted_at:
        raise HTTPException(
            status_code=400,
            detail="Saturday check-in must be submitted before taking the quiz",
        )

    if log.quiz_attempt and log.quiz_attempt.attempted_at:
        raise HTTPException(
            status_code=400, detail="Quiz already submitted for this week"
        )

    # Auto-fail on tab switch
    if payload.failed_due_to_tab_switch:
        if not log.quiz_attempt:
            attempt = AIQuizAttempt(weekly_log_id=log.id)
            db.add(attempt)
            await db.flush()
            log.quiz_attempt = attempt

        log.quiz_attempt.student_answers = payload.student_answers or []
        log.quiz_attempt.score = 0
        log.quiz_attempt.passed = False
        log.quiz_attempt.failed_due_to_tab_switch = True
        log.quiz_attempt.attempted_at = _wat_now()
        await db.commit()
        return QuizResultResponse(
            weekly_log_id=log.id,
            score=0,
            passed=False,
            failed_due_to_tab_switch=True,
        )

    # Grade normally
    from app.services.quiz_service import AIQuizService
    result = await AIQuizService.grade_and_save(
        log=log,
        student_answers=payload.student_answers,
        db=db,
    )
    return result

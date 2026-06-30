from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.application import Application
from app.dependencies import get_current_user
from app.schemas.growth import GrowthSummaryResponse

router = APIRouter()


@router.get("/summary", response_model=GrowthSummaryResponse)
async def get_growth_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can view growth summary."
        )

    result = await db.execute(
        select(Application).where(
            Application.student_id == current_user.student_profile.id,
            Application.status == "accepted"
        )
    )
    application = result.scalars().first()

    if not application:
        return GrowthSummaryResponse(
            total_logs=0,
            total_wednesday_submissions=0,
            total_saturday_submissions=0,
            total_quizzes_passed=0,
            total_quizzes_attempted=0,
            pass_rate_percentage=0.0,
        )

    from app.models.weekly_log import WeeklyLog, AIQuizAttempt

    logs_query = await db.execute(
        select(WeeklyLog).where(WeeklyLog.application_id == application.id)
    )
    logs = logs_query.scalars().all()

    total_logs = len(logs)
    total_wednesday_submissions = sum(1 for l in logs if l.wed_submitted_at)
    total_saturday_submissions = sum(1 for l in logs if l.sat_submitted_at)

    quiz_query = await db.execute(
        select(AIQuizAttempt).where(
            AIQuizAttempt.weekly_log_id.in_([l.id for l in logs])
        )
    )
    quizzes = quiz_query.scalars().all()

    total_quizzes_attempted = len(quizzes)
    total_quizzes_passed = sum(1 for q in quizzes if q.passed)

    pass_rate = 0.0
    if total_quizzes_attempted > 0:
        pass_rate = (total_quizzes_passed / total_quizzes_attempted) * 100.0

    return GrowthSummaryResponse(
        total_logs=total_logs,
        total_wednesday_submissions=total_wednesday_submissions,
        total_saturday_submissions=total_saturday_submissions,
        total_quizzes_passed=total_quizzes_passed,
        total_quizzes_attempted=total_quizzes_attempted,
        pass_rate_percentage=round(pass_rate, 2),
    )

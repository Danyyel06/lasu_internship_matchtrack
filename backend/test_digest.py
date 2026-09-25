import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models.user import User, UserRole
from app.models.application import Application
from app.models.student import Student
from app.models.internship import Internship
from app.models.weekly_log import WeeklyLog
from app.models.monthly_endorsement import MonthlyEndorsement
from app.api.v1.endpoints.monthly_review import _month_year_to_week_range

async def test_query():
    engine = create_async_engine("postgresql+asyncpg://postgres:11postgres26@localhost:5432/lasu_internship", echo=False)
    async_session = sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
    
    async with async_session() as db:
        student_id = 7
        month_year = "2026-07"
        
        # Get supervisor ID
        app_res = await db.execute(
            select(Application).where(Application.student_id == student_id, Application.status.in_(["accepted", "Accepted"]))
        )
        app = app_res.scalar_one_or_none()
        if not app:
            print("No accepted application found for student 7")
            return
            
        print(f"Found application {app.id}, supervisor {app.industry_supervisor_id}")
        
        start_week, end_week = _month_year_to_week_range(month_year)
        print(f"Weeks: {start_week} to {end_week}")
        
        try:
            logs_res = await db.execute(
                select(WeeklyLog)
                .options(selectinload(WeeklyLog.quiz_attempt))
                .where(
                    WeeklyLog.application_id == app.id,
                    WeeklyLog.week_number >= start_week,
                    WeeklyLog.week_number <= end_week,
                ).order_by(WeeklyLog.week_number)
            )
            logs = logs_res.scalars().all()
            print(f"Found {len(logs)} logs")
            for log in logs:
                print(f"Week {log.week_number}: wed={bool(log.wed_submitted_at)}, sat={bool(log.sat_submitted_at)}, quiz={log.quiz_attempt}")

            end_res = await db.execute(
                select(MonthlyEndorsement).where(
                    MonthlyEndorsement.application_id == app.id,
                    MonthlyEndorsement.month_year == month_year,
                )
            )
            existing = end_res.scalar_one_or_none()
            print(f"Existing review: {existing}")
            
            from app.schemas.monthly_review import MonthlyReviewResponse, WeekSummary, MonthlyDigestResponse
            
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

            total_possible = (end_week - start_week + 1) * 2

            res = MonthlyDigestResponse(
                student_id=7,
                student_name="Test Student",
                department="Test Dept",
                month_year=month_year,
                application_id=app.id,
                log_submission_count=submission_count,
                total_possible_submissions=total_possible,
                weeks=weeks,
                existing_review=existing_review,
            )
            
            print(res.model_dump_json())
        except Exception as e:
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_query())

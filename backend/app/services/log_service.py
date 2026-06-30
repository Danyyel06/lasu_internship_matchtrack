"""
Service for managing bi-weekly logs and enforcing submission deadlines.
"""
from datetime import datetime, timezone
from typing import List

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.application import Application
from app.models.student import Student
from app.models.user import User
from app.models.weekly_log import WeeklyLog
from app.models.notification import Notification
from app.ws.manager import manager


class BiWeeklyLogService:
    @staticmethod
    def get_current_week_number() -> int:
        """Returns the current ISO week number."""
        return datetime.now(timezone.utc).isocalendar()[1]

    @staticmethod
    async def check_missed_submissions(db: AsyncSession) -> int:
        """
        Runs periodically (e.g., via a cron job every Monday morning).
        Finds all active placements, checks if they missed the previous week's
        submissions, and tracks consecutive misses.
        Dispatches alerts if the threshold is reached.
        
        Returns the number of alerts dispatched.
        """
        current_week = BiWeeklyLogService.get_current_week_number()
        # We are checking the week that just ended.
        last_week = current_week - 1
        two_weeks_ago = current_week - 2

        # 1. Get all active placements
        stmt = (
            select(Application, Student, User)
            .join(Student, Application.student_id == Student.id)
            .join(User, Student.user_id == User.id)
            .where(Application.status.in_(["accepted", "Accepted"]))
        )
        result = await db.execute(stmt)
        placements = result.all()

        alerts_dispatched = 0

        for app, student, user in placements:
            # If no academic supervisor assigned, skip alerting
            if not app.academic_supervisor_id:
                continue

            # Fetch the logs for the last two weeks
            logs_stmt = select(WeeklyLog).where(
                WeeklyLog.application_id == app.id,
                WeeklyLog.week_number.in_([last_week, two_weeks_ago])
            )
            logs_res = await db.execute(logs_stmt)
            recent_logs = {log.week_number: log for log in logs_res.scalars().all()}

            consecutive_misses = 0

            # Check last week (Week N-1)
            last_week_log = recent_logs.get(last_week)
            if not last_week_log or (not last_week_log.wed_submitted_at and not last_week_log.sat_submitted_at):
                consecutive_misses += 1

                # Check two weeks ago (Week N-2)
                two_weeks_log = recent_logs.get(two_weeks_ago)
                if not two_weeks_log or (not two_weeks_log.wed_submitted_at and not two_weeks_log.sat_submitted_at):
                    consecutive_misses += 1

            # Dispatch alert if >= 2 consecutive misses
            # Note: The threshold is default 2 per AGENTS.md requirements
            if consecutive_misses >= 2:
                alerted = await BiWeeklyLogService.dispatch_missed_log_alert(
                    db=db,
                    application=app,
                    student_user=user,
                    student=student,
                    miss_count=consecutive_misses
                )
                if alerted:
                    alerts_dispatched += 1

        return alerts_dispatched

    @staticmethod
    async def dispatch_missed_log_alert(
        db: AsyncSession, 
        application: Application, 
        student_user: User, 
        student: Student,
        miss_count: int
    ) -> bool:
        """
        Creates a high-priority notification for the Academic Supervisor.
        """
        supervisor_id = application.academic_supervisor_id
        if not supervisor_id:
            return False
            
        student_name = f"{student_user.first_name} {student_user.last_name}"
        message = (
            f"URGENT: {student_name} ({student.matric_no}) has missed {miss_count} "
            f"consecutive bi-weekly log submissions. Intervention is required."
        )

        # Check if we already alerted for this specific urgency recently 
        # (to prevent spamming if cron runs multiple times)
        recent_alert_stmt = select(Notification).where(
            Notification.user_id == supervisor_id,
            Notification.message == message,
            Notification.is_read == False
        )
        existing = await db.execute(recent_alert_stmt)
        if existing.scalar_one_or_none():
            return False  # Already alerted

        notif = Notification(
            user_id=supervisor_id,
            message=message,
            is_read=False
        )
        db.add(notif)
        await db.commit()
        await db.refresh(notif)
        
        # Broadcast via WebSockets if supervisor is online
        ws_msg = {
            "type": "missed_log",
            "notification": {
                "id": notif.id,
                "message": notif.message,
                "time": "Just now",
                "urgent": True,
                "read": False
            }
        }
        try:
            await manager.send_personal_message(ws_msg, supervisor_id)
        except Exception:
            pass  # WS might not be connected
            
        return True

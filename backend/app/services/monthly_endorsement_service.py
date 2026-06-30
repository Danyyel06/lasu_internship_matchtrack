"""
Monthly Endorsement Service — compiles digests and dispatches notifications.
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.monthly_endorsement import MonthlyEndorsement, EndorsementAction
from app.models.application import Application
from app.models.notification import Notification


class MonthlyEndorsementService:

    @staticmethod
    async def dispatch_notifications(
        endorsement: MonthlyEndorsement,
        db: AsyncSession,
    ) -> None:
        """
        After an endorsement or flag is saved:
        - For endorsement: notify the student.
        - For flag: notify the Academic Supervisor with an early-warning alert.
        """
        from app.models.student import Student
        from app.models.user import User

        # Resolve application → student → academic supervisor
        app_res = await db.execute(
            select(Application).where(Application.id == endorsement.application_id)
        )
        application = app_res.scalar_one_or_none()
        if not application:
            return

        student_res = await db.execute(
            select(Student).where(Student.id == application.student_id)
        )
        student = student_res.scalar_one_or_none()
        if not student:
            return

        user_res = await db.execute(
            select(User).where(User.id == student.user_id)
        )
        student_user = user_res.scalar_one_or_none()
        student_name = f"{student_user.first_name} {student_user.last_name}" if student_user else "Student"

        if endorsement.action == EndorsementAction.endorsed:
            # Notify student
            notif = Notification(
                user_id=student.user_id,
                message=(
                    f"Your {endorsement.month_year} monthly report has been endorsed "
                    f"by your Industry Supervisor."
                ),
                is_read=False,
            )
            db.add(notif)

        elif endorsement.action == EndorsementAction.flagged:
            # Notify Academic Supervisor (if assigned)
            if application.academic_supervisor_id:
                alert_msg = (
                    f"ALERT: Industry Supervisor has flagged {student_name}'s "
                    f"{endorsement.month_year} monthly log. "
                    f"Comment: {endorsement.flag_comment or 'No comment provided.'}"
                )
                notif = Notification(
                    user_id=application.academic_supervisor_id,
                    message=alert_msg,
                    is_read=False,
                )
                db.add(notif)

            # Also notify student
            student_notif = Notification(
                user_id=student.user_id,
                message=(
                    f"Your {endorsement.month_year} monthly report has been flagged "
                    f"by your Industry Supervisor. Please check your dashboard."
                ),
                is_read=False,
            )
            db.add(student_notif)

        await db.commit()

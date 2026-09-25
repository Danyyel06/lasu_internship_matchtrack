import asyncio
from datetime import datetime, timezone, timedelta
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.user import User
from app.models.company import Company
from app.models.internship import Internship
from app.models.student import Student
from app.models.application import Application
from app.models.job_family import JobFamily
from app.models.head_of_department import HeadOfDepartment
from app.models.academic_supervisor_profile import AcademicSupervisorProfile
from app.models.weekly_log import WeeklyLog, Artifact, AIQuizAttempt, CheckInType
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def seed_tc_data():
    async with AsyncSessionLocal() as session:
        # 1. Ensure Job Family
        jf = await session.scalar(select(JobFamily).where(JobFamily.name == "Software and Technology"))
        if not jf:
            jf = JobFamily(name="Software and Technology", description="Tech", base_skills_weight=40, base_experience_weight=30, base_coursework_weight=30)
            session.add(jf)
            await session.flush()

        # 2. Company & Rep
        rep_email = "rep@companytc.com"
        rep_user = await session.scalar(select(User).where(User.email == rep_email))
        if not rep_user:
            rep_user = User(email=rep_email, password_hash=pwd_context.hash("Password@123"), role="company_rep", is_verified=True, first_name="Tom", last_name="Corp")
            session.add(rep_user)
            await session.flush()
            company = Company(user_id=rep_user.id, company_name="TC Solutions", industry="Software")
            session.add(company)
            await session.flush()
        else:
            company = await session.scalar(select(Company).where(Company.user_id == rep_user.id))

        # 3. Internship
        internship = await session.scalar(select(Internship).where(Internship.company_id == company.id, Internship.title == "QA Engineer Intern"))
        if not internship:
            internship = Internship(company_id=company.id, job_family_id=jf.id, title="QA Engineer Intern", description="Test things.", status="open", track_type="equity", accepted_tiers=["T1", "T2", "T3"])
            session.add(internship)
            await session.flush()

        # 4. HOD
        hod_email = "hod@lasutc.edu.ng"
        hod_user = await session.scalar(select(User).where(User.email == hod_email))
        if not hod_user:
            hod_user = User(email=hod_email, password_hash=pwd_context.hash("Password@123"), role="head_of_department", is_verified=True, first_name="Dr", last_name="Hod")
            session.add(hod_user)
            await session.flush()
            hod = HeadOfDepartment(user_id=hod_user.id, department="Computer Science", faculty="Science", is_admin_verified=True)
            session.add(hod)
            await session.flush()
        else:
            hod = await session.scalar(select(HeadOfDepartment).where(HeadOfDepartment.user_id == hod_user.id))

        # 5. Academic Supervisor
        acad_email = "acad_sup@lasutc.edu.ng"
        acad_user = await session.scalar(select(User).where(User.email == acad_email))
        if not acad_user:
            acad_user = User(email=acad_email, password_hash=pwd_context.hash("Password@123"), role="academic_supervisor", is_verified=True, first_name="Prof", last_name="Acad")
            session.add(acad_user)
            await session.flush()
            acad_prof = AcademicSupervisorProfile(user_id=acad_user.id, head_of_department_id=hod.id, department="Computer Science")
            session.add(acad_prof)
            await session.flush()

        # 6. Student
        student_email = "studenttc@lasutc.edu.ng"
        s_user = await session.scalar(select(User).where(User.email == student_email))
        if not s_user:
            s_user = User(email=student_email, password_hash=pwd_context.hash("Password@123"), role="student", is_verified=True, first_name="Sam", last_name="Tester")
            session.add(s_user)
            await session.flush()
            student = Student(user_id=s_user.id, matric_no="MATTC001", faculty="Science", department="Computer Science", level=400, cgpa=4.5, project_count=2, coursework_count=4)
            session.add(student)
            await session.flush()
        else:
            student = await session.scalar(select(Student).where(Student.user_id == s_user.id))

        # 7. Application (Accepted & Assigned)
        app_obj = await session.scalar(select(Application).where(Application.student_id == student.id, Application.internship_id == internship.id))
        if not app_obj:
            app_obj = Application(student_id=student.id, internship_id=internship.id, fit_score=85.0, tier_at_application="T1", status="accepted", academic_supervisor_id=acad_user.id)
            session.add(app_obj)
            await session.flush()
        else:
            app_obj.status = "accepted"
            app_obj.academic_supervisor_id = acad_user.id

        # 8. WeeklyLog & Artifacts & Quiz
        now = datetime.now(timezone.utc)
        week_num = now.isocalendar()[1]
        
        log = await session.scalar(select(WeeklyLog).where(WeeklyLog.application_id == app_obj.id, WeeklyLog.week_number == week_num))
        if not log:
            log = WeeklyLog(application_id=app_obj.id, week_number=week_num)
            session.add(log)
            await session.flush()
        
        log.wed_content = {"focus_area": "Learning QA automation", "core_action": "Wrote selenium tests", "the_blocker": "CSS selectors changing", "the_takeaway": "Use data-testid"}
        log.sat_content = {"focus_area": "Reviewing tests", "core_action": "Refactored test suite", "the_blocker": "None", "the_takeaway": "DRY principle"}
        log.wed_submitted_at = now - timedelta(days=3)
        log.sat_submitted_at = now - timedelta(days=1)
        await session.flush()

        # Artifacts
        wed_art = await session.scalar(select(Artifact).where(Artifact.weekly_log_id == log.id, Artifact.check_in_type == CheckInType.wednesday))
        if not wed_art:
            wed_art = Artifact(weekly_log_id=log.id, check_in_type=CheckInType.wednesday, photo_url="https://placehold.co/600x400/png?text=Wednesday+Photo", upload_source="camera")
            session.add(wed_art)
        
        sat_art = await session.scalar(select(Artifact).where(Artifact.weekly_log_id == log.id, Artifact.check_in_type == CheckInType.saturday))
        if not sat_art:
            sat_art = Artifact(weekly_log_id=log.id, check_in_type=CheckInType.saturday, photo_url="https://placehold.co/600x400/png?text=Saturday+Photo", upload_source="camera")
            session.add(sat_art)
        await session.flush()

        # Quiz
        quiz = await session.scalar(select(AIQuizAttempt).where(AIQuizAttempt.weekly_log_id == log.id))
        if not quiz:
            quiz = AIQuizAttempt(weekly_log_id=log.id)
            session.add(quiz)
            await session.flush()
        
        quiz.questions = [
            {"question": "What is the best way to select elements in testing?", "options": ["XPath", "CSS", "data-testid", "ID"]},
            {"question": "What principle helps reduce code duplication?", "options": ["SOLID", "DRY", "KISS", "YAGNI"]}
        ]
        quiz.correct_answers = [2, 1]
        quiz.student_answers = [2, 1]
        quiz.score = 2
        quiz.passed = True
        quiz.attempted_at = now

        await session.commit()
        print(f"✅ TC Seed data injected!")
        print(f"Academic Supervisor login: {acad_email} / Password@123")
        print(f"Student login: {student_email} / Password@123")

if __name__ == "__main__":
    asyncio.run(seed_tc_data())

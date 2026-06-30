import asyncio
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.user import User, UserRole
from app.models.company import Company
from app.models.internship import Internship, InternshipRequirement
from app.models.student import Student, StudentSkill
from app.models.application import Application
from app.models.job_family import JobFamily
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def seed_test_data():
    async with AsyncSessionLocal() as session:
        # 1. Get or Create a Company Rep User
        result = await session.execute(select(User).where(User.email == "rep@company.com"))
        rep_user = result.scalar_one_or_none()
        if not rep_user:
            rep_user = User(
                email="rep@company.com",
                password_hash=pwd_context.hash("Password@123"),
                role="company_rep",
                is_verified=True,
                first_name="Jane",
                last_name="Doe"
            )
            session.add(rep_user)
            await session.flush()
            
            company = Company(
                user_id=rep_user.id,
                company_name="Tech Innovators Inc",
                industry="Software",
            )
            session.add(company)
            await session.flush()
        else:
            company = await session.scalar(select(Company).where(Company.user_id == rep_user.id))

        # 2. Get a Job Family
        jf = await session.scalar(select(JobFamily).where(JobFamily.name == "Software and Technology"))
        
        # 3. Create an Internship
        internship = Internship(
            company_id=company.id,
            job_family_id=jf.id if jf else 1,
            title="Software Engineering Intern",
            description="Build cool things.",
            status="open",
            track_type="equity",
            accepted_tiers=["T1", "T2", "T3"],
        )
        session.add(internship)
        await session.flush()

        req1 = InternshipRequirement(internship_id=internship.id, skill_name="Python / programming basics", required_level=3, is_mandatory=True)
        req2 = InternshipRequirement(internship_id=internship.id, skill_name="Version Control (Git)", required_level=2, is_mandatory=False)
        session.add_all([req1, req2])
        await session.flush()

        # 4. Create Students (Varying CGPA and Skills to spread across T1, T2, T3)
        students_data = [
            ("student1@lasu.edu.ng", "Alice", 4.8, [{"name": "Python / programming basics", "verified_level": 4}, {"name": "Version Control (Git)", "verified_level": 3}]), # T1 / Competitive
            ("student2@lasu.edu.ng", "Bob", 4.2, [{"name": "Python / programming basics", "verified_level": 3}, {"name": "Version Control (Git)", "verified_level": 2}]), # T1 / Competitive
            ("student3@lasu.edu.ng", "Charlie", 3.0, [{"name": "Python / programming basics", "verified_level": 2}, {"name": "Version Control (Git)", "verified_level": 1}]), # T2 / Equity only
            ("student4@lasu.edu.ng", "David", 2.1, [{"name": "Python / programming basics", "verified_level": 1}, {"name": "Version Control (Git)", "verified_level": 1}]), # T3 / Equity only
            ("student5@lasu.edu.ng", "Eve", 1.8, [{"name": "Python / programming basics", "verified_level": 0}, {"name": "Version Control (Git)", "verified_level": 0}])  # T3 / Equity only
        ]

        for email, name, cgpa, skills in students_data:
            s_user = await session.scalar(select(User).where(User.email == email))
            if not s_user:
                s_user = User(
                    email=email,
                    password_hash=pwd_context.hash("Password@123"),
                    role="student",
                    is_verified=True,
                    first_name=name,
                    last_name="Student"
                )
                session.add(s_user)
                await session.flush()
                
                student = Student(
                    user_id=s_user.id,
                    matric_no=f"MAT{name}",
                    faculty="Science",
                    department="Computer Science",
                    level=400,
                    cgpa=cgpa,
                    project_count=2,
                    coursework_count=4
                )
                session.add(student)
                await session.flush()
                
                for s_data in skills:
                    ss = StudentSkill(student_id=student.id, skill_name=s_data["name"], verified_level=s_data["verified_level"])
                    session.add(ss)
                await session.flush()
            else:
                student = await session.scalar(select(Student).where(Student.user_id == s_user.id))

            # 5. Have them apply to the internship
            app = Application(
                student_id=student.id,
                internship_id=internship.id,
                status="pending"
            )
            session.add(app)

        await session.commit()
        
        print(f"Test Data Seeded!")
        print(f"Company Rep Email: rep@company.com / Password@123")
        print(f"Internship ID: {internship.id}")

if __name__ == "__main__":
    asyncio.run(seed_test_data())

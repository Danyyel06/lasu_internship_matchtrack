import asyncio
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.student import Student
from app.models.user import User
from app.models.head_of_department import HeadOfDepartment

async def main():
    async with AsyncSessionLocal() as session:
        applications = (await session.execute(select(Application))).scalars().all()
        print("--- APPLICATIONS ---")
        for a in applications:
            print(f"App ID={a.id}, Student ID={a.student_id}, Internship={a.internship_id}, Status={a.status}, Supervisor={a.academic_supervisor_id}")

if __name__ == "__main__":
    asyncio.run(main())

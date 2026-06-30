import asyncio
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.user import User, UserRole
from app.models.student import Student
from app.models.company import Company
from app.core.security import create_access_token, create_refresh_token

async def test():
    print("Starting test...")
    email = "stellaisokpehi21@student.lasu.edu.ng"
    async with AsyncSessionLocal() as db:
        print("Executing User select...")
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        print(f"User: {user}")
        
        is_onboarded = False
        company_name = None
        
        if user.role == UserRole.STUDENT:
            print("Executing Student select...")
            student_check = await db.execute(select(Student).where(Student.user_id == user.id))
            student = student_check.scalar_one_or_none()
            print(f"Student: {student}")
            if student and student.onboarding_completed_at is not None:
                is_onboarded = True
        elif user.role == UserRole.COMPANY_REP:
            print("Executing Company select...")
            company_check = await db.execute(select(Company).where(Company.user_id == user.id))
            company = company_check.scalar_one_or_none()
            print(f"Company: {company}")
            if company:
                company_name = company.company_name
                if company.industry is not None:
                    is_onboarded = True
                    
        print("Generating token...")
        token_data = {
            "sub": str(user.id),
            "role": user.role.value if isinstance(user.role, UserRole) else user.role,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "is_onboarded": is_onboarded,
            "company_name": company_name
        }
        access_token = create_access_token(data=token_data)
        print(f"Token: {access_token[:20]}...")
        print("Done!")

asyncio.run(test())

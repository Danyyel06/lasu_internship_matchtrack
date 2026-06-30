import asyncio
import argparse
import sys
import os

# Add the backend directory to the python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.user import User, UserRole
from app.models.academic_supervisor_profile import AcademicSupervisorProfile
from app.models.head_of_department import HeadOfDepartment
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def main():
    parser = argparse.ArgumentParser(description="Create an Academic Supervisor account for testing.")
    parser.add_argument("email", type=str, help="Email of the Academic Supervisor")
    parser.add_argument("--password", type=str, default="Password@123", help="Password for the account")
    args = parser.parse_args()

    async with AsyncSessionLocal() as session:
        # Check if user already exists
        stmt = select(User).where(User.email == args.email)
        result = await session.execute(stmt)
        existing_user = result.scalar_one_or_none()

        if existing_user:
            print(f"Error: User with email {args.email} already exists.")
            return

        # Create user
        user = User(
            email=args.email,
            password_hash=pwd_context.hash(args.password),
            role=UserRole.ACADEMIC_SUPERVISOR,
            is_verified=True,  # Bypass email activation
            first_name="Academic",
            last_name="Supervisor"
        )
        session.add(user)
        await session.flush()

        # Create academic supervisor profile
        profile = AcademicSupervisorProfile(
            user_id=user.id,
            head_of_department_id=1,
            department="Computer Science"
        )
        session.add(profile)
        await session.commit()

        print(f"\nSUCCESS! Academic Supervisor created.")
        print(f"------------------------------------")
        print(f"Login Email: {args.email}")
        print(f"Password:    {args.password}")
        print(f"------------------------------------")
        print(f"You can now log out of the HOD portal and log in as the Academic Supervisor to test the rest of Phase 5!")

if __name__ == "__main__":
    asyncio.run(main())

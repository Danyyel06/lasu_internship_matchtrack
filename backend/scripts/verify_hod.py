import asyncio
import argparse
import sys
import os

# Add the backend directory to sys.path so 'app' can be found
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.user import User
from app.models.head_of_department import HeadOfDepartment
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def main():
    parser = argparse.ArgumentParser(description="Verify a Head of Department.")
    parser.add_argument("email", type=str, help="Email of the HOD user")
    parser.add_argument("--password", type=str, default="Password@123", help="Optional password if creating a new account")
    args = parser.parse_args()

    async with AsyncSessionLocal() as session:
        # Find user
        stmt = select(User).where(User.email == args.email)
        result = await session.execute(stmt)
        user = result.scalar_one_or_none()

        if not user:
            print(f"User with email {args.email} not found. Creating test HOD account...")
            user = User(
                email=args.email,
                password_hash=pwd_context.hash(args.password),
                role="head_of_department",
                is_verified=True,
                first_name="Test",
                last_name="HOD"
            )
            session.add(user)
            await session.flush()
        else:
            # Update their password to match what they expect, just in case
            user.password_hash = pwd_context.hash(args.password)
            
        # Find HOD profile
        stmt = select(HeadOfDepartment).where(HeadOfDepartment.user_id == user.id)
        result = await session.execute(stmt)
        hod = result.scalar_one_or_none()

        if not hod:
            print(f"Creating Head of Department profile for {args.email}...")
            hod = HeadOfDepartment(
                user_id=user.id,
                department="Computer Science",
                faculty="Science",
                is_admin_verified=False
            )
            session.add(hod)
            await session.flush()

        hod.is_admin_verified = True
        await session.commit()
        print(f"Success: Head of Department {args.email} is now verified and ready for login.")

if __name__ == "__main__":
    asyncio.run(main())

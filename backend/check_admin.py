import asyncio
import sys
import os

current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

from app.db.session import AsyncSessionLocal
from app.models.user import User
from app.core.security import verify_password
from sqlalchemy import select

async def main():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.email == "admin@lasu.edu.ng"))
        user = result.scalar_one_or_none()
        if user:
            print(f"Found user: {user.email}")
            print(f"Role: {user.role}")
            print(f"Hash: {user.password_hash}")
            is_valid = verify_password("password123", user.password_hash)
            print(f"password123 is valid: {is_valid}")
            
            is_valid_admin = verify_password("admin123", user.password_hash)
            print(f"admin123 is valid: {is_valid_admin}")
        else:
            print("User admin@lasu.edu.ng NOT FOUND in DB.")
            
        print("\nAll users in DB:")
        result_all = await db.execute(select(User))
        for u in result_all.scalars():
            print(f"- {u.email} ({u.role})")

if __name__ == "__main__":
    asyncio.run(main())

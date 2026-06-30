import asyncio
import os
import sys

# Add the project root to python path so we can import 'app'
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import async_engine
from app.models.user import User
from app.core.security import hash_password

AsyncSessionLocal = sessionmaker(async_engine, class_=AsyncSession, expire_on_commit=False)

async def main():
    print("--- Create Super Admin ---")
    if len(sys.argv) == 5:
        email = sys.argv[1]
        password = sys.argv[2]
        first_name = sys.argv[3]
        last_name = sys.argv[4]
    else:
        email = input("Enter Super Admin Email: ")
        password = input("Enter Super Admin Password: ")
        first_name = input("Enter First Name: ")
        last_name = input("Enter Last Name: ")

    async with AsyncSessionLocal() as db:
        # Check if exists
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if user:
            print(f"User with email {email} already exists!")
            return
        
        # Create
        hashed_password = hash_password(password)
        new_super_admin = User(
            email=email,
            password_hash=hashed_password,
            role="super_admin",
            first_name=first_name,
            last_name=last_name,
            is_verified=True
        )
        db.add(new_super_admin)
        await db.commit()
        print(f"Success! Super Admin '{email}' created.")

if __name__ == "__main__":
    asyncio.run(main())

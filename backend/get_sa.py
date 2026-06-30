import asyncio
from app.db.session import AsyncSessionLocal
from sqlalchemy import select
from app.models.user import User
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def get_sa():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.role == 'super_admin'))
        users = result.scalars().all()
        if not users:
            print("No super_admin found. Creating one...")
            admin = User(
                email="admin@lasu.edu.ng",
                password_hash=pwd_context.hash("Admin@123"),
                role="super_admin",
                is_verified=True,
                first_name="Super",
                last_name="Admin"
            )
            session.add(admin)
            await session.commit()
            print("Created super_admin: admin@lasu.edu.ng / Admin@123")
        else:
            for u in users:
                print(f"Super Admin Found: {u.email}")
                # We will reset password so we know it
                u.password_hash = pwd_context.hash("Admin@123")
            await session.commit()
            print("Password reset to: Admin@123")

if __name__ == "__main__":
    asyncio.run(get_sa())

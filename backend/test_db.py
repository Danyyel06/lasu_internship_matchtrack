import asyncio
from app.db.session import AsyncSessionLocal
from app.models.user import User, UserRole
from sqlalchemy import select

async def main():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(User).where(User.role == UserRole.ACADEMIC_SUPERVISOR))
        users = res.scalars().all()
        for u in users:
            print(f"ID: {u.id}, Email: {u.email}, Name: {u.first_name} {u.last_name}")

if __name__ == "__main__":
    asyncio.run(main())

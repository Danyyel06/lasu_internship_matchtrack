import asyncio
from sqlalchemy import select, update
from app.db.session import async_session
from app.models.user import User
from app.core.security import hash_password

async def test():
    email = "stellaisokpehi21@student.lasu.edu.ng"
    new_password = hash_password("Password123!")
    async with async_session() as db:
        await db.execute(update(User).where(User.email == email).values(password_hash=new_password))
        await db.commit()
        print("Password reset successfully!")

asyncio.run(test())

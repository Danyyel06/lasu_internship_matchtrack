import asyncio
from app.db.session import AsyncSessionLocal
from app.models.user import User
from app.core.security import hash_password
from sqlalchemy import select

async def main():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.email == 'ifeoluwabankole@gmail.com'))
        user = result.scalar_one_or_none()
        if user:
            user.password_hash = hash_password('mypassword123')
            user.is_verified = True
            await session.commit()
            print("Successfully updated user.")
        else:
            print("User not found.")

if __name__ == "__main__":
    asyncio.run(main())

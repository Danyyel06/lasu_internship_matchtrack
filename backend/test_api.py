import asyncio
import httpx
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from app.models.user import User
from app.core.security import create_access_token

async def test():
    engine = create_async_engine("postgresql+asyncpg://postgres:11postgres26@localhost:5432/lasu_internship", echo=False)
    async_session = sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
    
    async with async_session() as db:
        user_res = await db.execute(select(User).where(User.id == 7))  # industry supervisor
        user = user_res.scalar_one_or_none()
        
    if not user:
        print("User 7 not found")
        return
        
    token = create_access_token(data={"sub": str(user.id), "role": user.role.value})
    
    async with httpx.AsyncClient() as client:
        url = "http://localhost:8000/api/v1/monthly-review/7/2026-07/digest"
        print("Fetching", url)
        res = await client.get(url, headers={"Authorization": f"Bearer {token}"})
        print(res.status_code)
        print(res.text)

if __name__ == "__main__":
    asyncio.run(test())

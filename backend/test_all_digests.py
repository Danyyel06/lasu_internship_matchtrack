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
        # Get pending
        res = await client.get("http://localhost:8000/api/v1/monthly-review/pending", headers={"Authorization": f"Bearer {token}"})
        print("Pending:", res.status_code, res.text)
        if res.status_code == 200 and len(res.json()) > 0:
            for pending in res.json():
                student_id = pending["student_id"]
                month_year = pending["month_year"]
                
                digest_url = f"http://localhost:8000/api/v1/monthly-review/{student_id}/{month_year}/digest"
                print("Fetching", digest_url)
                digest_res = await client.get(digest_url, headers={"Authorization": f"Bearer {token}"})
                print("Digest status:", digest_res.status_code)
                if digest_res.status_code != 200:
                    print("Digest body:", digest_res.text)

if __name__ == "__main__":
    asyncio.run(test())

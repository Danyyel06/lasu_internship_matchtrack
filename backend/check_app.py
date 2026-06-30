import asyncio
import sys
import os

sys.path.append(os.path.abspath('c:/Users/User/lasu-internship-platform/backend'))
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.future import select
from app.models.application import Application
from app.core.config import settings

async def run():
    engine = create_async_engine(settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://"))
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as db:
        res = await db.execute(select(Application).where(Application.status == 'accepted'))
        for app in res.scalars().all():
            print(f"App {app.id}: student={app.student_id}, acad_sup={app.academic_supervisor_id}")

if __name__ == "__main__":
    asyncio.run(run())

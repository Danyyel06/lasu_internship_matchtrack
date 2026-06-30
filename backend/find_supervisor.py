import asyncio
import sys
import os

sys.path.append(os.path.abspath('c:/Users/User/lasu-internship-platform/backend'))
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.future import select
from app.models.user import User
from app.models.student import Student
from app.models.application import Application
from app.core.config import settings

async def run():
    engine = create_async_engine(settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://"))
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as db:
        # Get Isokpehi
        result = await db.execute(select(User).where(User.first_name == 'Isokpehi'))
        isokpehi = result.scalars().first()
        
        student_query = await db.execute(select(Student).where(Student.user_id == isokpehi.id))
        student = student_query.scalars().first()
        
        # Get Application
        app_query = await db.execute(select(Application).where(Application.student_id == student.id, Application.status == 'accepted'))
        application = app_query.scalars().first()
        
        if application and application.industry_supervisor_id:
            sup_query = await db.execute(select(User).where(User.id == application.industry_supervisor_id))
            supervisor = sup_query.scalars().first()
            print(f"Industry Supervisor: {supervisor.first_name} {supervisor.last_name} ({supervisor.email})")
        else:
            print("No industry supervisor assigned yet.")

if __name__ == "__main__":
    asyncio.run(run())

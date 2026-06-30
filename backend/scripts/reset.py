import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import asyncio
from sqlalchemy import select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import async_engine
from app.models.user import User
from app.core.security import hash_password

AsyncSessionLocal = sessionmaker(async_engine, class_=AsyncSession, expire_on_commit=False)

async def reset():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.email == 'admin@lasu.edu.ng'))
        user = result.scalar_one_or_none()
        if user:
            user.password_hash = hash_password('admin123')
            await db.commit()
            print('Password reset to admin123!')
        else:
            print('User not found!')

asyncio.run(reset())

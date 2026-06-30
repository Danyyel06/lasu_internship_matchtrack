import asyncio
import os
import sys

from sqlalchemy import select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import async_engine
from app.models.user import User

AsyncSessionLocal = sessionmaker(async_engine, class_=AsyncSession, expire_on_commit=False)

async def main():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User))
        for u in result.scalars().all():
            print(f"ID: {u.id}, Email: {u.email}, Role: {u.role}")

if __name__ == "__main__":
    asyncio.run(main())

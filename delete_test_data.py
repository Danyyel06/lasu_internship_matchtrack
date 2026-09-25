import asyncio
import sys
import os

# Add the backend directory to sys.path
sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))

from app.db.session import AsyncSessionLocal
from app.models.user import User
from sqlalchemy import select

async def main():
    async with AsyncSessionLocal() as session:
        # Delete Sam Tester
        stmt = select(User).where(User.first_name.ilike('%Sam%'), User.last_name.ilike('%Tester%'))
        sam = (await session.execute(stmt)).scalars().first()
        if sam:
            print(f"Deleting {sam.first_name} {sam.last_name}")
            await session.delete(sam)
            
        # Delete prof acad
        stmt = select(User).where(User.first_name.ilike('%prof%'), User.last_name.ilike('%acad%'))
        prof = (await session.execute(stmt)).scalars().first()
        if prof:
            print(f"Deleting {prof.first_name} {prof.last_name}")
            await session.delete(prof)

        await session.commit()

if __name__ == "__main__":
    asyncio.run(main())

import asyncio
import os
import sys

# Ensure backend dir is in path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.db.session import async_engine

async def reset_skills():
    async with async_engine.begin() as conn:
        print("Resetting cooldowns and statuses...")
        await conn.execute(text("UPDATE student_skills SET cooldown_until = NULL, verification_status = 'unverified';"))
        
        print("Clearing attempts...")
        await conn.execute(text("DELETE FROM skill_verification_attempts;"))
        
        print("Clearing generated questions...")
        await conn.execute(text("DELETE FROM skill_verification_questions;"))
        
        print("Committing...")
    print("Skills reset successfully!")
    await async_engine.dispose()

if __name__ == "__main__":
    asyncio.run(reset_skills())

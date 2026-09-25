import asyncio
from app.db.session import async_engine
from sqlalchemy import text

async def main():
    async with async_engine.connect() as conn:
        # Fix Finance and Accounting: was 50/20/0/30, now 45/20/10/25 = 100
        await conn.execute(text("""
            UPDATE job_families
            SET default_weights = '{"cgpa": 45, "skills": 20, "project": 10, "coursework": 25}'::jsonb
            WHERE name = 'Finance and Accounting'
        """))
        # Fix Legal and Compliance: was 60/10/0/30, now 55/10/5/30 = 100
        await conn.execute(text("""
            UPDATE job_families
            SET default_weights = '{"cgpa": 55, "skills": 10, "project": 5, "coursework": 30}'::jsonb
            WHERE name = 'Legal and Compliance'
        """))
        await conn.commit()
        print("Updated successfully. Verifying...")
        r = await conn.execute(text("SELECT name, default_weights FROM job_families WHERE name IN ('Finance and Accounting', 'Legal and Compliance')"))
        for row in r:
            print(row)

asyncio.run(main())

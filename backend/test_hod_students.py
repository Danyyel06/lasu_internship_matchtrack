import asyncio
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.user import User
from app.api.v1.endpoints.hod import get_department_students, get_department_supervisors

async def main():
    async with AsyncSessionLocal() as db:
        hod_user = (await db.execute(select(User).where(User.email == 'rajilawal@lasu.edu.ng'))).scalar_one_or_none()
        
        try:
            print("Fetching supervisors...")
            sups = await get_department_supervisors(current_user=hod_user, db=db)
            print("Supervisors:", sups)
        except Exception as e:
            print("Supervisors Error:", e)
            import traceback
            traceback.print_exc()

        try:
            print("Fetching students...")
            students = await get_department_students(current_user=hod_user, db=db)
            print("Students:", students)
        except Exception as e:
            print("Students Error:", e)
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())

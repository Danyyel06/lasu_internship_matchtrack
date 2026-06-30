import asyncio
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.user import User
from app.api.v1.endpoints.academic_supervisors import get_assigned_students

async def main():
    async with AsyncSessionLocal() as db:
        user = (await db.execute(select(User).where(User.email == 'droseni@gmail.com'))).scalar_one_or_none()
        if not user:
            print("User droseni@gmail.com not found!")
            return
            
        print("User ID:", user.id)
        
        try:
            students = await get_assigned_students(current_user=user, db=db)
            print("Students:", students)
        except Exception as e:
            print("Error fetching students:", e)
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())

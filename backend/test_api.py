import asyncio
from app.db.session import AsyncSessionLocal
from app.models.user import User
from sqlalchemy import select
from app.core.security import create_access_token
import urllib.request
import json

async def main():
    async with AsyncSessionLocal() as db:
        user = (await db.execute(select(User).where(User.email == 'droseni@gmail.com'))).scalar_one_or_none()
        if not user:
            print("User not found!")
            return
        token = create_access_token(data={"sub": str(user.id)})
    
    req = urllib.request.Request(
        'http://localhost:8000/api/v1/academic-supervisors/frameworks',
        headers={'Authorization': f'Bearer {token}'}
    )
    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            print("Status Code:", response.status)
            print("Response:", data)
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    asyncio.run(main())

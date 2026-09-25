import asyncio
from app.db.session import async_engine
from sqlalchemy import text

async def main():
    async with async_engine.connect() as conn:
        r = await conn.execute(text("SELECT key, value FROM system_settings"))
        for row in r:
            print(row)

asyncio.run(main())

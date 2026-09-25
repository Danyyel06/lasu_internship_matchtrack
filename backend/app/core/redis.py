import redis.asyncio as redis
from app.core.config import settings

redis_client = None

async def init_redis():
    global redis_client
    redis_url = getattr(settings, "REDIS_URL", "redis://localhost:6379/0")
    try:
        if redis_url.startswith("rediss://"):
            redis_client = redis.from_url(redis_url, decode_responses=True, ssl_cert_reqs=None)
        else:
            redis_client = redis.from_url(redis_url, decode_responses=True)
    except Exception as e:
        print(f"Warning: Redis initialization failed ({e}). Proceeding with fallback.")
        redis_client = None

async def close_redis():
    global redis_client
    if redis_client:
        await redis_client.close()

def get_redis() -> redis.Redis:
    return redis_client

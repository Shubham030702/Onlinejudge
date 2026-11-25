import redis.asyncio as aioredis
from app.config import settings

redis_client: aioredis.Redis | None = None


async def connect_redis() -> aioredis.Redis | None:
    """Initialize Redis connection, falling back gracefully if unavailable."""
    global redis_client
    try:
        client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
        await client.ping()
        redis_client = client
        print("Redis connected")
        return redis_client
    except Exception as exc:
        print(f"Redis Connection Refused. Running without Redis cache. {exc}")
        redis_client = None
        return None


async def close_redis() -> None:
    """Close the Redis connection if open."""
    global redis_client
    if redis_client is not None:
        await redis_client.aclose()
        redis_client = None


def get_redis() -> aioredis.Redis | None:
    return redis_client

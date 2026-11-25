from app.services.redis_client import get_redis


def _contest_key(contest_id: str) -> str:
    return f"contest:{contest_id}"


def _hash_key(contest_id: str, user_id: str) -> str:
    return f"{_contest_key(contest_id)}:user:{user_id}"


def _set_key(contest_id: str) -> str:
    return f"{_contest_key(contest_id)}:users"


def _leader_key(contest_id: str) -> str:
    return f"{_contest_key(contest_id)}:leaderboard"


async def add_redis(contest_id: str, user_id: str, username: str, email: str) -> dict | None:
    client = get_redis()
    if client is None:
        return None
    try:
        await client.hset(
            _hash_key(contest_id, user_id),
            mapping={
                "userId": user_id,
                "username": username,
                "email": email,
                "score": 0,
                "penalty": 0,
            },
        )
        await client.sadd(_set_key(contest_id), user_id)
        await client.zadd(_leader_key(contest_id), {user_id: 0})
        return {"message": "User is successfully added."}
    except Exception as exc:
        print(exc)
        return None


async def chk_user(contest_id: str, user_id: str) -> bool:
    client = get_redis()
    if client is None:
        return False
    exists = await client.sismember(_set_key(contest_id), user_id)
    return bool(exists)


async def incrz_score(contest_id: str, user_id: str, score: float | int) -> dict:
    client = get_redis()
    if client is None:
        return {"newScore": 0}
    new_score = await client.zincrby(_leader_key(contest_id), score, user_id)
    await client.hincrbyfloat(_hash_key(contest_id, user_id), "score", score)
    return {"newScore": new_score}


async def incrz_penalty(contest_id: str, user_id: str, penalty: int = 1) -> dict:
    client = get_redis()
    if client is None:
        return {"penaltyAdded": penalty}
    await client.hincrby(_hash_key(contest_id, user_id), "penalty", penalty)
    return {"penaltyAdded": penalty}


async def get_leaderboard(contest_id: str, top: int = 10) -> list[dict]:
    client = get_redis()
    if client is None:
        return []
    raw = await client.zrevrange(_leader_key(contest_id), 0, top - 1, withscores=True)
    result = []
    for user_id, score in raw:
        user = await client.hgetall(_hash_key(contest_id, user_id))
        result.append(
            {
                "rank": len(result) + 1,
                "username": user.get("username") or None,
                "score": float(score) if not float(score).is_integer() else int(score),
                "penalty": user.get("penalty"),
                "userId": user_id,
            }
        )
    return result

from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.database import get_db, serialize_doc, to_object_id
from app.services import redis_code
from app.session import is_logged_in

router = APIRouter()


class ContestRegisterRequest(BaseModel):
    contestId: str


class ScoreRequest(BaseModel):
    contestId: str
    userId: str
    score: float | int


class PenaltyRequest(BaseModel):
    contestId: str
    userId: str
    penalty: int = 1


@router.get("/api/contest")
async def get_contests(session_user: dict = Depends(is_logged_in)):
    db = get_db()
    try:
        contests = [doc async for doc in db["contests"].find()]
        return serialize_doc(contests)
    except Exception as exc:
        return JSONResponse(status_code=500, content={"message": str(exc)})


@router.get("/api/contest/{contest_id}")
async def get_contest(contest_id: str, session_user: dict = Depends(is_logged_in)):
    db = get_db()
    try:
        oid = to_object_id(contest_id)
        if oid is None:
            return {"error": "Invalid contest id"}
        contest = await db["contests"].find_one({"_id": oid})
        if contest and contest.get("problems"):
            prob_cursor = db["problems"].find({"_id": {"$in": contest["problems"]}})
            prob_map = {p["_id"]: p async for p in prob_cursor}
            contest["problems"] = [prob_map[pid] for pid in contest["problems"] if pid in prob_map]

        exists = await redis_code.chk_user(contest_id, str(session_user["id"]))
        return {"contest": serialize_doc(contest), "exists": exists}
    except Exception as exc:
        return {"error": str(exc)}


@router.post("/contest/register")
async def register_contest(body: ContestRegisterRequest, session_user: dict = Depends(is_logged_in)):
    db = get_db()
    user_oid = to_object_id(session_user["id"])
    user = await db["users"].find_one({"_id": user_oid}) if user_oid else None
    if not user:
        return JSONResponse(status_code=404, content={"message": "User not found"})
    result = await redis_code.add_redis(
        body.contestId,
        str(user["_id"]),
        user["Username"],
        user["Email"],
    )
    return result


@router.post("/contest/IncrzScore")
async def increase_score(body: ScoreRequest):
    result = await redis_code.incrz_score(body.contestId, body.userId, body.score)
    return {"score": result["newScore"]}


@router.post("/contest/IncrzPenalty")
async def increase_penalty(body: PenaltyRequest):
    result = await redis_code.incrz_penalty(body.contestId, body.userId, body.penalty)
    return {"penaltyAdded": result["penaltyAdded"]}


@router.get("/contest/GetLeaderBoard")
async def get_contest_leaderboard(
    request: Request,
    contestId: str | None = Query(default=None),
):
    cid = contestId
    if not cid:
        try:
            body = await request.json()
            cid = body.get("contestId")
        except Exception:
            cid = None
    if not cid:
        return []
    return await redis_code.get_leaderboard(cid, 10)

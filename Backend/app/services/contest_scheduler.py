from datetime import datetime, timezone
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.database import get_db

_scheduler: AsyncIOScheduler | None = None


async def _update_contest_statuses() -> None:
    now_iso = datetime.now(timezone.utc).isoformat()
    try:
        db = get_db()
        contests_col = db["contests"]
        problems_col = db["problems"]

        upcoming = [
            doc
            async for doc in contests_col.find(
                {"starttime": {"$lte": now_iso}, "status": "Upcoming"}
            )
        ]
        for contest in upcoming:
            await contests_col.update_one(
                {"_id": contest["_id"]},
                {"$set": {"status": "Running"}},
            )
            print(f"Contest {contest.get('contestNo')} is now Running")

        await contests_col.update_many(
            {"endtime": {"$lte": now_iso}, "status": "Running"},
            {"$set": {"status": "Ended"}},
        )

        ended_contests = [
            doc
            async for doc in contests_col.find(
                {"endtime": {"$lte": now_iso}, "status": "Ended", "processed": False}
            )
        ]
        for cont in ended_contests:
            await problems_col.update_many(
                {"contestId": cont["_id"]},
                {"$set": {"contestOnly": False}},
            )

        await contests_col.update_many(
            {"endtime": {"$lte": now_iso}, "status": "Ended", "processed": False},
            {"$set": {"processed": True}},
        )
    except Exception as exc:
        print(f"Cron job error: {exc}")


def start_contest_cron() -> None:
    global _scheduler
    if _scheduler is None:
        _scheduler = AsyncIOScheduler()
        _scheduler.add_job(_update_contest_statuses, "interval", minutes=1, id="contest_status_cron")
        _scheduler.start()


def stop_contest_cron() -> None:
    global _scheduler
    if _scheduler is not None:
        _scheduler.shutdown(wait=False)
        _scheduler = None

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from app.config import settings
from app.database import close_db, connect_db
from app.routes import auth, contest, problem
from app.services.contest_scheduler import start_contest_cron, stop_contest_cron
from app.services.redis_client import close_redis, connect_redis
from app.session import MongoSessionMiddleware


@asynccontextmanager
async def lifespan(_app: FastAPI):
    await connect_db()
    await connect_redis()
    start_contest_cron()
    yield
    stop_contest_cron()
    await close_redis()
    await close_db()


app = FastAPI(title="OnlineJudge API", lifespan=lifespan)

app.add_middleware(MongoSessionMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(problem.router)
app.include_router(contest.router)


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=settings.PORT, reload=True)

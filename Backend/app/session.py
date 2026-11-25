import secrets
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException, Request, Response
from itsdangerous import BadSignature, URLSafeSerializer
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import settings
from app.database import get_db

SESSION_COOKIE_NAME = "connect.sid"
SESSION_TTL_SECONDS = 24 * 60 * 60  # 24 hours

_serializer = URLSafeSerializer(settings.SECRET_KEY, salt="session-cookie")


def _sign_session_id(session_id: str) -> str:
    return _serializer.dumps(session_id)


def _unsign_session_id(cookie_value: str) -> str | None:
    try:
        return _serializer.loads(cookie_value)
    except BadSignature:
        return None


class MongoSessionMiddleware(BaseHTTPMiddleware):
    """Cookie-based session middleware backed by MongoDB, matching express-session behavior."""

    async def dispatch(self, request: Request, call_next):
        db = get_db()
        sessions_col = db["sessions"]

        session_id: str | None = None
        session_data: dict = {}
        cookie_val = request.cookies.get(SESSION_COOKIE_NAME)

        if cookie_val:
            session_id = _unsign_session_id(cookie_val)
            if session_id:
                doc = await sessions_col.find_one({"_id": session_id})
                if doc:
                    expires_at = doc.get("expiresAt")
                    if expires_at is None or expires_at.replace(tzinfo=timezone.utc) > datetime.now(timezone.utc):
                        session_data = doc.get("session", {})
                    else:
                        await sessions_col.delete_one({"_id": session_id})
                        session_id = None
                else:
                    session_id = None

        request.state.session = session_data
        request.state.session_id = session_id
        request.state.session_modified = False
        request.state.session_destroyed = False

        response: Response = await call_next(request)

        if request.state.session_destroyed:
            if session_id:
                await sessions_col.delete_one({"_id": session_id})
            response.delete_cookie(SESSION_COOKIE_NAME, path="/")
        elif request.state.session_modified:
            if not session_id:
                session_id = secrets.token_urlsafe(32)
            expires_at = datetime.now(timezone.utc) + timedelta(seconds=SESSION_TTL_SECONDS)
            await sessions_col.update_one(
                {"_id": session_id},
                {"$set": {"session": request.state.session, "expiresAt": expires_at}},
                upsert=True,
            )
            response.set_cookie(
                key=SESSION_COOKIE_NAME,
                value=_sign_session_id(session_id),
                max_age=SESSION_TTL_SECONDS,
                httponly=True,
                secure=False,
                samesite="lax",
                path="/",
            )

        return response


def set_session_user(request: Request, user_payload: dict) -> None:
    request.state.session["user"] = user_payload
    request.state.session_modified = True


def destroy_session(request: Request) -> None:
    request.state.session = {}
    request.state.session_destroyed = True


def get_session_user(request: Request) -> dict | None:
    return getattr(request.state, "session", {}).get("user")


async def is_logged_in(request: Request) -> dict:
    """FastAPI dependency equivalent to authMiddleware.js isLoggedIn."""
    user = get_session_user(request)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Please log in to access this resource.",
        )
    return user

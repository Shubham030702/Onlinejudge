import random
import re
from datetime import datetime, timezone
from email.message import EmailMessage

import aiosmtplib
import bcrypt
from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.config import settings
from app.database import get_db, serialize_doc, to_object_id
from app.session import destroy_session, get_session_user, is_logged_in, set_session_user

router = APIRouter()

EMAIL_REGEX = re.compile(r"^\S+@\S+\.\S+$")


class OtpManagerRequest(BaseModel):
    email: str


class OtpVerifyRequest(BaseModel):
    email: str
    otp: str


class SignupRequest(BaseModel):
    Email: str
    Username: str
    Password: str


class LoginRequest(BaseModel):
    Email: str
    Password: str


async def send_otp_email(email: str, otp: str) -> None:
    msg = EmailMessage()
    msg["From"] = f'"AceCode" <{settings.EMAIL_USER}>'
    msg["To"] = email
    msg["Subject"] = "Authentication to AceCode via OTP"
    msg.set_content("Hello User")
    msg.add_alternative(
        f"""<h2>🔐 AceCode OTP Verification</h2>
      <p>Your One-Time Password (OTP) is:</p>
      <h3 style="color: #2e86de;">{otp}</h3>
      <p>This code will expire in <strong>5 minutes</strong>.</p>
      <p>Please do not share this OTP with anyone.</p>
      <br>
      <p>— Team AceCode</p>""",
        subtype="html",
    )

    await aiosmtplib.send(
        msg,
        hostname="smtp.gmail.com",
        port=587,
        start_tls=True,
        username=settings.EMAIL_USER,
        password=settings.EMAIL_PASS,
    )


@router.get("/api/checkUser")
async def check_user(request: Request):
    if get_session_user(request):
        return {"Success": True, "message": "User was already logged in!"}
    return {"Success": False, "message": "User was not already logged in!"}


@router.post("/api/otpManager")
async def otp_manager(body: OtpManagerRequest):
    db = get_db()
    try:
        if not EMAIL_REGEX.match(body.email):
            return {"success": False, "message": "Please enter a valid email address"}

        exist = await db["users"].find_one({"Email": body.email})
        if exist:
            return {"success": False, "message": "This Email is already in use!"}

        await db["otps"].delete_many({"email": body.email})
        otp_generated = str(random.randint(100000, 999999))
        await db["otps"].insert_one(
            {
                "email": body.email,
                "otp": otp_generated,
                "createdAt": datetime.now(timezone.utc),
            }
        )
        await send_otp_email(body.email, otp_generated)
        return {"success": True, "message": "Otp sent successfully"}
    except Exception as exc:
        return {"success": False, "message": str(exc)}


@router.post("/api/otpVerify")
async def otp_verify(body: OtpVerifyRequest):
    db = get_db()
    try:
        result = await db["otps"].find_one({"email": body.email})
        if result and body.otp == result.get("otp"):
            return {"success": True, "message": "Otp is verified!"}
        return {"success": False, "message": "Incorrect Otp!"}
    except Exception as exc:
        return {"success": False, "message": str(exc)}


@router.post("/api/signup")
async def signup(body: SignupRequest):
    db = get_db()
    try:
        if not EMAIL_REGEX.match(body.Email):
            return JSONResponse(status_code=400, content={"message": "Please enter a valid email address"})
        if len(body.Password) < 6:
            return JSONResponse(status_code=400, content={"message": "Password must be at least 6 characters"})

        existing_user = await db["users"].find_one({"Username": body.Username})
        existing_email = await db["users"].find_one({"Email": body.Email})
        if existing_user or existing_email:
            return JSONResponse(status_code=409, content={"message": "Username or Email already taken!"})

        hashed = bcrypt.hashpw(body.Password.encode("utf-8"), bcrypt.gensalt(10)).decode("utf-8")
        now = datetime.now(timezone.utc)
        await db["users"].insert_one(
            {
                "Username": body.Username,
                "Email": body.Email,
                "Password": hashed,
                "Submissions": [],
                "Rating": 1500,
                "createdAt": now,
                "updatedAt": now,
            }
        )
        return JSONResponse(status_code=201, content={"message": "User created successfully"})
    except Exception as exc:
        return JSONResponse(status_code=500, content={"message": str(exc)})


@router.post("/api/login")
async def login(request: Request, body: LoginRequest):
    db = get_db()
    try:
        user = await db["users"].find_one({"Email": body.Email})
        if not user:
            return JSONResponse(
                status_code=500,
                content={"message": "Email is not registered! Please sign up."},
            )

        is_match = bcrypt.checkpw(
            body.Password.encode("utf-8"),
            user["Password"].encode("utf-8"),
        )
        if not is_match:
            return JSONResponse(status_code=401, content={"message": "Incorrect password"})

        set_session_user(
            request,
            {
                "id": str(user["_id"]),
                "submission": serialize_doc(user.get("Submissions", [])),
            },
        )
        return JSONResponse(status_code=201, content={"message": "User logged in successfully"})
    except Exception as exc:
        return JSONResponse(status_code=500, content={"message": str(exc)})


@router.get("/api/logout")
async def logout(request: Request):
    destroy_session(request)
    return JSONResponse(status_code=200, content={"message": "User logged out"})


@router.get("/api/userdata")
async def get_userdata(session_user: dict = Depends(is_logged_in)):
    db = get_db()
    uid = to_object_id(session_user["id"])
    if uid is None:
        return JSONResponse(status_code=401, content={"message": "user not found"})

    user = await db["users"].find_one({"_id": uid}, {"Password": 0})
    if not user:
        return JSONResponse(status_code=401, content={"message": "user not found"})

    submissions = user.get("Submissions", [])
    problem_ids = [s["Problem"] for s in submissions if s.get("Problem")]
    if problem_ids:
        problems_cursor = db["problems"].find({"_id": {"$in": problem_ids}})
        problems_map = {p["_id"]: p async for p in problems_cursor}
        for sub in submissions:
            prob_id = sub.get("Problem")
            if prob_id in problems_map:
                sub["Problem"] = problems_map[prob_id]

    return serialize_doc(user)


@router.get("/api/leaderboard")
async def get_leaderboard(session_user: dict = Depends(is_logged_in)):
    db = get_db()
    try:
        cursor = db["users"].find({}, {"Username": 1, "Rating": 1}).sort("Rating", -1)
        users = [doc async for doc in cursor]
        user_id_str = str(session_user["id"])
        rank = 0
        for idx, u in enumerate(users):
            if str(u["_id"]) == user_id_str:
                rank = idx + 1
                break
        return {"response": serialize_doc(users), "rank": rank}
    except Exception:
        return JSONResponse(status_code=500, content={"error": "Failed to fetch leaderboard"})


@router.get("/profile")
async def get_profile(session_user: dict = Depends(is_logged_in)):
    db = get_db()
    try:
        uid = to_object_id(session_user["id"])
        user = await db["users"].find_one({"_id": uid})
        return serialize_doc(user)
    except Exception:
        return JSONResponse(
            status_code=500,
            content={"error": "An error occurred while Extracting the data."},
        )

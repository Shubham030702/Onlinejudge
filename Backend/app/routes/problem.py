import base64
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.database import get_db, serialize_doc, to_object_id
from app.services.judge0 import CodeSubmission
from app.session import is_logged_in

router = APIRouter()
submission_client = CodeSubmission()


class ProblemDesc(BaseModel):
    id: str
    Language: int
    LanguageName: str
    Code: str


class SubmissionRequest(BaseModel):
    problemdesc: ProblemDesc


def _to_b64(text: str) -> str:
    return base64.b64encode((text or "").encode("utf-8")).decode("utf-8")


async def _evaluate_test_cases(
    test_cases: list[dict],
    language_id: int,
    code_b64: str,
) -> dict:
    total_time = 0.0
    for tc in test_cases:
        inp = tc.get("input", "")
        out = tc.get("output") or ""
        inp_b64 = _to_b64(inp)
        out_b64 = _to_b64(out)
        try:
            result = await submission_client.evaluation(inp_b64, language_id, out_b64, code_b64)
            if not result:
                return {"status": "Runtime Error", "time": total_time}
            stdout_b64 = result.get("stdout") or ""
            decode = base64.b64decode(stdout_b64).decode("utf-8", errors="replace") if stdout_b64 else ""
            total_time += float(result.get("time") or 0)
            status_id = result.get("status", {}).get("id", 0)
            if status_id > 3:
                return {
                    "result": result,
                    "output": out,
                    "input": inp,
                    "decode": decode,
                }
        except Exception as exc:
            print(exc)
            return {"status": "Runtime Error", "time": total_time}
    return {"status": "Accepted", "time": total_time}


@router.get("/api/problems")
async def get_problems(session_user: dict = Depends(is_logged_in)):
    db = get_db()
    try:
        problems = [doc async for doc in db["problems"].find({"contestOnly": False})]
        uid = to_object_id(session_user["id"])
        userdata = await db["users"].find_one({"_id": uid}) if uid else None

        submissions = userdata.get("Submissions", []) if userdata else []
        attempted = [str(item["Problem"]) for item in submissions if item.get("Problem")]
        solved = [
            str(item["Problem"])
            for item in submissions
            if item.get("Problem") and item.get("Status") in ("Accepted", "accepted")
        ]
        if not problems:
            return JSONResponse(status_code=404, content={"message": "No problems found"})
        return {
            "problems": serialize_doc(problems),
            "attempted": attempted,
            "solved": solved,
        }
    except Exception as exc:
        return JSONResponse(status_code=500, content={"message": str(exc)})


@router.get("/api/problem/{problem_id}")
async def get_problem(problem_id: str, session_user: dict = Depends(is_logged_in)):
    db = get_db()
    try:
        oid = to_object_id(problem_id)
        if oid is None:
            return JSONResponse(status_code=404, content={"message": "Problem not found"})
        problem = await db["problems"].find_one({"_id": oid})
        if not problem:
            return JSONResponse(status_code=404, content={"message": "Problem not found"})
        return serialize_doc(problem)
    except Exception as exc:
        return JSONResponse(status_code=500, content={"message": str(exc)})


@router.post("/api/submission")
async def submit_code(body: SubmissionRequest, session_user: dict = Depends(is_logged_in)):
    db = get_db()
    desc = body.problemdesc
    prob_oid = to_object_id(desc.id)
    user_oid = to_object_id(session_user["id"])

    problem = await db["problems"].find_one({"_id": prob_oid}) if prob_oid else None
    userdata = await db["users"].find_one({"_id": user_oid}) if user_oid else None
    if not problem or not userdata:
        return JSONResponse(
            status_code=404,
            content={"error": "Problem, contest, or user not found."},
        )

    prerequisites = problem.get("prerequisites") or []
    if prerequisites:
        solved_ids = {
            str(sub["Problem"])
            for sub in userdata.get("Submissions", [])
            if sub.get("Status") == "Accepted" and sub.get("Problem")
        }
        unmet = [str(pid) for pid in prerequisites if str(pid) not in solved_ids]
        if unmet:
            return JSONResponse(
                status_code=403,
                content={
                    "error": "Prerequisites not met",
                    "message": "You must solve all prerequisite problems before attempting this one.",
                    "unmet": unmet,
                },
            )

    boilerplate = (problem.get("boilerplateFull") or {}).get(desc.LanguageName, "")
    full_code = boilerplate.replace("## Enter Code Here ##", desc.Code)
    code_b64 = _to_b64(full_code)

    try:
        result = await _evaluate_test_cases(problem.get("testCases", []), desc.Language, code_b64)
        if result.get("status") == "Accepted":
            status_text = (
                result["result"]["status"]["description"]
                if result.get("result")
                else result["status"]
            )
            now = datetime.now(timezone.utc)
            await db["users"].update_one(
                {"_id": user_oid},
                {
                    "$push": {
                        "Submissions": {
                            "Problem": problem["_id"],
                            "Status": status_text,
                            "Solution": desc.Code,
                            "Time": now,
                        }
                    }
                },
            )
            await db["problems"].update_one(
                {"_id": prob_oid},
                {
                    "$push": {
                        "users": {
                            "user": user_oid,
                            "Username": userdata["Username"],
                            "Status": status_text,
                            "Solution": desc.Code,
                            "Time": now,
                        }
                    }
                },
            )
        return result
    except Exception as exc:
        print(exc)
        return JSONResponse(
            status_code=500,
            content={"error": "An error occurred while evaluating submissions."},
        )


@router.post("/api/runprob")
async def run_problem(body: SubmissionRequest):
    db = get_db()
    desc = body.problemdesc
    prob_oid = to_object_id(desc.id)
    problem = await db["problems"].find_one({"_id": prob_oid}) if prob_oid else None
    if not problem:
        return JSONResponse(status_code=404, content={"error": "Problem not found."})

    sample_cases = problem.get("testCases", [])[:2]
    boilerplate = (problem.get("boilerplateFull") or {}).get(desc.LanguageName, "")
    full_code = boilerplate.replace("## Enter Code Here ##", desc.Code)
    code_b64 = _to_b64(full_code)

    try:
        return await _evaluate_test_cases(sample_cases, desc.Language, code_b64)
    except Exception:
        return JSONResponse(
            status_code=500,
            content={"error": "An error occurred while evaluating submissions."},
        )

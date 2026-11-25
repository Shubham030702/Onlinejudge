from datetime import datetime, timezone
from pathlib import Path
import sys

from bson import ObjectId
from dotenv import load_dotenv
from pymongo import MongoClient
import os

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/users")
DB_NAME = os.getenv("DB_NAME", "users")


def _load_problem_from_dir(problem_dir: Path) -> dict:
    description = (problem_dir / "Structure.md").read_text(encoding="utf-8")
    problem_name = ""
    difficulty = ""
    topics: list[str] = []

    for line in description.splitlines():
        if line.startswith("Problem Name:"):
            problem_name = line.replace("Problem Name:", "").strip()
        elif line.startswith("Difficulty :"):
            difficulty = line.replace("Difficulty :", "").strip()
        elif line.startswith("Topic :"):
            topics = [t.strip() for t in line.replace("Topic :", "").strip().split(",") if t.strip()]

    statement = (problem_dir / "Problem.md").read_text(encoding="utf-8")
    editorial = (problem_dir / "Editorial.md").read_text(encoding="utf-8")

    inputs_dir = problem_dir / "tests" / "inputs"
    outputs_dir = problem_dir / "tests" / "outputs"
    test_cases = []
    for idx, input_file in enumerate(sorted(inputs_dir.iterdir())):
        inp = input_file.read_text(encoding="utf-8")
        out_path = outputs_dir / f"{idx}.txt"
        out = out_path.read_text(encoding="utf-8") if out_path.exists() else None
        test_cases.append({"input": inp, "output": out})

    bp_dir = problem_dir / "BoilerPlate"
    bp_full_dir = problem_dir / "BoilerPlateFull"
    boilerplate = {
        "cpp": (bp_dir / "boilerplate.cpp").read_text(encoding="utf-8"),
        "python": (bp_dir / "boilerplate.py").read_text(encoding="utf-8"),
        "java": (bp_dir / "boilerplate.java").read_text(encoding="utf-8"),
        "js": (bp_dir / "boilerplate.js").read_text(encoding="utf-8"),
    }
    boilerplate_full = {
        "cpp": (bp_full_dir / "boilerplate.cpp").read_text(encoding="utf-8"),
        "python": (bp_full_dir / "boilerplate.py").read_text(encoding="utf-8"),
        "java": (bp_full_dir / "boilerplate.java").read_text(encoding="utf-8"),
        "js": (bp_full_dir / "boilerplate.js").read_text(encoding="utf-8"),
    }

    score = 3 if difficulty == "Easy" else (4 if difficulty == "Medium" else 6)
    return {
        "problemName": problem_name,
        "difficulty": difficulty,
        "topics": topics,
        "score": score,
        "statement": statement,
        "testCases": test_cases,
        "editorial": editorial,
        "users": [],
        "boilerplate": boilerplate,
        "boilerplateFull": boilerplate_full,
        "createdAt": datetime.now(timezone.utc),
    }


def add_problem_to_contest(problem_dir_str: str, contest_id: str | ObjectId) -> None:
    client = MongoClient(MONGODB_URI)
    try:
        db = client[DB_NAME]
        cid = ObjectId(contest_id) if isinstance(contest_id, str) else contest_id
        contest = db["contests"].find_one({"_id": cid})
        if not contest:
            print("Contest not found!")
            return

        data = _load_problem_from_dir(Path(problem_dir_str))
        data["contestOnly"] = True
        data["contestId"] = cid

        result = db["problems"].insert_one(data)
        print(f"New problem created with id: {result.inserted_id}")

        db["contests"].update_one(
            {"_id": cid},
            {"$push": {"problems": result.inserted_id}},
        )
        print(f"Problem added to contest {cid}")
    except Exception as exc:
        print(f"Error storing problem: {exc}")
    finally:
        client.close()


def store_problem(problem_dir_str: str) -> None:
    client = MongoClient(MONGODB_URI)
    try:
        db = client[DB_NAME]
        data = _load_problem_from_dir(Path(problem_dir_str))
        data["contestOnly"] = False
        result = db["problems"].insert_one(data)
        print(f"New problem created with id: {result.inserted_id}")
    except Exception as exc:
        print(f"Error storing problem: {exc}")
    finally:
        client.close()


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python -m problem_adder.problem_adder <problemDir>")
        sys.exit(1)
    store_problem(sys.argv[1])

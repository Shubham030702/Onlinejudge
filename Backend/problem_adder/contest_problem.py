from datetime import datetime, timedelta
import os
from pathlib import Path
from dotenv import load_dotenv
from pymongo import MongoClient

from problem_adder.problem_adder import add_problem_to_contest

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/users")
DB_NAME = os.getenv("DB_NAME", "users")


def create_contest(date_str: str, time_str: str) -> str:
    client = MongoClient(MONGODB_URI)
    try:
        db = client[DB_NAME]
        cont_size = db["contests"].count_documents({})
        start = datetime.fromisoformat(f"{date_str}T{time_str}:00")
        end = start + timedelta(minutes=90)
        contest_data = {
            "contestNo": cont_size + 1,
            "standings": [],
            "problems": [],
            "contestDate": start.isoformat(),
            "starttime": start.isoformat(),
            "endtime": end.isoformat(),
            "status": "Upcoming",
            "processed": False,
        }
        result = db["contests"].insert_one(contest_data)
        print(f"New contest created with id: {result.inserted_id}")
        return str(result.inserted_id)
    finally:
        client.close()


def main() -> None:
    date_str = input("Enter contest date (YYYY-MM-DD) Add date as 7==>07:: ").strip()
    time_str = input("Enter contest time (HH:MM in 24hr format) Add time as 7==>07: ").strip()
    cont_dt = datetime.fromisoformat(f"{date_str}T{time_str}:00")
    if datetime.now() > cont_dt:
        raise ValueError("Schedule time is in the past; please schedule contest for the future.")

    dirs_raw = input("Enter problem directory paths (comma-separated): ").strip()
    contest_id = create_contest(date_str, time_str)
    for d in [p.strip() for p in dirs_raw.split(",") if p.strip()]:
        add_problem_to_contest(d, contest_id)
    print("All the problems are added to the contest")


if __name__ == "__main__":
    main()

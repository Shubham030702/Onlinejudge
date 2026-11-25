import os
from pathlib import Path
from dotenv import load_dotenv
from pymongo import MongoClient

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/users")
DB_NAME = os.getenv("DB_NAME", "users")


def seed_prerequisites() -> None:
    client = MongoClient(MONGODB_URI)
    try:
        try:
            db = client.get_default_database()
        except Exception:
            db = client[DB_NAME]

        problems_col = db["problems"]
        problems = list(problems_col.find({"contestOnly": False}))
        print(f"Found {len(problems)} public problems.")

        if len(problems) < 3:
            print("Need at least 3 problems to build a meaningful DAG structure.")
            return

        prob_a, prob_b, prob_c = problems[0], problems[1], problems[2]
        problems_col.update_many({}, {"$set": {"prerequisites": [], "coordinates": {"x": 0, "y": 0}}})

        problems_col.update_one(
            {"_id": prob_a["_id"]},
            {"$set": {"coordinates": {"x": 200, "y": 100}, "prerequisites": []}},
        )
        problems_col.update_one(
            {"_id": prob_b["_id"]},
            {"$set": {"coordinates": {"x": 50, "y": 300}, "prerequisites": [prob_a["_id"]]}},
        )
        problems_col.update_one(
            {"_id": prob_c["_id"]},
            {"$set": {"coordinates": {"x": 350, "y": 300}, "prerequisites": [prob_a["_id"]]}},
        )

        if len(problems) >= 4:
            prob_d = problems[3]
            problems_col.update_one(
                {"_id": prob_d["_id"]},
                {"$set": {"coordinates": {"x": 200, "y": 500}, "prerequisites": [prob_b["_id"], prob_c["_id"]]}},
            )

        print("Prerequisites and coordinates successfully seeded!")
    finally:
        client.close()


if __name__ == "__main__":
    seed_prerequisites()

import json
import os
from pathlib import Path
from dotenv import load_dotenv
from pymongo import MongoClient

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/users")
DB_NAME = os.getenv("DB_NAME", "users")


def insert_problems() -> None:
    client = MongoClient(MONGODB_URI)
    try:
        try:
            db = client.get_default_database()
        except Exception:
            db = client[DB_NAME]

        problems_col = db["problems"]
        seed_path = BASE_DIR / "Database" / "problems_seed.json"
        if not seed_path.exists():
            print(f"Seed file not found at {seed_path}. Please run scripts/parse_problems.py first.")
            return

        problems_data = json.loads(seed_path.read_text(encoding="utf-8"))
        print(f"Loaded {len(problems_data)} problems from seed file.")

        result = problems_col.insert_many(problems_data)
        print(f"Successfully inserted {len(result.inserted_ids)} problems!")

        inserted = list(problems_col.find({"contestOnly": False}))
        problems_col.update_many(
            {"contestOnly": False},
            {"$set": {"prerequisites": [], "coordinates": {"x": 0, "y": 0}}},
        )

        easy_probs = [p for p in inserted if p.get("difficulty") == "Easy"]
        med_probs = [p for p in inserted if p.get("difficulty") == "Medium"]
        hard_probs = [p for p in inserted if p.get("difficulty") == "Hard"]

        print(f"Retrieved: {len(easy_probs)} Easy, {len(med_probs)} Medium, {len(hard_probs)} Hard problems.")

        easy_limit = min(len(easy_probs), 10)
        med_limit = min(len(med_probs), 15)
        hard_limit = min(len(hard_probs), 10)

        current_x = 100
        for i in range(easy_limit):
            problems_col.update_one(
                {"_id": easy_probs[i]["_id"]},
                {"$set": {"coordinates": {"x": current_x, "y": 100}, "prerequisites": []}},
            )
            current_x += 280

        med_x = 100
        for i in range(med_limit):
            pre1 = easy_probs[i % easy_limit]["_id"]
            pre2 = easy_probs[(i + 1) % easy_limit]["_id"]
            problems_col.update_one(
                {"_id": med_probs[i]["_id"]},
                {"$set": {"coordinates": {"x": med_x, "y": 300}, "prerequisites": [pre1, pre2]}},
            )
            med_x += 280

        hard_x = 150
        for i in range(hard_limit):
            pre1 = med_probs[i % med_limit]["_id"]
            pre2 = med_probs[(i + 2) % med_limit]["_id"]
            problems_col.update_one(
                {"_id": hard_probs[i]["_id"]},
                {"$set": {"coordinates": {"x": hard_x, "y": 500}, "prerequisites": [pre1, pre2]}},
            )
            hard_x += 300

        print("Skill tree connections successfully populated!")
    finally:
        client.close()


if __name__ == "__main__":
    insert_problems()

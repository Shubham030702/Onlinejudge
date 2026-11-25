import csv
import json
from pathlib import Path

CSV_FILE_PATH = Path(r"c:\Users\dangw\Downloads\coding_questions_main_rows.csv")
OUTPUT_JSON_PATH = Path(__file__).resolve().parent.parent / "Database" / "problems_seed.json"


def extract_topics(tags_str: str, category: str) -> list[str]:
    if tags_str:
        try:
            tags = json.loads(tags_str)
            if isinstance(tags, list) and tags:
                return [str(t).lower() for t in tags]
        except Exception:
            pass
    return [category.lower()] if category else ["general"]


def process_csv() -> None:
    print("Reading CSV file...")
    with CSV_FILE_PATH.open("r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        data_rows = list(reader)

    print(f"Total parsed rows: {len(data_rows)}")
    if not data_rows:
        print("CSV file has no data.")
        return

    category_groups: dict[str, list[dict]] = {}
    for row in data_rows:
        cat = (row.get("category") or "General").lower().strip()
        category_groups.setdefault(cat, []).append(row)

    categories = list(category_groups.keys())
    print(f"Found {len(categories)} categories: {categories}")

    selected_rows: list[dict] = []
    target_total = 200
    indices = {cat: 0 for cat in categories}
    added = True

    while len(selected_rows) < target_total and added:
        added = False
        for cat in categories:
            lst = category_groups[cat]
            idx = indices[cat]
            if idx < len(lst):
                selected_rows.append(lst[idx])
                indices[cat] += 1
                added = True
            if len(selected_rows) >= target_total:
                break

    print(f"Selected {len(selected_rows)} problems for seeding.")

    mapped_problems = []
    for idx, row in enumerate(selected_rows):
        raw_title = row.get("title") or f"Problem {idx + 1}"
        raw_diff = (row.get("difficulty") or "medium").lower().strip()
        difficulty, score = "Medium", "4"
        if raw_diff == "easy":
            difficulty, score = "Easy", "3"
        elif raw_diff == "hard":
            difficulty, score = "Hard", "6"

        topics = extract_topics(row.get("tags") or "", row.get("category") or "")
        statement = row.get("description") or ""
        constraints = row.get("constraints") or ""
        if constraints.strip():
            statement += f"\n\n### Constraints\n{constraints}"

        examples = row.get("examples") or ""
        if examples.strip():
            try:
                parsed_ex = json.loads(examples)
                if isinstance(parsed_ex, list):
                    statement += "\n\n### Examples"
                    for ex_idx, ex in enumerate(parsed_ex):
                        statement += f"\n\n**Example {ex_idx + 1}**:\n"
                        statement += f"* **Input**: `{ex.get('input')}`\n"
                        statement += f"* **Output**: `{ex.get('output')}`\n"
                        if ex.get("explanation"):
                            statement += f"* **Explanation**: {ex['explanation']}\n"
            except Exception:
                statement += f"\n\n### Examples\n{examples}"

        test_cases = []
        raw_tc = row.get("test_cases") or ""
        if raw_tc.strip():
            try:
                parsed_tc = json.loads(raw_tc)
                if isinstance(parsed_tc, list):
                    test_cases = [
                        {
                            "input": tc.get("input") or "",
                            "output": tc.get("expected_output") or tc.get("output") or "",
                        }
                        for tc in parsed_tc
                    ]
            except Exception:
                pass
        if not test_cases:
            test_cases = [{"input": "default_input", "output": "default_output"}]

        bp_parsed = {}
        raw_starter = row.get("starter_code") or ""
        if raw_starter.strip():
            try:
                bp_parsed = json.loads(raw_starter)
            except Exception:
                pass

        boilerplate = {
            "cpp": bp_parsed.get("cpp") or bp_parsed.get("c") or "// Write C++ code here",
            "python": bp_parsed.get("python") or "# Write Python code here",
            "java": bp_parsed.get("java") or "/* Write Java code here */",
            "js": bp_parsed.get("javascript") or bp_parsed.get("typescript") or "// Write JavaScript code here",
        }

        main_parsed = {}
        raw_main = row.get("main_code") or ""
        if raw_main.strip():
            try:
                main_parsed = json.loads(raw_main)
            except Exception:
                pass

        boilerplate_full = {
            "cpp": main_parsed.get("cpp") or "#include <iostream>\n## Enter Code Here ##",
            "python": main_parsed.get("python") or "## Enter Code Here ##",
            "java": main_parsed.get("java") or "import java.util.*;\n## Enter Code Here ##",
            "js": main_parsed.get("javascript") or main_parsed.get("js") or "## Enter Code Here ##",
        }

        mapped_problems.append(
            {
                "problemName": raw_title,
                "difficulty": difficulty,
                "score": score,
                "topics": topics,
                "statement": statement,
                "testCases": test_cases,
                "editorial": row.get("editorial") or "No editorial available yet.",
                "users": [],
                "boilerplate": boilerplate,
                "boilerplateFull": boilerplate_full,
                "contestOnly": False,
                "prerequisites": [],
                "coordinates": {"x": 0, "y": 0},
            }
        )

    OUTPUT_JSON_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_JSON_PATH.write_text(json.dumps(mapped_problems, indent=2), encoding="utf-8")
    print(f"Saved parsed seed data to {OUTPUT_JSON_PATH}")


if __name__ == "__main__":
    process_csv()

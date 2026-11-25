from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient
from main import app
from boilerplate_generator.generate_boilerplate import GenerateBoilerplate, FullBoilerplate


def test_all_expected_routes_registered():
    paths = app.openapi()["paths"]
    expected = [
        ("/api/checkUser", "get"),
        ("/api/otpManager", "post"),
        ("/api/otpVerify", "post"),
        ("/api/signup", "post"),
        ("/api/login", "post"),
        ("/api/logout", "get"),
        ("/api/userdata", "get"),
        ("/api/leaderboard", "get"),
        ("/profile", "get"),
        ("/api/problems", "get"),
        ("/api/problem/{problem_id}", "get"),
        ("/api/submission", "post"),
        ("/api/runprob", "post"),
        ("/api/contest", "get"),
        ("/api/contest/{contest_id}", "get"),
        ("/contest/register", "post"),
        ("/contest/IncrzScore", "post"),
        ("/contest/IncrzPenalty", "post"),
        ("/contest/GetLeaderBoard", "get"),
    ]
    for path, method in expected:
        assert path in paths and method in paths[path], f"Missing route {method.upper()} {path}"


def test_check_user_unauthenticated():
    client = TestClient(app, raise_server_exceptions=False)
    # TestClient without lifespan still exercises middleware & routing; check route directly
    res = client.get("/api/checkUser")
    assert res.status_code == 200
    assert res.json() == {"Success": False, "message": "User was not already logged in!"}


def test_protected_routes_require_auth():
    client = TestClient(app, raise_server_exceptions=False)
    for path in ["/api/problems", "/api/contest", "/api/userdata", "/api/leaderboard"]:
        res = client.get(path)
        assert res.status_code == 401


def test_boilerplate_generators():
    sample_structure = """Problem Name: Two Sum
Difficulty : Easy
Topic : Array, HashMap
Function Name : twoSum
Input Field: int target
Input Field: list<int> nums
Output Field: list<int> result
"""
    gen1 = GenerateBoilerplate()
    gen1.parse(sample_structure)
    assert "def twoSum(target, nums)" in gen1.boilerplate_python()
    assert "vector<int> twoSum(int target, vector<int> nums)" in gen1.boilerplate_cpp()
    assert "function twoSum(target, nums)" in gen1.boilerplate_js()
    assert "public static List<Integer> twoSum(int target, List<Integer> nums)" in gen1.boilerplate_java()

    gen2 = FullBoilerplate()
    gen2.parse(sample_structure)
    assert "## Enter Code Here ##" in gen2.generate_python()
    assert "## Enter Code Here ##" in gen2.generate_cpp()
    assert "## Enter Code Here ##" in gen2.generate_js()
    assert "## Enter Code Here ##" in gen2.generate_java()

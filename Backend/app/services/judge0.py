import asyncio
import httpx

from app.config import settings

JUDGE0_HOST = "judge0-ce.p.rapidapi.com"
JUDGE0_BASE_URL = f"https://{JUDGE0_HOST}/submissions"


class CodeSubmission:
    """Async Judge0 client for submitting and polling code evaluations."""

    async def evaluation(
        self, input_b64: str, language_id: int, output_b64: str, code_b64: str
    ) -> dict | None:
        url = f"{JUDGE0_BASE_URL}?base64_encoded=true&wait=false&fields=*"
        headers = {
            "x-rapidapi-key": settings.SUBMISSION_KEY,
            "x-rapidapi-host": JUDGE0_HOST,
            "Content-Type": "application/json",
        }
        payload = {
            "language_id": language_id,
            "source_code": code_b64,
            "stdin": input_b64,
            "expected_output": output_b64,
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(url, headers=headers, json=payload)
                result = response.json()
                print("The received token is:", result)
                token = result.get("token")
                if token:
                    return await self.get_submission(token, client)
                print("Token not received from Judge0 API.")
                return None
        except Exception as exc:
            print(f"Error during code submission: {exc}")
            return None

    async def get_submission(
        self, token: str, client: httpx.AsyncClient | None = None
    ) -> dict | None:
        url = f"{JUDGE0_BASE_URL}/{token}?base64_encoded=true&fields=*&wait=false"
        headers = {
            "x-rapidapi-key": settings.GET_SUBMISSION_KEY,
            "x-rapidapi-host": JUDGE0_HOST,
        }

        async def _poll(http_client: httpx.AsyncClient) -> dict | None:
            while True:
                response = await http_client.get(url, headers=headers)
                result = response.json()
                status = result.get("status", {})
                status_id = status.get("id", 0)
                print(status)
                if status_id >= 3:
                    return result
                print("Still in queue...")
                await asyncio.sleep(1)

        try:
            if client is not None:
                return await _poll(client)
            async with httpx.AsyncClient(timeout=30.0) as new_client:
                return await _poll(new_client)
        except Exception as exc:
            print(f"Error during result retrieval: {exc}")
            return None

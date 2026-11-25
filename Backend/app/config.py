import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")


class Settings:
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017/users")
    DB_NAME: str = os.getenv("DB_NAME", "users")
    SECRET_KEY: str = os.getenv("SecretKey", "dev-secret-key-change-in-production")
    SUBMISSION_KEY: str = os.getenv("Submissionkey", "")
    GET_SUBMISSION_KEY: str = os.getenv("Getsubmissionkey", "")
    EMAIL_USER: str = os.getenv("Email", "")
    EMAIL_PASS: str = os.getenv("PassEmail", "")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "")
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379")
    PORT: int = int(os.getenv("PORT", "5000"))

    @property
    def allowed_origins(self) -> list[str]:
        origins = [
            "http://localhost:3000",
            "https://acecodecp.netlify.app",
        ]
        if self.FRONTEND_URL:
            origins.append(self.FRONTEND_URL)
        return origins


settings = Settings()

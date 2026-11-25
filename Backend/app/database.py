from datetime import datetime
from typing import Any
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo.errors import ConfigurationError

from app.config import settings

_client: AsyncIOMotorClient | None = None


async def connect_db() -> AsyncIOMotorDatabase:
    """Initialize the Motor MongoDB client and ensure indexes."""
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(
            settings.MONGODB_URI,
            serverSelectionTimeoutMS=30000,
        )
    db = get_db()
    try:
        # Ensure TTL index on otps (300 seconds = 5 minutes) and sessions (24 hours)
        await db["otps"].create_index("createdAt", expireAfterSeconds=300)
        await db["sessions"].create_index("expiresAt", expireAfterSeconds=0)
        print("Connected to MongoDB successfully")
    except Exception as exc:
        print(f"Error connecting to MongoDB: {exc}")
    return db


async def close_db() -> None:
    """Close the Motor MongoDB client."""
    global _client
    if _client is not None:
        _client.close()
        _client = None


def get_db() -> AsyncIOMotorDatabase:
    """Return the active MongoDB database instance."""
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(
            settings.MONGODB_URI,
            serverSelectionTimeoutMS=30000,
        )
    try:
        return _client.get_default_database()
    except ConfigurationError:
        return _client[settings.DB_NAME]


def serialize_doc(value: Any) -> Any:
    """Recursively convert MongoDB ObjectId and datetime values to JSON-safe types."""
    if isinstance(value, ObjectId):
        return str(value)
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, list):
        return [serialize_doc(item) for item in value]
    if isinstance(value, dict):
        return {k: serialize_doc(v) for k, v in value.items()}
    return value


def to_object_id(id_str: str) -> ObjectId | None:
    """Safely parse a string into a BSON ObjectId."""
    try:
        return ObjectId(id_str)
    except Exception:
        return None

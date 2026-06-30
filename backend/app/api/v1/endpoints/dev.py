from fastapi import APIRouter, Depends
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db

router = APIRouter()

# Global variable to hold time override. Note: this is for dev/testing only.
# In a multi-worker setup, this would need to be stored in Redis.
_time_override: Optional[datetime] = None

@router.post("/time-travel")
def set_time(target_time: str):
    """
    Provide ISO format target_time. E.g. '2026-06-22T00:00:00Z'.
    Set to 'reset' to clear.
    """
    global _time_override
    if target_time == "reset":
        _time_override = None
        return {"message": "Time reset to real current time."}
    try:
        dt = datetime.fromisoformat(target_time.replace("Z", "+00:00"))
        _time_override = dt
        return {"message": f"Time set to {dt.isoformat()}"}
    except Exception as e:
        return {"error": str(e)}

def get_current_time_mock() -> datetime:
    if _time_override:
        return _time_override
    return datetime.now(timezone.utc)

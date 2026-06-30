from pydantic import BaseModel
from datetime import datetime

class NotificationBase(BaseModel):
    user_id: int
    message: str
    is_read: bool
    created_at: datetime

class NotificationResponse(NotificationBase):
    id: int

    class Config:
        orm_mode = True

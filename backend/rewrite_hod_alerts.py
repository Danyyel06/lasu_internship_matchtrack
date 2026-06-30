import os

filepath = "c:/Users/User/lasu-internship-platform/backend/app/api/v1/endpoints/hod.py"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

new_endpoints = """
class HodAlertResponse(BaseModel):
    id: int
    type: str
    message: str
    time: str
    urgent: bool
    read: bool

@router.get("/alerts", response_model=List[HodAlertResponse])
async def get_alerts(
    current_user: User = Depends(require_role(UserRole.HEAD_OF_DEPARTMENT)),
    db: AsyncSession = Depends(get_db)
):
    # Dummy alerts data until the notification and websocket systems are fully built
    return [
        {
            "id": 1,
            "type": "placement",
            "message": "Adebayo Johnson has secured a placement at TechCorp Nigeria.",
            "time": "1 hour ago",
            "urgent": False,
            "read": False,
        },
        {
            "id": 2,
            "type": "missed_pulse",
            "message": "3 students in your department have missed their weekly logbook submission.",
            "time": "3 hours ago",
            "urgent": True,
            "read": False,
        },
        {
            "id": 3,
            "type": "system",
            "message": "The mid-semester evaluation portal is now open for supervisors.",
            "time": "1 day ago",
            "urgent": False,
            "read": True,
        }
    ]
"""

if "@router.get(\"/alerts\"" not in content:
    content += new_endpoints

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Rewritten hod.py for alerts")

import os

filepath = "c:/Users/User/lasu-internship-platform/backend/app/api/v1/endpoints/hod.py"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

new_endpoints = """
@router.get("/reports/placement-stats")
async def get_placement_stats(
    current_user: User = Depends(require_role(UserRole.HEAD_OF_DEPARTMENT)),
    db: AsyncSession = Depends(get_db)
):
    hod_res = await db.execute(select(HeadOfDepartment).where(HeadOfDepartment.user_id == current_user.id))
    hod = hod_res.scalar_one_or_none()
    if not hod:
        raise HTTPException(status_code=400, detail="HOD profile not found")

    # In a real scenario, this would aggregate actual placements by company industry or job family
    # For now, we will return some mock data shaped correctly for Recharts
    
    return {
        "placementByIndustry": [
            { "name": "Software & Tech", "value": 45 },
            { "name": "Engineering", "value": 25 },
            { "name": "Business / Mgmt", "value": 20 },
            { "name": "Finance", "value": 10 }
        ],
        "placementByLevel": [
            { "name": "300 Level", "placed": 85, "unplaced": 20 },
            { "name": "400 Level", "placed": 120, "unplaced": 15 },
        ]
    }
"""

if "@router.get(\"/reports/placement-stats\"" not in content:
    content += new_endpoints

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Rewritten hod.py for reports stats")

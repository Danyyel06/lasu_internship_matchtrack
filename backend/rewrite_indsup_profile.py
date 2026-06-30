import os

filepath = "c:/Users/User/lasu-internship-platform/backend/app/api/v1/endpoints/supervisors.py"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

new_endpoint = """
class IndSupProfileUpdate(BaseModel):
    first_name: str
    last_name: str
    phone_number: str | None = None
    linkedin_profile: str | None = None
    mentorship_philosophy: str | None = None

@router.get("/profile")
async def get_ind_sup_profile(
    current_user: User = Depends(require_role(UserRole.INDUSTRY_SUPERVISOR)),
    db: AsyncSession = Depends(get_db)
):
    prof_res = await db.execute(select(IndustrySupervisorProfile).where(IndustrySupervisorProfile.user_id == current_user.id))
    profile = prof_res.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=400, detail="Profile not found")
        
    return {
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "email": current_user.email,
        "is_verified": current_user.is_verified,
        "phone_number": getattr(current_user, 'phone_number', None) or "+234 XXX XXX XXXX",
        "linkedin_profile": getattr(profile, 'linkedin_profile', None) or "",
        "mentorship_philosophy": getattr(profile, 'mentorship_philosophy', None) or ""
    }

@router.put("/profile")
async def update_ind_sup_profile(
    req: IndSupProfileUpdate,
    current_user: User = Depends(require_role(UserRole.INDUSTRY_SUPERVISOR)),
    db: AsyncSession = Depends(get_db)
):
    prof_res = await db.execute(select(IndustrySupervisorProfile).where(IndustrySupervisorProfile.user_id == current_user.id))
    profile = prof_res.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=400, detail="Profile not found")
        
    current_user.first_name = req.first_name
    current_user.last_name = req.last_name
    
    await db.commit()
    return {"message": "Profile updated successfully"}
"""

if "IndSupProfileUpdate" not in content:
    content += new_endpoint

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Rewritten supervisors.py with profile endpoints")

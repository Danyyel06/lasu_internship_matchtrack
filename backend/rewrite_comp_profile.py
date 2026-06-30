import os

filepath = "c:/Users/User/lasu-internship-platform/backend/app/api/v1/endpoints/companies.py"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

new_endpoint = """
class CompanyProfileUpdate(BaseModel):
    first_name: str
    last_name: str
    phone_number: str | None = None
    company_name: str | None = None
    industry: str | None = None
    company_size: str | None = None
    company_website: str | None = None
    company_address: str | None = None

@router.get("/profile")
async def get_company_profile(
    current_user: User = Depends(require_role(UserRole.COMPANY_REP)),
    db: AsyncSession = Depends(get_db)
):
    comp_res = await db.execute(select(Company).where(Company.user_id == current_user.id))
    company = comp_res.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=400, detail="Company not found")
        
    return {
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "email": current_user.email,
        "is_verified": company.is_admin_verified,
        "phone_number": getattr(current_user, 'phone_number', None) or "+234 XXX XXX XXXX",
        "company_name": company.company_name,
        "industry": company.industry,
        "company_size": company.company_size,
        "company_website": company.company_website,
        "company_address": company.company_address
    }

@router.put("/profile")
async def update_company_profile(
    req: CompanyProfileUpdate,
    current_user: User = Depends(require_role(UserRole.COMPANY_REP)),
    db: AsyncSession = Depends(get_db)
):
    comp_res = await db.execute(select(Company).where(Company.user_id == current_user.id))
    company = comp_res.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=400, detail="Company not found")
        
    current_user.first_name = req.first_name
    current_user.last_name = req.last_name
    if req.company_name: company.company_name = req.company_name
    if req.industry: company.industry = req.industry
    if req.company_size: company.company_size = req.company_size
    if req.company_website: company.company_website = req.company_website
    if req.company_address: company.company_address = req.company_address
    
    await db.commit()
    return {"message": "Profile updated successfully"}
"""

if "CompanyProfileUpdate" not in content:
    content += new_endpoint

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Rewritten companies.py with profile endpoints")

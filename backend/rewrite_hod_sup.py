import os

filepath = "c:/Users/User/lasu-internship-platform/backend/app/api/v1/endpoints/hod.py"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

new_endpoint = """
from app.core.security import hash_password

class CreateSupervisorRequest(BaseModel):
    email: str
    first_name: str
    last_name: str
    password: str

@router.post("/supervisors", status_code=status.HTTP_201_CREATED)
async def create_supervisor(
    req: CreateSupervisorRequest,
    current_user: User = Depends(require_role(UserRole.HEAD_OF_DEPARTMENT)),
    db: AsyncSession = Depends(get_db)
):
    hod_res = await db.execute(select(HeadOfDepartment).where(HeadOfDepartment.user_id == current_user.id))
    hod = hod_res.scalar_one_or_none()
    if not hod:
        raise HTTPException(status_code=400, detail="HOD profile not found")

    result = await db.execute(select(User).where(User.email == req.email))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Email already registered")
        
    new_user = User(
        email=req.email,
        password_hash=hash_password(req.password),
        first_name=req.first_name,
        last_name=req.last_name,
        role=UserRole.ACADEMIC_SUPERVISOR,
        is_verified=True
    )
    db.add(new_user)
    await db.flush()
    
    new_profile = AcademicSupervisorProfile(
        user_id=new_user.id,
        department=hod.department,
        faculty=hod.faculty,
        is_hod_approved=True
    )
    db.add(new_profile)
    
    await db.commit()
    return {"message": "Supervisor created successfully", "user_id": new_user.id}
"""

if "CreateSupervisorRequest" not in content:
    content += new_endpoint

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Rewritten hod.py")

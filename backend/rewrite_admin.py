import os

filepath = "c:/Users/User/lasu-internship-platform/backend/app/api/v1/endpoints/admin.py"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

new_endpoint = """
from app.core.security import hash_password

class CreateHODRequest(BaseModel):
    email: str
    first_name: str
    last_name: str
    password: str
    department_name: str

@router.post("/hods", status_code=status.HTTP_201_CREATED)
async def create_hod(
    req: CreateHODRequest,
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    # Check if email exists
    result = await db.execute(select(User).where(User.email == req.email))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Email already registered")
        
    new_user = User(
        email=req.email,
        password_hash=hash_password(req.password),
        first_name=req.first_name,
        last_name=req.last_name,
        role=UserRole.HEAD_OF_DEPARTMENT,
        is_verified=True
    )
    db.add(new_user)
    await db.flush()
    
    new_hod = HeadOfDepartment(
        user_id=new_user.id,
        department_name=req.department_name,
        is_admin_verified=True
    )
    db.add(new_hod)
    
    log_action(db, current_user.id, "create_hod", "head_of_departments", new_user.id)
    await db.commit()
    return {"message": "HOD created successfully", "user_id": new_user.id}
"""

if "CreateHODRequest" not in content:
    content += new_endpoint

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Rewritten admin.py to add create HOD endpoint")

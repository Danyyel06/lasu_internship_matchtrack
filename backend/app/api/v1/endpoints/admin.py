from typing import List, Optional, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func, desc
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.dependencies import require_role
from app.models.user import User, UserRole
from app.models.company import Company
from app.models.head_of_department import HeadOfDepartment
from app.models.job_family import JobFamily
from app.models.system_setting import SystemSetting
from app.models.audit_log import AuditLog
from app.models.student import Student
from app.models.internship import Internship
from app.models.application import Application

from pydantic import BaseModel
from datetime import datetime, timedelta

router = APIRouter()

# ---------------- Pydantic Models ----------------

class UserResponse(BaseModel):
    id: int
    email: str
    first_name: str | None = ""
    last_name: str | None = ""
    role: UserRole
    is_verified: bool
    created_at: Optional[datetime]

    model_config = {"from_attributes": True}

class VerifyRejectRequest(BaseModel):
    reason: Optional[str] = None

class JobFamilyUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    default_weights: Optional[dict] = None

class FairAllocationSettingsUpdate(BaseModel):
    min_equity_quota: int
    max_equity_quota: int
    fixed_equity_min_percentage: int = 20

class SystemSettingsUpdate(BaseModel):
    cycle_start_date: Optional[str] = None
    cycle_end_date: Optional[str] = None
    supervisor_capacity: Optional[int] = None
    alert_threshold: Optional[int] = None
    feature_toggles: Optional[dict] = None

class DepartmentObjectiveUpdate(BaseModel):
    department_name: str
    faculty: Optional[str] = None
    objectives: List[str]

# ---------------- Endpoints ----------------

def log_action(db: AsyncSession, user_id: int, action: str, entity_type: str, entity_id: int, metadata: dict = None):
    log = AuditLog(user_id=user_id, action_type=action, entity_type=entity_type, entity_id=entity_id, metadata_=metadata)
    db.add(log)

@router.get("/users", response_model=List[UserResponse])
async def get_users(
    role: Optional[str] = None,
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    query = select(User)
    if role:
        query = query.where(User.role == role)
    result = await db.execute(query)
    return result.scalars().all()

class PendingCompanyResponse(BaseModel):
    id: int
    name: str
    email: str
    status: str
    submittedAt: str

class PendingHODResponse(BaseModel):
    id: int
    name: str
    department: str
    email: str
    status: str
    submittedAt: str

@router.get("/pending-companies", response_model=List[PendingCompanyResponse])
async def get_pending_companies(
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Company, User).join(User, Company.user_id == User.id).where(Company.is_admin_verified == False)
    result = await db.execute(stmt)
    companies = []
    for company, user in result.all():
        companies.append({
            "id": company.id,
            "name": company.company_name or "Unknown",
            "email": user.email,
            "status": "Pending",
            "submittedAt": company.created_at.strftime("%Y-%m-%d") if hasattr(company, 'created_at') and company.created_at else "Unknown"
        })
    return companies

@router.get("/pending-hods", response_model=List[PendingHODResponse])
async def get_pending_hods(
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(HeadOfDepartment, User).join(User, HeadOfDepartment.user_id == User.id).where(HeadOfDepartment.is_admin_verified == False)
    result = await db.execute(stmt)
    hods = []
    for hod, user in result.all():
        hods.append({
            "id": hod.id,
            "name": f"{user.first_name} {user.last_name}",
            "department": hod.department,
            "email": user.email,
            "status": "Pending",
            "submittedAt": hod.created_at.strftime("%Y-%m-%d") if hasattr(hod, 'created_at') and hod.created_at else "Unknown"
        })
    return hods

@router.get("/reports")
async def get_reports(
    type: Optional[str] = None,
    faculty: Optional[str] = None,
    department: Optional[str] = None,
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN))
):
    # Quick dummy data for documentation purposes
    return {
        "status": "success",
        "message": "Dummy report generated for documentation",
        "data": []
    }

@router.patch("/users/{user_id}")
async def update_user_status(
    user_id: int,
    status_data: dict, # e.g. {"action": "suspend"}
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    # Dummy logic for suspend/reactivate
    log_action(db, current_user.id, "update_user", "users", user_id, status_data)
    await db.commit()
    return {"message": "User updated"}

@router.post("/verify-company/{id}")
async def verify_company(
    id: int,
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Company).where(Company.id == id))
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    company.is_admin_verified = True
    log_action(db, current_user.id, "verify_company", "companies", id)
    await db.commit()
    return {"message": "Company verified"}

@router.post("/reject-company/{id}")
async def reject_company(
    id: int,
    req: VerifyRejectRequest,
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Company).where(Company.id == id))
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    company.is_admin_verified = False
    log_action(db, current_user.id, "reject_company", "companies", id, {"reason": req.reason})
    await db.commit()
    return {"message": "Company rejected"}

@router.post("/verify-hod/{id}")
async def verify_hod(
    id: int,
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(HeadOfDepartment).where(HeadOfDepartment.id == id))
    hod = result.scalar_one_or_none()
    if not hod:
        raise HTTPException(status_code=404, detail="HOD not found")
    hod.is_admin_verified = True
    log_action(db, current_user.id, "verify_hod", "head_of_departments", id)
    await db.commit()
    return {"message": "HOD verified"}

@router.patch("/job-families/{id}")
async def update_job_family(
    id: int,
    req: JobFamilyUpdateRequest,
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(JobFamily).where(JobFamily.id == id))
    jf = result.scalar_one_or_none()
    if not jf:
        raise HTTPException(status_code=404, detail="Job family not found")
    if req.name: jf.name = req.name
    if req.description: jf.description = req.description
    if req.default_weights:
        # Validate sum
        if sum(req.default_weights.values()) != 100:
            raise HTTPException(status_code=400, detail="Weights must sum to 100")
        jf.default_weights = req.default_weights
    
    log_action(db, current_user.id, "update_job_family", "job_families", id)
    await db.commit()
    return {"message": "Job family updated"}

@router.patch("/fair-allocation-settings")
async def update_fair_allocation(
    req: FairAllocationSettingsUpdate,
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    # UPSERT settings
    for k, v in req.dict().items():
        result = await db.execute(select(SystemSetting).where(SystemSetting.key == f"fair_{k}"))
        setting = result.scalar_one_or_none()
        if setting:
            setting.value = v
        else:
            db.add(SystemSetting(key=f"fair_{k}", value=v))
    log_action(db, current_user.id, "update_fair_allocation", "system_settings", 0)
    await db.commit()
    return {"message": "Fair allocation settings updated"}

@router.patch("/system-settings")
async def update_system_settings(
    req: SystemSettingsUpdate,
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    for k, v in req.dict(exclude_unset=True).items():
        result = await db.execute(select(SystemSetting).where(SystemSetting.key == f"sys_{k}"))
        setting = result.scalar_one_or_none()
        if setting:
            setting.value = v
        else:
            db.add(SystemSetting(key=f"sys_{k}", value=v))
    log_action(db, current_user.id, "update_system_settings", "system_settings", 0)
    await db.commit()
    return {"message": "System settings updated"}

@router.patch("/department-objectives/{dept_code}")
async def update_dept_objectives(
    dept_code: str,
    req: DepartmentObjectiveUpdate,
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    # In a real scenario, this would update or create DepartmentObjective rows
    # Here we mock it by logging
    log_action(db, current_user.id, "update_department_objectives", "department_objectives", 0, {"dept": dept_code})
    await db.commit()
    return {"message": "Department objectives updated"}

@router.get("/metrics")
async def get_dashboard_metrics(
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    total_students = await db.scalar(select(func.count(Student.id)))
    total_companies = await db.scalar(select(func.count(Company.id)).where(Company.is_admin_verified == True))
    total_hods = await db.scalar(select(func.count(HeadOfDepartment.id)).where(HeadOfDepartment.is_admin_verified == True))
    
    # Active placements
    active_placements = await db.scalar(select(func.count(Application.id)).where(Application.status.in_(['accepted', 'Accepted'])))
    
    # Students without placement
    students_with_placement = await db.execute(select(Application.student_id).where(Application.status.in_(['accepted', 'Accepted'])).distinct())
    placed_student_ids = students_with_placement.scalars().all()
    unplaced_students = total_students - len(placed_student_ids)

    return {
        "totalStudents": total_students or 0,
        "totalCompanies": total_companies or 0,
        "totalHODs": total_hods or 0,
        "activePlacements": active_placements or 0,
        "studentsWithoutPlacement": unplaced_students or 0,
        "equityComplianceRate": 92 # Dummy value
    }

@router.get("/activity-chart")
async def get_activity_chart(
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    # Return dummy data for the last 30 days
    data = []
    base = datetime.now() - timedelta(days=30)
    for i in range(30):
        day = base + timedelta(days=i)
        data.append({
            "date": day.strftime("%Y-%m-%d"),
            "New Registrations": (i * 2) % 15,
            "New Internship Postings": (i * 3) % 10,
            "New Placements": (i * 1) % 5,
            "Active Log Submissions": 50 + (i * 5) % 30
        })
    return data

@router.get("/reports")
async def get_reports(
    type: str,
    faculty: Optional[str] = None,
    department: Optional[str] = None,
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    # Dummy report generation
    return {
        "report_type": type,
        "data": [
            {"label": "Metric A", "value": 120},
            {"label": "Metric B", "value": 85}
        ]
    }

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
        department=req.department_name,
        is_admin_verified=True
    )
    db.add(new_hod)
    
    log_action(db, current_user.id, "create_hod", "head_of_departments", new_user.id)
    await db.commit()
    return {"message": "HOD created successfully", "user_id": new_user.id}

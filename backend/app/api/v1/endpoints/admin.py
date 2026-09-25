from typing import List, Optional, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func, desc
from sqlalchemy.orm import selectinload
from pydantic import BaseModel
from datetime import datetime, timedelta

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
from app.core.security import hash_password, verify_password
from app.schemas.pagination import PaginatedResponse
from app.models.verification_submission import VerificationSubmission
from app.models.verification_event import VerificationEvent
from app.schemas.company import (
    AdminQueueItem, AdminSubmissionDetail, AdminActionRequest, 
    AdminDowngradeRequest, AdminSuspendRequest, CompanyDetailResponse
)

router = APIRouter()

# ---------------- Pydantic Models ----------------

class UserResponse(BaseModel):
    id: int
    email: str
    first_name: str | None = ""
    last_name: str | None = ""
    role: UserRole
    is_verified: bool
    is_active: bool
    admin_verification_status: Optional[str] = None
    created_at: Optional[datetime]

    model_config = {"from_attributes": True}

class VerifyRejectRequest(BaseModel):
    reason: Optional[str] = None

class JobFamilyUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    default_weights: Optional[dict] = None

class JobFamilyCreateRequest(BaseModel):
    name: str
    description: str
    default_weights: dict

class FairAllocationSettingsUpdate(BaseModel):
    min_equity_quota: int
    max_equity_quota: int
    fixed_equity_min_percentage: int = 20

class SystemSettingsUpdate(BaseModel):
    cycle_start_date: Optional[str] = None
    cycle_end_date: Optional[str] = None
    supervisor_capacity: Optional[int] = None
    alert_threshold: Optional[int] = None

class DepartmentObjectiveUpdate(BaseModel):
    department_name: str
    faculty: Optional[str] = None
    objectives: List[str]

class AdminUpdateApplicationSupervisorsRequest(BaseModel):
    industry_supervisor_id: Optional[int] = None
    academic_supervisor_id: Optional[int] = None

# ---------------- Endpoints ----------------

def log_action(db: AsyncSession, user_id: int, action: str, entity_type: str, entity_id: int, metadata: dict = None):
    log = AuditLog(user_id=user_id, action_type=action, entity_type=entity_type, entity_id=entity_id, metadata_=metadata)
    db.add(log)

@router.get("/users", response_model=PaginatedResponse[UserResponse])
async def get_users(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    role: Optional[str] = None,
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    query = select(User, Company, HeadOfDepartment).outerjoin(
        Company, User.id == Company.user_id
    ).outerjoin(
        HeadOfDepartment, User.id == HeadOfDepartment.user_id
    )
    if role:
        query = query.where(User.role == role)
    
    result = await db.execute(query)
    rows = result.all()
    
    users = []
    for user, company, hod in rows:
        status_str = None
        if user.role == UserRole.COMPANY_REP and company:
            status_str = "rejected" if company.rejection_note else ("verified" if company.is_admin_verified else "pending")
        elif user.role == UserRole.HEAD_OF_DEPARTMENT and hod:
            status_str = "rejected" if hod.rejection_note else ("verified" if hod.is_admin_verified else "pending")
            
        users.append(UserResponse(
            id=user.id,
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            role=user.role,
            is_verified=user.is_verified,
            is_active=getattr(user, "is_active", True),
            admin_verification_status=status_str,
            created_at=user.created_at
        ))
        
    total = len(users)
    skip = (page - 1) * limit
    paginated_users = users[skip : skip + limit]

    return {
        "items": paginated_users,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit if limit > 0 else 1
    }

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
    stmt = select(Company, User).join(User, Company.user_id == User.id).where(Company.is_admin_verified == False).where(Company.rejection_note == None)
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
    stmt = select(HeadOfDepartment, User).join(User, HeadOfDepartment.user_id == User.id).where(HeadOfDepartment.is_admin_verified == False).where(HeadOfDepartment.rejection_note == None)
    result = await db.execute(stmt)
    hods = []
    for hod, user in result.all():
        hods.append({
            "id": hod.id,
            "name": f"{user.first_name} {user.last_name}",
            "department": hod.department,
            "email": user.email,
            "status": "Pending",
            "submittedAt": getattr(hod, 'created_at', None).strftime("%Y-%m-%d") if hasattr(hod, 'created_at') and getattr(hod, 'created_at') else "Unknown"
        })
    return hods

class UpdateUserStatusRequest(BaseModel):
    action: str

@router.patch("/users/{user_id}")
async def update_user_status(
    user_id: int,
    req: UpdateUserStatusRequest,
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    if user_id == current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot modify your own account")
        
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
    if user.role == UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot modify super admin accounts")

    if req.action == "suspend":
        user.is_active = False
    elif req.action == "reactivate":
        user.is_active = True
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid action")

    log_action(db, current_user.id, f"{req.action}_user", "users", user_id)
    await db.commit()
    return {"message": f"User {req.action}d successfully"}

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    if user_id == current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot delete your own account")
        
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
    if user.role == UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot delete super admin accounts")

    await db.delete(user)
    log_action(db, current_user.id, "delete_user", "users", user_id)
    await db.commit()
    return {"message": "User deleted successfully"}

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
    company.rejection_note = None
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
    company.rejection_note = req.reason
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
    hod.rejection_note = None
    log_action(db, current_user.id, "verify_hod", "head_of_departments", id)
    await db.commit()
    return {"message": "HOD verified"}

@router.post("/reject-hod/{id}")
async def reject_hod(
    id: int,
    req: VerifyRejectRequest,
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(HeadOfDepartment).where(HeadOfDepartment.id == id))
    hod = result.scalar_one_or_none()
    if not hod:
        raise HTTPException(status_code=404, detail="HOD not found")
    hod.is_admin_verified = False
    hod.rejection_note = req.reason
    log_action(db, current_user.id, "reject_hod", "head_of_departments", id, {"reason": req.reason})
    await db.commit()
    return {"message": "HOD rejected"}

@router.get("/job-families")
async def get_job_families(
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(JobFamily).options(selectinload(JobFamily.sub_roles)))
    return result.scalars().all()

@router.post("/job-families", status_code=status.HTTP_201_CREATED)
async def create_job_family(
    req: JobFamilyCreateRequest,
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    if sum(req.default_weights.values()) != 100:
        raise HTTPException(status_code=400, detail="Weights must sum to 100")
        
    new_jf = JobFamily(
        name=req.name,
        description=req.description,
        default_weights=req.default_weights
    )
    db.add(new_jf)
    await db.flush()
    log_action(db, current_user.id, "create_job_family", "job_families", new_jf.id)
    await db.commit()
    return {"message": "Job family created", "id": new_jf.id}

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
        if sum(req.default_weights.values()) != 100:
            raise HTTPException(status_code=400, detail="Weights must sum to 100")
        jf.default_weights = req.default_weights
    
    log_action(db, current_user.id, "update_job_family", "job_families", id)
    await db.commit()
    return {"message": "Job family updated"}

class SubRoleCreate(BaseModel):
    name: str

@router.post("/job-families/{id}/sub-roles")
async def add_sub_role(
    id: int,
    req: SubRoleCreate,
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    from app.models.job_family import SubRole
    result = await db.execute(select(JobFamily).where(JobFamily.id == id))
    jf = result.scalar_one_or_none()
    if not jf:
        raise HTTPException(status_code=404, detail="Job family not found")
        
    sub_role = SubRole(job_family_id=jf.id, name=req.name)
    db.add(sub_role)
    await db.commit()
    await db.refresh(sub_role)
    return {"id": sub_role.id, "name": sub_role.name}

@router.delete("/job-families/{id}/sub-roles/{sub_role_id}")
async def delete_sub_role(
    id: int,
    sub_role_id: int,
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    from app.models.job_family import SubRole
    result = await db.execute(select(SubRole).where(SubRole.id == sub_role_id, SubRole.job_family_id == id))
    sub_role = result.scalar_one_or_none()
    if not sub_role:
        raise HTTPException(status_code=404, detail="Sub role not found")
        
    await db.delete(sub_role)
    await db.commit()
    return {"message": "Sub role deleted"}

@router.patch("/fair-allocation-settings")
async def update_fair_allocation(
    req: FairAllocationSettingsUpdate,
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    for k, v in req.model_dump().items():
        result = await db.execute(select(SystemSetting).where(SystemSetting.key == f"fair_{k}"))
        setting = result.scalar_one_or_none()
        if setting:
            setting.value = v
        else:
            db.add(SystemSetting(key=f"fair_{k}", value=v))
    log_action(db, current_user.id, "update_fair_allocation", "system_settings", 0)
    await db.commit()
    return {"message": "Fair allocation settings updated"}

@router.get("/fair-allocation-settings")
async def get_fair_allocation_settings(
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(SystemSetting).where(SystemSetting.key.like("fair_%")))
    settings = result.scalars().all()
    
    data = {
        "min_equity_quota": 15,
        "max_equity_quota": 25,
        "fixed_equity_min_percentage": 20
    }
    for s in settings:
        key_name = s.key.replace("fair_", "")
        if key_name in data:
            data[key_name] = s.value
    return data

@router.patch("/system-settings")
async def update_system_settings(
    req: SystemSettingsUpdate,
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    for k, v in req.model_dump(exclude_unset=True).items():
        result = await db.execute(select(SystemSetting).where(SystemSetting.key == f"sys_{k}"))
        setting = result.scalar_one_or_none()
        if setting:
            setting.value = v
        else:
            db.add(SystemSetting(key=f"sys_{k}", value=v))
    log_action(db, current_user.id, "update_system_settings", "system_settings", 0)
    await db.commit()
    return {"message": "System settings updated"}

@router.get("/system-settings")
async def get_system_settings(
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(SystemSetting).where(SystemSetting.key.like("sys_%")))
    settings = result.scalars().all()
    
    data = {
        "cycle_start_date": "2026-08-01",
        "cycle_end_date": "2026-12-15",
        "current_cycle_label": "2026 Summer",
        "supervisor_capacity": 10,
        "alert_threshold": 2,
    }
    for s in settings:
        key_name = s.key.replace("sys_", "")
        if key_name in data:
            data[key_name] = s.value
    return data

@router.get("/metrics")
async def get_dashboard_metrics(
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    total_students = await db.scalar(select(func.count(Student.id)))
    total_companies = await db.scalar(select(func.count(Company.id)).where(Company.is_admin_verified == True))
    total_hods = await db.scalar(select(func.count(HeadOfDepartment.id)).where(HeadOfDepartment.is_admin_verified == True))
    
    active_placements = await db.scalar(select(func.count(Application.id)).where(Application.status.in_(['accepted', 'Accepted'])))
    
    students_with_placement = await db.execute(select(Application.student_id).where(Application.status.in_(['accepted', 'Accepted'])).distinct())
    placed_student_ids = students_with_placement.scalars().all()
    unplaced_students = (total_students or 0) - len(placed_student_ids)

    return {
        "totalStudents": total_students or 0,
        "totalCompanies": total_companies or 0,
        "totalHODs": total_hods or 0,
        "activePlacements": active_placements or 0,
        "studentsWithoutPlacement": unplaced_students or 0,
        "equityComplianceRate": 92
    }

@router.get("/activity-chart")
async def get_activity_chart(
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    query = select(
        func.date(User.created_at).label("date"),
        User.role,
        func.count().label("count")
    ).where(
        User.created_at >= datetime.now() - timedelta(days=days)
    ).group_by(
        func.date(User.created_at), User.role
    ).order_by(
        func.date(User.created_at)
    )
    
    result = await db.execute(query)
    rows = result.all()
    
    chart_dict = {}
    base = datetime.now() - timedelta(days=days)
    for i in range(days + 1):
        day = (base + timedelta(days=i)).strftime("%Y-%m-%d")
        chart_dict[day] = {
            "date": day,
            "Students": 0,
            "Companies": 0,
            "HODs": 0,
            "Others": 0
        }
        
    for date_val, role, count in rows:
        day_str = date_val.strftime("%Y-%m-%d") if hasattr(date_val, "strftime") else str(date_val)
        if day_str not in chart_dict:
            continue
            
        if role == UserRole.STUDENT:
            chart_dict[day_str]["Students"] += count
        elif role == UserRole.COMPANY_REP:
            chart_dict[day_str]["Companies"] += count
        elif role == UserRole.HEAD_OF_DEPARTMENT:
            chart_dict[day_str]["HODs"] += count
        else:
            chart_dict[day_str]["Others"] += count
            
    data = [v for k, v in sorted(chart_dict.items())]
    return data

@router.get("/reports")
async def get_reports(
    type: str,
    faculty: Optional[str] = None,
    department: Optional[str] = None,
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    if type == "Placement by Faculty":
        placed_query = select(Student.faculty, func.count().label("count")).join(
            Application, Student.id == Application.student_id
        ).where(
            Application.status.in_(['accepted', 'Accepted'])
        ).group_by(Student.faculty)
        
        if faculty and faculty != "All":
            placed_query = placed_query.where(Student.faculty == faculty)
        if department and department != "All":
            placed_query = placed_query.where(Student.department == department)
            
        placed_res = await db.execute(placed_query)
        placed_data = {row.faculty: row.count for row in placed_res.all()}
        
        total_query = select(Student.faculty, func.count().label("count")).group_by(Student.faculty)
        if faculty and faculty != "All":
            total_query = total_query.where(Student.faculty == faculty)
        if department and department != "All":
            total_query = total_query.where(Student.department == department)
            
        total_res = await db.execute(total_query)
        total_data = {row.faculty: row.count for row in total_res.all()}
        
        chart_data = []
        for fac in total_data:
            fac_name = fac if fac else "Unknown"
            placed = placed_data.get(fac, 0)
            unplaced = total_data[fac] - placed
            chart_data.append({"name": fac_name, "Placed": placed, "Unplaced": unplaced})
            
        return {"report_type": type, "data": chart_data}
        
    elif type == "Registrations by Role":
        query = select(User.role, func.count().label("count")).group_by(User.role)
        result = await db.execute(query)
        
        chart_data = []
        for role, count in result.all():
            chart_data.append({"name": role.value if hasattr(role, "value") else str(role), "Count": count})
            
        return {"report_type": type, "data": chart_data}

    return {"report_type": type, "data": []}

@router.get("/departments")
async def get_departments(
    faculty: Optional[str] = None,
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    query = select(Student.department).distinct().where(Student.department != None)
    if faculty and faculty != "All":
        query = query.where(Student.faculty == faculty)
    
    result = await db.execute(query)
    return [row for row in result.scalars().all()]

class MeUpdate(BaseModel):
    first_name: str
    last_name: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

@router.get("/me")
async def get_me(current_user: User = Depends(require_role(UserRole.SUPER_ADMIN))):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "created_at": current_user.created_at
    }

@router.patch("/me")
async def update_me(
    req: MeUpdate,
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.id == current_user.id))
    user = result.scalar_one()
    user.first_name = req.first_name
    user.last_name = req.last_name
    await db.commit()
    return {"message": "Profile updated"}

@router.post("/change-password")
async def change_password(
    req: ChangePasswordRequest,
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.id == current_user.id))
    user = result.scalar_one()
    
    if not verify_password(req.current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Invalid current password")
        
    user.password_hash = hash_password(req.new_password)
    await db.commit()
    return {"message": "Password updated successfully"}

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
    result = await db.execute(select(User).where(User.email == req.email))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Email already registered")
        
    new_user = User(
        email=req.email,
        password_hash=hash_password(req.password),
        first_name=req.first_name,
        last_name=req.last_name,
        role=UserRole.HEAD_OF_DEPARTMENT,
        is_verified=True,
        is_active=True
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

@router.put("/applications/{application_id}/supervisors")
async def override_application_supervisors(
    application_id: int,
    req: AdminUpdateApplicationSupervisorsRequest,
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Application).where(Application.id == application_id))
    application = result.scalar_one_or_none()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
        
    if req.industry_supervisor_id is not None:
        application.industry_supervisor_id = req.industry_supervisor_id
    if req.academic_supervisor_id is not None:
        application.academic_supervisor_id = req.academic_supervisor_id
        
    log_action(db, current_user.id, "override_supervisors", "applications", application_id, req.model_dump(exclude_unset=True))
    await db.commit()
    return {"message": "Application supervisors updated"}

@router.get("/audit-logs")
async def get_audit_logs(
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    from app.models.audit_log import AuditLog
    
    stmt = (
        select(AuditLog, User)
        .outerjoin(User, AuditLog.user_id == User.id)
        .order_by(AuditLog.created_at.desc())
        .limit(limit)
    )
    result = await db.execute(stmt)
    rows = result.all()
    
    logs = []
    for log, user in rows:
        name = f"{user.first_name} {user.last_name}" if user else f"User {log.user_id}"
        time_str = log.created_at.strftime("%Y-%m-%d %H:%M") if log.created_at else ""
        
        color_map = {
            "verify_company": "bg-green-500",
            "verify_hod": "bg-purple-500",
            "delete_user": "bg-red-500",
            "override_supervisors": "bg-amber-500",
            "create_hod": "bg-blue-500"
        }
        color = color_map.get(log.action_type, "bg-neutral-500")
        
        action_formatted = log.action_type.replace("_", " ").title()
        
        logs.append({
            "action": f"{action_formatted} ({log.entity_type} {log.entity_id})",
            "user": name,
            "time": time_str,
            "color": color
        })
        
    return logs

from datetime import timezone

@router.get("/verification/queue", response_model=PaginatedResponse[AdminQueueItem])
async def get_verification_queue(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    tier: Optional[int] = None,
    status: Optional[str] = None,
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    query = select(VerificationSubmission, Company, User).join(
        Company, VerificationSubmission.company_id == Company.id
    ).join(
        User, Company.user_id == User.id
    )
    
    if tier:
        query = query.where(VerificationSubmission.tier == tier)
    if status:
        query = query.where(VerificationSubmission.status == status)
        
    query = query.order_by(VerificationSubmission.submitted_at.desc().nulls_last())
    
    total = await db.scalar(select(func.count()).select_from(query.subquery()))
    result = await db.execute(query.offset((page - 1) * limit).limit(limit))
    rows = result.all()
    
    items = []
    tier_names = {1: "Basic Registration", 2: "Identity Verification", 3: "Quality Assurance", 4: "Premium Partner"}
    
    for sub, comp, user in rows:
        flags = []
        if user.email and any(d in user.email for d in ['@gmail', '@yahoo', '@hotmail', '@outlook']):
            flags.append("Disposable/Free Email")
            
        items.append(AdminQueueItem(
            submission_id=sub.id,
            company_id=comp.id,
            company_name=comp.company_name,
            rep_email=user.email,
            rep_name=f"{user.first_name} {user.last_name}",
            tier=sub.tier,
            tier_name=tier_names.get(sub.tier, f"Tier {sub.tier}"),
            status=sub.status,
            submitted_at=sub.submitted_at,
            auto_flags=flags
        ))
        
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        limit=limit,
        pages=(total + limit - 1) // limit
    )

@router.get("/verification/submissions/{submission_id}", response_model=AdminSubmissionDetail)
async def get_submission_detail(
    submission_id: int,
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    query = select(VerificationSubmission, Company, User).join(
        Company, VerificationSubmission.company_id == Company.id
    ).join(
        User, Company.user_id == User.id
    ).where(VerificationSubmission.id == submission_id)
    
    result = await db.execute(query)
    row = result.first()
    if not row:
        raise HTTPException(status_code=404, detail="Submission not found")
        
    sub, comp, user = row
    return AdminSubmissionDetail(
        submission_id=sub.id,
        company_id=comp.id,
        company_name=comp.company_name,
        tier=sub.tier,
        status=sub.status,
        payload=sub.payload,
        auto_check_result=sub.auto_check_result,
        reviewer_note=sub.reviewer_note,
        submitted_at=sub.submitted_at,
        reviewed_at=sub.reviewed_at,
        rep_name=f"{user.first_name} {user.last_name}",
        rep_email=user.email,
        rep_phone=comp.rep_phone,
        rep_job_title=comp.rep_job_title,
        email_verified=user.is_verified,
        phone_verified=True,  # if they got here, phone was verified
        industry=comp.industry,
        company_size=comp.company_size,
        state=comp.state,
        lga=comp.lga,
        internship_description=comp.internship_description,
        is_individual_verified=comp.is_individual_verified
    )

@router.post("/verification/submissions/{submission_id}/approve")
async def approve_submission(
    submission_id: int,
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    sub_res = await db.execute(select(VerificationSubmission).where(VerificationSubmission.id == submission_id))
    sub = sub_res.scalar_one_or_none()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")
        
    comp_res = await db.execute(select(Company).where(Company.id == sub.company_id))
    comp = comp_res.scalar_one()
    
    sub.status = 'approved'
    sub.reviewer_id = current_user.id
    sub.reviewed_at = datetime.now(timezone.utc)
    
    setattr(comp, f"tier_{sub.tier}_status", 'approved')
    if comp.trust_tier < sub.tier:
        comp.trust_tier = sub.tier

    if sub.tier == 2 and sub.payload:
        method = sub.payload.get("verification_method")
        if method:
            comp.verification_method = method
            if method in ["individual_anchored", "referral"]:
                comp.is_individual_verified = True
        
    db.add(VerificationEvent(
        company_id=comp.id,
        tier=sub.tier,
        to_status='approved',
        actor_id=current_user.id,
        actor_role='SUPER_ADMIN'
    ))
    
    await db.commit()
    return {"success": True}

@router.post("/verification/submissions/{submission_id}/reject")
async def reject_submission(
    submission_id: int,
    body: AdminActionRequest,
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    if not body.note:
        raise HTTPException(status_code=400, detail="Note required for rejection")
        
    sub_res = await db.execute(select(VerificationSubmission).where(VerificationSubmission.id == submission_id))
    sub = sub_res.scalar_one_or_none()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")
        
    comp_res = await db.execute(select(Company).where(Company.id == sub.company_id))
    comp = comp_res.scalar_one()
    
    sub.status = 'rejected'
    sub.reviewer_id = current_user.id
    sub.reviewed_at = datetime.now(timezone.utc)
    sub.reviewer_note = body.note
    
    setattr(comp, f"tier_{sub.tier}_status", 'rejected')
    
    db.add(VerificationEvent(
        company_id=comp.id,
        tier=sub.tier,
        to_status='rejected',
        actor_id=current_user.id,
        actor_role='SUPER_ADMIN',
        reason=body.note
    ))
    
    await db.commit()
    return {"success": True}

@router.post("/verification/submissions/{submission_id}/request-info")
async def request_info_submission(
    submission_id: int,
    body: AdminActionRequest,
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    if not body.note:
        raise HTTPException(status_code=400, detail="Note required")
        
    sub_res = await db.execute(select(VerificationSubmission).where(VerificationSubmission.id == submission_id))
    sub = sub_res.scalar_one_or_none()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")
        
    comp_res = await db.execute(select(Company).where(Company.id == sub.company_id))
    comp = comp_res.scalar_one()
    
    sub.status = 'info_requested'
    sub.reviewer_id = current_user.id
    sub.reviewed_at = datetime.now(timezone.utc)
    sub.reviewer_note = body.note
    
    setattr(comp, f"tier_{sub.tier}_status", 'info_requested')
    
    db.add(VerificationEvent(
        company_id=comp.id,
        tier=sub.tier,
        to_status='info_requested',
        actor_id=current_user.id,
        actor_role='SUPER_ADMIN',
        reason=body.note
    ))
    
    await db.commit()
    return {"success": True}

@router.post("/companies/{company_id}/downgrade")
async def downgrade_company(
    company_id: int,
    body: AdminDowngradeRequest,
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    comp_res = await db.execute(select(Company).where(Company.id == company_id))
    comp = comp_res.scalar_one_or_none()
    if not comp:
        raise HTTPException(status_code=404, detail="Company not found")
        
    old_tier = comp.trust_tier
    comp.trust_tier = body.target_tier
    
    for t in range(body.target_tier + 1, 5):
        setattr(comp, f"tier_{t}_status", None)
        
    db.add(VerificationEvent(
        company_id=comp.id,
        from_tier=old_tier,
        to_tier=body.target_tier,
        actor_id=current_user.id,
        actor_role='SUPER_ADMIN',
        reason=body.reason
    ))
    
    await db.commit()
    return {"success": True}

@router.post("/companies/{company_id}/suspend")
async def suspend_company(
    company_id: int,
    body: AdminSuspendRequest,
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    comp_res = await db.execute(select(Company).where(Company.id == company_id))
    comp = comp_res.scalar_one_or_none()
    if not comp:
        raise HTTPException(status_code=404, detail="Company not found")
        
    comp.suspended_at = datetime.now(timezone.utc)
    comp.suspension_reason = body.reason
    
    db.add(VerificationEvent(
        company_id=comp.id,
        actor_id=current_user.id,
        actor_role='SUPER_ADMIN',
        reason=body.reason
    ))
    
    await db.commit()
    return {"success": True}

@router.get("/companies/{company_id}", response_model=CompanyDetailResponse)
async def get_company_detail(
    company_id: int,
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    comp_res = await db.execute(select(Company).where(Company.id == company_id))
    comp = comp_res.scalar_one_or_none()
    if not comp:
        raise HTTPException(status_code=404, detail="Company not found")
        
    sub_res = await db.execute(select(VerificationSubmission).where(VerificationSubmission.company_id == comp.id).order_by(VerificationSubmission.submitted_at.desc().nulls_last()))
    ev_res = await db.execute(select(VerificationEvent).where(VerificationEvent.company_id == comp.id).order_by(VerificationEvent.created_at.desc()))
    
    submissions = [{"id": s.id, "tier": s.tier, "status": s.status, "submitted_at": s.submitted_at} for s in sub_res.scalars().all()]
    events = [{"id": e.id, "reason": e.reason, "created_at": e.created_at, "to_status": e.to_status, "tier": e.tier} for e in ev_res.scalars().all()]
    
    return CompanyDetailResponse(
        id=comp.id,
        company_name=comp.company_name,
        trust_tier=comp.trust_tier,
        tier_1_status=comp.tier_1_status,
        tier_2_status=comp.tier_2_status,
        tier_3_status=comp.tier_3_status,
        tier_4_status=comp.tier_4_status,
        is_suspended=bool(comp.suspended_at),
        suspension_reason=comp.suspension_reason,
        is_individual_verified=comp.is_individual_verified,
        verification_method=comp.verification_method,
        industry=comp.industry,
        company_size=comp.company_size,
        state=comp.state,
        created_at=comp.created_at,
        submissions=submissions,
        events=events
    )

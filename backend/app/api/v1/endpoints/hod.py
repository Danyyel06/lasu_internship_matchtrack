from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.head_of_department import HeadOfDepartment
from app.models.student import Student
from app.models.application import Application
from app.models.internship import Internship
from app.models.company import Company
from app.models.academic_supervisor_profile import AcademicSupervisorProfile
from app.dependencies import get_current_user, require_role
from app.schemas.pagination import PaginatedResponse

router = APIRouter()


class InterventionResponse(BaseModel):
    method: str
    date: str
    notes: str
    logged_by: str

class HodStudentResponse(BaseModel):
    id: int
    name: str
    matric: str
    company: str
    role: str
    supervisor: str
    status: str
    interventions: List[InterventionResponse] = []

@router.get("/students", response_model=PaginatedResponse[HodStudentResponse])
async def get_department_students(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_role(UserRole.HEAD_OF_DEPARTMENT)),
    db: AsyncSession = Depends(get_db)
):
    # Get HOD profile to know the department
    hod_res = await db.execute(select(HeadOfDepartment).where(HeadOfDepartment.user_id == current_user.id))
    hod = hod_res.scalar_one_or_none()
    if not hod:
        raise HTTPException(status_code=400, detail="HOD profile not found")

    # Get all students in this department
    stmt = select(Student, User).join(User, Student.user_id == User.id).where(Student.department == hod.department)
    result = await db.execute(stmt)
    students = result.all()

    response = []
    for student, user in students:
        # Check placement status
        app_stmt = (
            select(Application, Internship, Company)
            .join(Internship, Application.internship_id == Internship.id)
            .join(Company, Internship.company_id == Company.id)
            .where(Application.student_id == student.id)
            .where(Application.status.in_(['accepted', 'Accepted']))
        )
        app_res = await db.execute(app_stmt)
        accepted_app_row = app_res.first()

        status_str = "Searching"
        company_name = "None"
        role_title = "N/A"
        supervisor_name = "Unassigned"

        if accepted_app_row:
            app, internship, company = accepted_app_row
            status_str = "Placed"
            company_name = company.company_name
            role_title = internship.title

            if app.academic_supervisor_id:
                sup_user_res = await db.execute(select(User).where(User.id == app.academic_supervisor_id))
                sup_user = sup_user_res.scalar_one_or_none()
                if sup_user:
                    supervisor_name = f"{sup_user.first_name} {sup_user.last_name}"

        response.append(HodStudentResponse(
            id=student.id,
            name=f"{user.first_name} {user.last_name}",
            matric=student.matric_no or "N/A",
            company=company_name,
            role=role_title,
            supervisor=supervisor_name,
            status=status_str,
            interventions=[]
        ))

    total = len(response)
    skip = (page - 1) * limit
    paginated_response = response[skip : skip + limit]

    return {
        "items": paginated_response,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit if limit > 0 else 1
    }

class HodSupervisorResponse(BaseModel):
    id: int # this will be user_id
    name: str
    email: str
    role: str
    assignedStudents: int
    maxStudents: int
    status: str

@router.get("/supervisors", response_model=List[HodSupervisorResponse])
async def get_department_supervisors(
    current_user: User = Depends(require_role(UserRole.HEAD_OF_DEPARTMENT)),
    db: AsyncSession = Depends(get_db)
):
    hod_res = await db.execute(select(HeadOfDepartment).where(HeadOfDepartment.user_id == current_user.id))
    hod = hod_res.scalar_one_or_none()
    if not hod:
        raise HTTPException(status_code=400, detail="HOD profile not found")

    stmt = (
        select(AcademicSupervisorProfile, User)
        .join(User, AcademicSupervisorProfile.user_id == User.id)
        .where(AcademicSupervisorProfile.department == hod.department)
    )
    result = await db.execute(stmt)
    rows = result.all()

    response = []
    for profile, user in rows:
        # Count assigned students
        count_stmt = select(func.count(Application.id)).where(Application.academic_supervisor_id == user.id)
        count_res = await db.execute(count_stmt)
        assigned_students = count_res.scalar_one_or_none() or 0

        response.append(HodSupervisorResponse(
            id=user.id,
            name=f"{user.first_name} {user.last_name}",
            email=user.email,
            role="Lecturer",
            assignedStudents=assigned_students,
            maxStudents=20, # hardcoded for now, could be in system settings
            status="Active" if getattr(user, "is_verified", True) else "Pending Invite"
        ))

    return response

class AssignSupervisorRequest(BaseModel):
    supervisor_user_id: int

@router.post("/students/{student_id}/assign-supervisor")
async def assign_academic_supervisor(
    student_id: int,
    payload: AssignSupervisorRequest,
    current_user: User = Depends(require_role(UserRole.HEAD_OF_DEPARTMENT)),
    db: AsyncSession = Depends(get_db)
):
    # Find the accepted application for the student
    stmt = select(Application).where(Application.student_id == student_id, Application.status.in_(['accepted', 'Accepted']))
    result = await db.execute(stmt)
    application = result.scalar_one_or_none()

    if not application:
        raise HTTPException(status_code=400, detail="Student has no accepted application")

    application.academic_supervisor_id = payload.supervisor_user_id
    await db.commit()
    return {"message": "Assigned successfully"}

class CreateSupervisorRequest(BaseModel):
    name: str
    email: str
    title: str

@router.post("/supervisors")
async def create_supervisor(
    payload: CreateSupervisorRequest,
    current_user: User = Depends(require_role(UserRole.HEAD_OF_DEPARTMENT)),
    db: AsyncSession = Depends(get_db)
):
    import secrets
    hod_res = await db.execute(select(HeadOfDepartment).where(HeadOfDepartment.user_id == current_user.id))
    hod = hod_res.scalar_one_or_none()
    if not hod:
        raise HTTPException(status_code=400, detail="HOD profile not found")

    # Check if user exists
    existing = await db.execute(select(User).where(User.email == payload.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="User already exists")

    parts = payload.name.split(" ")
    first_name = parts[0]
    last_name = " ".join(parts[1:]) if len(parts) > 1 else ""

    from app.core.security import hash_password

    # Generate a secure, unique activation token
    activation_token = secrets.token_urlsafe(32)

    # Create User — account is not yet activated; no usable password yet
    user = User(
        email=payload.email,
        password_hash=hash_password(secrets.token_hex(16)),  # placeholder — replaced on activation
        first_name=first_name,
        last_name=last_name,
        role=UserRole.ACADEMIC_SUPERVISOR,
        is_verified=False,
        is_activated=False,
        activation_token=activation_token,
    )
    db.add(user)
    await db.flush()

    profile = AcademicSupervisorProfile(
        user_id=user.id,
        head_of_department_id=hod.id,
        department=hod.department
    )
    db.add(profile)
    await db.commit()

    # Build the activation URL (dev mode: returned in response so no email needed)
    activation_url = f"http://localhost:5173/academic-supervisor/activate?token={activation_token}"

    return {
        "message": "Supervisor created",
        "activation_url": activation_url,  # Dev mode: copy this link to activate
    }

@router.get("/dashboard-stats")
async def get_dashboard_stats(
    current_user: User = Depends(require_role(UserRole.HEAD_OF_DEPARTMENT)),
    db: AsyncSession = Depends(get_db)
):
    hod_res = await db.execute(select(HeadOfDepartment).where(HeadOfDepartment.user_id == current_user.id))
    hod = hod_res.scalar_one_or_none()
    if not hod:
        raise HTTPException(status_code=400, detail="HOD profile not found")

    # Total students
    total_students_res = await db.execute(
        select(func.count(Student.id)).where(Student.department == hod.department)
    )
    total_students = total_students_res.scalar() or 0

    # Placed students
    placed_students_res = await db.execute(
        select(func.count(Application.id))
        .join(Student, Application.student_id == Student.id)
        .where(Student.department == hod.department)
        .where(Application.status.in_(['accepted', 'Accepted']))
    )
    placed_students = placed_students_res.scalar() or 0

    # Total supervisors
    total_supervisors_res = await db.execute(
        select(func.count(AcademicSupervisorProfile.id))
        .where(AcademicSupervisorProfile.department == hod.department)
    )
    total_supervisors = total_supervisors_res.scalar() or 0

    # Active alerts
    # Just a placeholder for now since we haven't implemented alerts logic fully
    active_alerts = 0

    return {
        "total_students": total_students,
        "placed_students": placed_students,
        "total_supervisors": total_supervisors,
        "active_alerts": active_alerts
    }

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
    # Dummy alerts data until the notification and websocket systems are fully built
    return []

@router.get("/reports/placement-stats")
async def get_placement_stats(
    current_user: User = Depends(require_role(UserRole.HEAD_OF_DEPARTMENT)),
    db: AsyncSession = Depends(get_db)
):
    hod_res = await db.execute(select(HeadOfDepartment).where(HeadOfDepartment.user_id == current_user.id))
    hod = hod_res.scalar_one_or_none()
    if not hod:
        raise HTTPException(status_code=400, detail="HOD profile not found")

    # Fetch all students in this department
    stmt = select(Student).where(Student.department == hod.department)
    result = await db.execute(stmt)
    students = result.scalars().all()
    
    # Check placement status for each student
    app_stmt = (
        select(Application.student_id, Company.industry)
        .join(Internship, Application.internship_id == Internship.id)
        .join(Company, Internship.company_id == Company.id)
        .where(Application.status.in_(['accepted', 'Accepted']))
    )
    app_res = await db.execute(app_stmt)
    accepted_apps = app_res.all()
    
    placed_student_dict = {row.student_id: row.industry for row in accepted_apps}
    
    industry_counts = {}
    level_counts = {}
    
    for student in students:
        lvl = str(student.level) if student.level else "Unknown"
        if lvl not in level_counts:
            level_counts[lvl] = {"placed": 0, "unplaced": 0}
            
        if student.id in placed_student_dict:
            level_counts[lvl]["placed"] += 1
            ind = placed_student_dict[student.id] or "Other"
            industry_counts[ind] = industry_counts.get(ind, 0) + 1
        else:
            level_counts[lvl]["unplaced"] += 1

    placementByIndustry = [{"name": k, "value": v} for k, v in industry_counts.items()]
    placementByLevel = [
        {"name": f"{k} Level" if k != "Unknown" else "Unknown Level", "placed": v["placed"], "unplaced": v["unplaced"]} 
        for k, v in level_counts.items()
    ]
    
    return {
        "placementByIndustry": placementByIndustry,
        "placementByLevel": placementByLevel
    }

class HodProfileUpdate(BaseModel):
    first_name: str
    last_name: str
    phone_number: str | None = None
    office_location: str | None = None

@router.get("/profile")
async def get_hod_profile(
    current_user: User = Depends(require_role(UserRole.HEAD_OF_DEPARTMENT)),
    db: AsyncSession = Depends(get_db)
):
    hod_res = await db.execute(select(HeadOfDepartment).where(HeadOfDepartment.user_id == current_user.id))
    hod = hod_res.scalar_one_or_none()
    if not hod:
        raise HTTPException(status_code=400, detail="HOD profile not found")
        
    return {
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "email": current_user.email,
        "department_name": hod.department,
        "faculty": hod.faculty or "N/A",
        "department": hod.department,
        "is_verified": hod.is_admin_verified,
        "phone_number": hod.phone_number or "",
        "office_location": hod.office_location or ""
    }

@router.put("/profile")
async def update_hod_profile(
    req: HodProfileUpdate,
    current_user: User = Depends(require_role(UserRole.HEAD_OF_DEPARTMENT)),
    db: AsyncSession = Depends(get_db)
):
    hod_res = await db.execute(select(HeadOfDepartment).where(HeadOfDepartment.user_id == current_user.id))
    hod = hod_res.scalar_one_or_none()
    if not hod:
        raise HTTPException(status_code=400, detail="HOD profile not found")
        
    current_user.first_name = req.first_name
    current_user.last_name = req.last_name
    
    hod.phone_number = req.phone_number
    hod.office_location = req.office_location
    
    await db.commit()
    return {"message": "Profile updated successfully"}

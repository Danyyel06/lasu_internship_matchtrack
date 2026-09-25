from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.db.session import get_db
from app.dependencies import require_role
from app.models.user import User, UserRole
from app.models.student import Student
from app.models.company import Company
from app.models.internship import Internship
from app.models.application import Application
from app.schemas.application import ApplicationCreate, ApplicationResponse, ApplicationCompanyResponse, ApplicationStudentResponse
from app.schemas.pagination import PaginatedResponse
from app.services.matching import FitScoreCalculator, TierBander
from datetime import datetime
from sqlalchemy.orm import selectinload

router = APIRouter()

@router.post("/", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
async def create_application(
    payload: ApplicationCreate,
    current_user: User = Depends(require_role(UserRole.STUDENT)),
    db: AsyncSession = Depends(get_db)
):
    """Student applies for an internship."""
    # Find student record
    result = await db.execute(select(Student).where(Student.user_id == current_user.id))
    student = result.scalar_one_or_none()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found."
        )

    # Verify internship exists
    internship_res = await db.execute(select(Internship).where(Internship.id == payload.internship_id))
    internship = internship_res.scalar_one_or_none()

    if not internship:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Internship not found."
        )

    # Check if student is already placed
    accepted_app_res = await db.execute(
        select(Application).where(
            Application.student_id == student.id,
            Application.status == 'accepted'
        )
    )
    if accepted_app_res.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already accepted an internship placement and cannot apply for other roles."
        )

    # Check if already applied
    app_res = await db.execute(
        select(Application).where(
            Application.student_id == student.id,
            Application.internship_id == payload.internship_id
        )
    )
    if app_res.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already applied for this internship."
        )

    # Calculate real fit score for this specific internship
    fit_score = await FitScoreCalculator.calculate_fit_score(student.id, internship.id, db)
    tier = TierBander.assign_tier(fit_score)

    application = Application(
        student_id=student.id,
        internship_id=internship.id,
        fit_score=fit_score,
        tier_at_application=tier,
        status="applied"
    )
    db.add(application)
    await db.commit()
    await db.refresh(application)

    return application

@router.get("/mine", response_model=List[ApplicationStudentResponse])
async def get_my_applications(
    current_user: User = Depends(require_role(UserRole.STUDENT)),
    db: AsyncSession = Depends(get_db)
):
    """Student views their own applications."""
    # Find student record
    result = await db.execute(select(Student).where(Student.user_id == current_user.id))
    student = result.scalar_one_or_none()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found."
        )

    stmt = select(Application, Internship, Company).join(
        Internship, Application.internship_id == Internship.id
    ).join(
        Company, Internship.company_id == Company.id
    ).where(Application.student_id == student.id)
    
    app_result = await db.execute(stmt)
    rows = app_result.all()

    response_data = []
    for app, internship, company in rows:
        app_dict = {
            "id": app.id,
            "student_id": app.student_id,
            "internship_id": app.internship_id,
            "fit_score": app.fit_score,
            "tier_at_application": app.tier_at_application,
            "status": app.status,
            "industry_supervisor_id": app.industry_supervisor_id,
            "academic_supervisor_id": app.academic_supervisor_id,
            "applied_at": app.applied_at,
            "decided_at": app.decided_at,
            "company_name": company.company_name,
            "role": internship.title,
            "track_type": internship.track_type,
        }
        response_data.append(app_dict)

    return response_data

@router.get("/company", response_model=PaginatedResponse[ApplicationCompanyResponse])
async def get_company_applications(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_role(UserRole.COMPANY_REP)),
    db: AsyncSession = Depends(get_db)
):
    """Company views applications for their internships."""
    result = await db.execute(select(Company).where(Company.user_id == current_user.id))
    company = result.scalar_one_or_none()
    
    if not company:
        raise HTTPException(status_code=404, detail="Company profile not found.")

    from sqlalchemy.orm import selectinload
    stmt = (
        select(Application, Student, User, Internship)
        .join(Internship, Application.internship_id == Internship.id)
        .join(Student, Application.student_id == Student.id)
        .join(User, Student.user_id == User.id)
        .where(Internship.company_id == company.id)
        .options(
            selectinload(Student.skills),
            selectinload(Internship.requirements)
        )
    )
    
    app_result = await db.execute(stmt)
    rows = app_result.all()

    response_data = []
    
    # We will separate by track type to sort equity track correctly
    equity_apps = []
    competitive_apps = []

    for app, student, user, internship in rows:
        # Calculate Gap Analysis
        student_skills_dict = {s.skill_name.lower(): (s.verified_level or 0) for s in student.skills}
        gap_analysis = []
        for req in internship.requirements:
            student_level = student_skills_dict.get(req.skill_name.lower(), 0)
            req_level = req.required_level or 0
            meets = student_level >= req_level
            gap_analysis.append({
                "skill_name": req.skill_name,
                "meets_requirement": meets,
                "gap": max(0, req_level - student_level)
            })

        app_dict = {
            "id": app.id,
            "application_id": app.id,
            "student_id": app.student_id,
            "internship_id": app.internship_id,
            "fit_score": app.fit_score,
            "tier_at_application": app.tier_at_application,
            "tier": app.tier_at_application,
            "status": app.status,
            "industry_supervisor_id": app.industry_supervisor_id,
            "academic_supervisor_id": app.academic_supervisor_id,
            "applied_at": app.applied_at,
            "decided_at": app.decided_at,
            "applicant_name": f"{user.first_name} {user.last_name}",
            "role": internship.title,
            "track": internship.track_type,
            "gap_analysis": gap_analysis
        }
        
        if internship.track_type == "equity":
            equity_apps.append(app_dict)
        else:
            competitive_apps.append(app_dict)
            
    # T1->T2->T3 Interleaving for Equity Track
    t1_apps = [a for a in equity_apps if a["tier"] == "T1"]
    t2_apps = [a for a in equity_apps if a["tier"] == "T2"]
    t3_apps = [a for a in equity_apps if a["tier"] == "T3"]
    
    interleaved_equity = []
    while t1_apps or t2_apps or t3_apps:
        if t1_apps: interleaved_equity.append(t1_apps.pop(0))
        if t2_apps: interleaved_equity.append(t2_apps.pop(0))
        if t3_apps: interleaved_equity.append(t3_apps.pop(0))

    response_data = competitive_apps + interleaved_equity
    
    total = len(response_data)
    skip = (page - 1) * limit
    paginated_data = response_data[skip : skip + limit]

    return {
        "items": paginated_data,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit if limit > 0 else 1
    }

@router.delete("/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
async def withdraw_application(
    application_id: int,
    current_user: User = Depends(require_role(UserRole.STUDENT)),
    db: AsyncSession = Depends(get_db)
):
    """Student withdraws an application that is still pending."""
    result = await db.execute(select(Student).where(Student.user_id == current_user.id))
    student = result.scalar_one_or_none()
    
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found.")

    app_res = await db.execute(select(Application).where(
        Application.id == application_id,
        Application.student_id == student.id
    ))
    application = app_res.scalar_one_or_none()
    
    if not application:
        raise HTTPException(status_code=404, detail="Application not found or unauthorized.")
        
    if application.status not in ["applied", "pending", "shortlisted"]:
        raise HTTPException(status_code=400, detail="Can only withdraw pending or shortlisted applications.")
        
    await db.delete(application)
    await db.commit()
    return None

from pydantic import BaseModel
class StatusUpdate(BaseModel):
    status: str

@router.put("/{application_id}/status", response_model=ApplicationResponse)
async def update_application_status(
    application_id: int,
    payload: StatusUpdate,
    current_user: User = Depends(require_role(UserRole.COMPANY_REP)),
    db: AsyncSession = Depends(get_db)
):
    """Company accepts or declines an application."""
    result = await db.execute(select(Company).where(Company.user_id == current_user.id))
    company = result.scalar_one_or_none()
    
    if not company:
        raise HTTPException(status_code=404, detail="Company profile not found.")

    stmt = select(Application).join(Internship).where(
        Application.id == application_id,
        Internship.company_id == company.id
    )
    app_result = await db.execute(stmt)
    application = app_result.scalar_one_or_none()
    
    if not application:
        raise HTTPException(status_code=404, detail="Application not found.")

    application.status = payload.status
    if payload.status in ["Accepted", "Declined", "accepted", "declined"]:
        application.decided_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(application)

    return application

class AssignSupervisorRequest(BaseModel):
    supervisor_user_id: int

@router.put("/{application_id}/assign_supervisor", response_model=ApplicationResponse)
async def assign_supervisor(
    application_id: int,
    payload: AssignSupervisorRequest,
    current_user: User = Depends(require_role(UserRole.COMPANY_REP)),
    db: AsyncSession = Depends(get_db)
):
    """Company Rep assigns an industry supervisor to an accepted intern."""
    result = await db.execute(select(Company).where(Company.user_id == current_user.id))
    company = result.scalar_one_or_none()
    
    if not company:
        raise HTTPException(status_code=404, detail="Company profile not found.")

    stmt = select(Application).join(Internship).where(
        Application.id == application_id,
        Internship.company_id == company.id
    )
    app_result = await db.execute(stmt)
    application = app_result.scalar_one_or_none()
    
    if not application:
        raise HTTPException(status_code=404, detail="Application not found.")

    # Optional: verify the supervisor exists and belongs to this company
    from app.models.industry_supervisor_profile import IndustrySupervisorProfile
    sup_res = await db.execute(select(IndustrySupervisorProfile).where(
        IndustrySupervisorProfile.user_id == payload.supervisor_user_id,
        IndustrySupervisorProfile.company_id == company.id
    ))
    if not sup_res.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Invalid supervisor profile.")

    application.industry_supervisor_id = payload.supervisor_user_id
    
    await db.commit()
    await db.refresh(application)

    return application


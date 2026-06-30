from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.db.session import get_db
from pydantic import BaseModel
from app.dependencies import get_current_user, require_role
from app.models.user import User, UserRole
from app.models.company import Company
from app.schemas.auth import TokenResponse
from app.schemas.company import CompanyRegisterRequest, CompanyOnboardingRequest, CompanyResponse, SupervisorResponse, CreateSupervisorRequest
from app.core.security import hash_password, create_access_token, create_refresh_token

router = APIRouter()

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register_company(body: CompanyRegisterRequest, db: AsyncSession = Depends(get_db)):
    """Register a new company representative and an empty company."""
    # Check if email already exists
    result = await db.execute(select(User).where(User.email == body.email))
    existing_user = result.scalar_one_or_none()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists",
        )

    # Create the new user
    user = User(
        email=body.email,
        password_hash=hash_password(body.password),
        role=UserRole.COMPANY_REP,
        first_name=body.first_name,
        last_name=body.last_name,
    )
    db.add(user)
    await db.flush()

    # Create the empty company
    company = Company(
        user_id=user.id,
        company_name=body.company_name
    )
    db.add(company)
    await db.commit()

    # Generate tokens
    token_data = {
        "sub": str(user.id),
        "role": user.role.value if isinstance(user.role, UserRole) else user.role,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "is_onboarded": False,
        "company_name": company.company_name
    }
    access_token = create_access_token(data=token_data)
    refresh_token = create_refresh_token(data=token_data)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer"
    )

@router.post("/onboarding", response_model=CompanyResponse)
async def complete_company_onboarding(
    payload: CompanyOnboardingRequest,
    current_user: User = Depends(require_role(UserRole.COMPANY_REP)),
    db: AsyncSession = Depends(get_db)
):
    """Complete company onboarding by updating the company profile."""
    result = await db.execute(select(Company).where(Company.user_id == current_user.id))
    existing_company = result.scalar_one_or_none()
    
    if not existing_company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company record not found."
        )

    if payload.registration_no:
        existing_company.registration_no = payload.registration_no
    if payload.industry:
        existing_company.industry = payload.industry
    if payload.company_address:
        existing_company.company_address = payload.company_address
    if payload.company_website:
        existing_company.company_website = payload.company_website
    if payload.company_logo_url:
        existing_company.company_logo_url = payload.company_logo_url
    if payload.company_size:
        existing_company.company_size = payload.company_size

    await db.commit()
    await db.refresh(existing_company)

    return existing_company

@router.get("/supervisors", response_model=list[SupervisorResponse])
async def get_supervisors(
    current_user: User = Depends(require_role(UserRole.COMPANY_REP)),
    db: AsyncSession = Depends(get_db)
):
    from app.models.industry_supervisor_profile import IndustrySupervisorProfile
    from app.models.application import Application
    from sqlalchemy.orm import aliased
    
    # Get company ID
    comp_res = await db.execute(select(Company.id).where(Company.user_id == current_user.id))
    company_id = comp_res.scalar_one_or_none()
    
    if not company_id:
        return []
        
    stmt = (
        select(User, IndustrySupervisorProfile, func.count(Application.id).label('interns_assigned'))
        .join(IndustrySupervisorProfile, User.id == IndustrySupervisorProfile.user_id)
        .outerjoin(Application, Application.industry_supervisor_id == IndustrySupervisorProfile.id)
        .where(IndustrySupervisorProfile.company_id == company_id)
        .group_by(User.id, IndustrySupervisorProfile.id)
    )
    result = await db.execute(stmt)
    rows = result.all()
    
    supervisors = []
    for user, profile, interns_assigned in rows:
        supervisors.append({
            "id": profile.id,
            "user_id": user.id,
            "name": f"{user.first_name} {user.last_name}",
            "title": "Industry Supervisor", # or add a field to profile
            "email": user.email,
            "interns_assigned": interns_assigned,
            "status": "Active" if user.is_verified else "Pending"
        })
        
    return supervisors

@router.post("/supervisors", response_model=SupervisorResponse)
async def create_supervisor(
    payload: CreateSupervisorRequest,
    current_user: User = Depends(require_role(UserRole.COMPANY_REP)),
    db: AsyncSession = Depends(get_db)
):
    from app.models.industry_supervisor_profile import IndustrySupervisorProfile
    from app.core.security import hash_password
    import secrets

    # Get company ID
    comp_res = await db.execute(select(Company.id).where(Company.user_id == current_user.id))
    company_id = comp_res.scalar_one_or_none()
    
    if not company_id:
        raise HTTPException(status_code=400, detail="Company not found")

    # Check email exists
    user_res = await db.execute(select(User).where(User.email == payload.work_email))
    if user_res.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    # Split name
    names = payload.full_name.split(" ", 1)
    first_name = names[0]
    last_name = names[1] if len(names) > 1 else ""

    # Create User
    new_user = User(
        email=payload.work_email,
        password_hash=hash_password("mypassword123"), # Hardcoded for testing
        role=UserRole.INDUSTRY_SUPERVISOR,
        first_name=first_name,
        last_name=last_name,
        is_verified=True # Auto-verify for testing
    )
    db.add(new_user)
    await db.flush()

    # Create Profile
    new_profile = IndustrySupervisorProfile(
        user_id=new_user.id,
        company_id=company_id
    )
    db.add(new_profile)
    await db.commit()

    return {
        "id": new_profile.id,
        "user_id": new_user.id,
        "name": payload.full_name,
        "title": payload.job_title,
        "email": payload.work_email,
        "interns_assigned": 0,
        "status": "Pending"
    }

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

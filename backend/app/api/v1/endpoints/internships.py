from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from typing import List

from app.db.session import get_db
from app.dependencies import get_current_user, get_current_user_optional, require_role
from app.models.user import User, UserRole
from app.models.company import Company
from app.models.student import Student
from app.models.internship import Internship, InternshipRequirement
from app.schemas.internship import InternshipCreate, InternshipUpdate, InternshipResponse, InternshipPublicResponse
from app.core.redis import get_redis
import redis.asyncio as redis
from app.services.matching import FitScoreCalculator, GapAnalyser
from app.services.capability_checker import get_capabilities

router = APIRouter()

@router.get("/company", response_model=List[InternshipPublicResponse])
async def get_company_internships(
    current_user: User = Depends(require_role(UserRole.COMPANY_REP)),
    db: AsyncSession = Depends(get_db)
):
    """Company views their own internships."""
    from sqlalchemy.orm import selectinload
    
    result = await db.execute(select(Company).where(Company.user_id == current_user.id))
    company = result.scalar_one_or_none()
    
    if not company:
        raise HTTPException(status_code=404, detail="Company profile not found.")

    query = select(Internship, Company).join(
        Company, Internship.company_id == Company.id
    ).options(selectinload(Internship.requirements)).where(Internship.company_id == company.id)
    
    result = await db.execute(query)
    internships_rows = result.all()

    response_data = []
    for inc, comp in internships_rows:
        inc_dict = {
            "id": inc.id,
            "company_id": inc.company_id,
            "title": inc.title,
            "description": inc.description,
            "location": inc.location,
            "duration_weeks": inc.duration_weeks,
            "stipend": inc.stipend,
            "application_deadline": inc.application_deadline,
            "job_family_id": inc.job_family_id,
            "sub_role_id": inc.sub_role_id,
            "track_type": inc.track_type,
            "total_slots": inc.total_slots,
            "accepted_tiers": inc.accepted_tiers,
            "status": inc.status,
            "created_at": inc.created_at,
            "requirements": inc.requirements,
            "match_percentage": 0.0,
            "company_name": comp.company_name,
            "is_individual_verified": comp.is_individual_verified,
            "verification_method": comp.verification_method,
            "trust_tier": comp.trust_tier,
        }
        response_data.append(inc_dict)

    return response_data

@router.get("/recommended", response_model=List[InternshipPublicResponse])
async def get_recommended_internships(
    current_user: User = Depends(require_role(UserRole.STUDENT)),
    db: AsyncSession = Depends(get_db),
    redis_client: redis.Redis = Depends(get_redis)
):
    from sqlalchemy.orm import selectinload
    
    student_res = await db.execute(select(Student).where(Student.user_id == current_user.id))
    student = student_res.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    query = select(Internship, Company).join(
        Company, Internship.company_id == Company.id
    ).options(selectinload(Internship.requirements)).where(Internship.status == "open")
    
    result = await db.execute(query)
    internships_rows = result.all()

    scored_internships = []
    for inc, comp in internships_rows:
        cache_key = f"fit_score:{student.id}:{inc.id}"
        fit_score_str = await redis_client.get(cache_key) if redis_client else None
        
        if fit_score_str:
            fit_score = float(fit_score_str)
        else:
            fit_score = await FitScoreCalculator.calculate_fit_score(student.id, inc.id, db)
            if redis_client:
                await redis_client.setex(cache_key, 3600, str(fit_score))

        gap_analysis = None
        if student:
            gap_analysis = await GapAnalyser.analyse_gaps(student.id, inc.id, db)

        inc_dict = {
            "id": inc.id,
            "company_id": inc.company_id,
            "title": inc.title,
            "description": inc.description,
            "location": inc.location,
            "duration_weeks": inc.duration_weeks,
            "stipend": inc.stipend,
            "application_deadline": inc.application_deadline,
            "job_family_id": inc.job_family_id,
            "sub_role_id": inc.sub_role_id,
            "track_type": inc.track_type,
            "total_slots": inc.total_slots,
            "accepted_tiers": inc.accepted_tiers,
            "status": inc.status,
            "created_at": inc.created_at,
            "requirements": inc.requirements,
            "match_percentage": round(fit_score, 1),
            "company_name": comp.company_name,
            "is_individual_verified": comp.is_individual_verified,
            "verification_method": comp.verification_method,
            "trust_tier": comp.trust_tier,
            "gap_analysis": gap_analysis
        }
        scored_internships.append(inc_dict)

    scored_internships.sort(key=lambda x: x["match_percentage"], reverse=True)
    return scored_internships[:3]

@router.get("/{internship_id}", response_model=InternshipPublicResponse)
async def get_internship(
    internship_id: int, 
    current_user: User | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
    redis_client: redis.Redis = Depends(get_redis)
):
    from sqlalchemy.orm import selectinload
    stmt = select(Internship, Company).join(
        Company, Internship.company_id == Company.id
    ).options(selectinload(Internship.requirements)).where(Internship.id == internship_id)
    
    result = await db.execute(stmt)
    row = result.first()
    if not row:
        raise HTTPException(status_code=404, detail="Internship not found")
        
    inc, comp = row
    
    match_percentage = 0.0
    gap_analysis = None

    if current_user and current_user.role == UserRole.STUDENT:
        student_res = await db.execute(select(Student).where(Student.user_id == current_user.id))
        student = student_res.scalar_one_or_none()
        if student:
            cache_key = f"fit_score:{student.id}:{inc.id}"
            fit_score_str = await redis_client.get(cache_key) if redis_client else None
            if fit_score_str:
                match_percentage = float(fit_score_str)
            else:
                match_percentage = await FitScoreCalculator.calculate_fit_score(student.id, inc.id, db)
                if redis_client:
                    await redis_client.setex(cache_key, 3600, str(match_percentage))
            
            gap_analysis = await GapAnalyser.analyse_gaps(student.id, inc.id, db)
    
    inc_dict = {
        "id": inc.id,
        "company_id": inc.company_id,
        "title": inc.title,
        "description": inc.description,
        "location": inc.location,
        "duration_weeks": inc.duration_weeks,
        "stipend": inc.stipend,
        "application_deadline": inc.application_deadline,
        "job_family_id": inc.job_family_id,
        "sub_role_id": inc.sub_role_id,
        "track_type": inc.track_type,
        "total_slots": inc.total_slots,
        "accepted_tiers": inc.accepted_tiers,
        "status": inc.status,
        "created_at": inc.created_at,
        "requirements": inc.requirements,
        "match_percentage": round(match_percentage, 1),
        "company_name": comp.company_name,
        "is_individual_verified": comp.is_individual_verified,
        "verification_method": comp.verification_method,
        "trust_tier": comp.trust_tier,
        "gap_analysis": gap_analysis
    }
    return inc_dict


@router.post("/", response_model=InternshipResponse, status_code=status.HTTP_201_CREATED)
async def create_internship(
    payload: InternshipCreate,
    current_user: User = Depends(require_role(UserRole.COMPANY_REP)),
    db: AsyncSession = Depends(get_db)
):
    """Post a new internship (Company Rep only)."""
    # Verify company is verified? Maybe just check if company exists.
    result = await db.execute(select(Company).where(Company.user_id == current_user.id))
    company = result.scalar_one_or_none()
    
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found for the current user."
        )

    # Enforce Level / Tier Capabilities
    caps = get_capabilities(company.trust_tier, {})
    if not caps.get("post_internship"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Companies must complete at least Level 2 verification to post internships."
        )

    max_postings = caps.get("post_internship_max")
    if max_postings is not None:
        active_count = await db.scalar(
            select(func.count(Internship.id)).where(
                Internship.company_id == company.id,
                Internship.status != "closed"
            )
        )
        if (active_count or 0) >= max_postings:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Your company has reached the limit of {max_postings} active internship postings allowed for Level {company.trust_tier} verification. Upgrade to Level 3 for unlimited postings, or close an existing posting."
            )
    
    internship = Internship(
        company_id=company.id,
        title=payload.title,
        description=payload.description,
        location=payload.location,
        duration_weeks=payload.duration_weeks,
        stipend=payload.stipend,
        application_deadline=payload.application_deadline,
        job_family_id=payload.job_family_id,
        sub_role_id=payload.sub_role_id,
        track_type=payload.track_type,
        total_slots=payload.total_slots,
        accepted_tiers=payload.accepted_tiers,
        status=payload.status
    )
    db.add(internship)
    await db.flush()

    if payload.requirements:
        for req in payload.requirements:
            new_req = InternshipRequirement(
                internship_id=internship.id,
                skill_name=req.skill_name,
                required_level=req.required_level,
                is_mandatory=req.is_mandatory
            )
            db.add(new_req)

    await db.commit()
    await db.refresh(internship)

    # To load the requirements correctly, we need to load them or return as is and let the ORM handle it if lazy='selectin'. 
    # A simple way to guarantee it's loaded in async is to refresh it with the relationship, but we'll re-query it to be safe.
    from sqlalchemy.orm import selectinload
    stmt = select(Internship).options(selectinload(Internship.requirements)).where(Internship.id == internship.id)
    result = await db.execute(stmt)
    full_internship = result.scalar_one()

    return full_internship

@router.put("/{internship_id}", response_model=InternshipResponse)
async def update_internship(
    internship_id: int,
    payload: InternshipUpdate,
    current_user: User = Depends(require_role(UserRole.COMPANY_REP)),
    db: AsyncSession = Depends(get_db)
):
    """Update an existing internship (Company Rep only)."""
    result = await db.execute(select(Company).where(Company.user_id == current_user.id))
    company = result.scalar_one_or_none()
    
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found for the current user."
        )

    from sqlalchemy.orm import selectinload
    stmt = select(Internship).options(selectinload(Internship.requirements)).where(
        Internship.id == internship_id, Internship.company_id == company.id
    )
    res = await db.execute(stmt)
    internship = res.scalar_one_or_none()
    
    if not internship:
        raise HTTPException(status_code=404, detail="Internship not found or you don't have permission to edit it.")

    update_data = payload.model_dump(exclude_unset=True)
    requirements_data = update_data.pop("requirements", None)

    for field, value in update_data.items():
        setattr(internship, field, value)

    if requirements_data is not None:
        # Delete old requirements
        for req in internship.requirements:
            await db.delete(req)
        
        # Add new requirements
        for req_data in requirements_data:
            new_req = InternshipRequirement(
                internship_id=internship.id,
                skill_name=req_data["skill_name"],
                required_level=req_data.get("required_level"),
                is_mandatory=req_data.get("is_mandatory", True)
            )
            db.add(new_req)

    await db.commit()
    
    # Reload with requirements
    stmt_reload = select(Internship).options(selectinload(Internship.requirements)).where(Internship.id == internship.id)
    res_reload = await db.execute(stmt_reload)
    return res_reload.scalar_one()

@router.delete("/{internship_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_internship(
    internship_id: int,
    current_user: User = Depends(require_role(UserRole.COMPANY_REP)),
    db: AsyncSession = Depends(get_db)
):
    """Delete an internship posting (Company Rep only)."""
    result = await db.execute(select(Company).where(Company.user_id == current_user.id))
    company = result.scalar_one_or_none()
    
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found for the current user."
        )

    stmt = select(Internship).where(
        Internship.id == internship_id, Internship.company_id == company.id
    )
    res = await db.execute(stmt)
    internship = res.scalar_one_or_none()
    
    if not internship:
        raise HTTPException(status_code=404, detail="Internship not found or unauthorized.")
        
    await db.delete(internship)
    await db.commit()
    return None


from pydantic import BaseModel as PydanticBase
class InternshipStatusUpdate(PydanticBase):
    status: str  # "open", "closed", "draft"

@router.patch("/{internship_id}/status", status_code=200)
async def update_internship_status(
    internship_id: int,
    payload: InternshipStatusUpdate,
    current_user: User = Depends(require_role(UserRole.COMPANY_REP)),
    db: AsyncSession = Depends(get_db)
):
    """Close or reopen an internship posting."""
    result = await db.execute(select(Company).where(Company.user_id == current_user.id))
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    stmt = select(Internship).where(
        Internship.id == internship_id, Internship.company_id == company.id
    )
    res = await db.execute(stmt)
    internship = res.scalar_one_or_none()
    if not internship:
        raise HTTPException(status_code=404, detail="Internship not found or unauthorized.")

    allowed = {"open", "closed", "draft"}
    if payload.status not in allowed:
        raise HTTPException(status_code=400, detail=f"Status must be one of: {', '.join(allowed)}")

    internship.status = payload.status
    await db.commit()
    return {"id": internship.id, "status": internship.status}


@router.get("/", response_model=List[InternshipPublicResponse])
async def search_internships(
    job_family_id: int | None = Query(None),
    track_type: str | None = Query(None),
    location: str | None = Query(None),
    min_stipend: float | None = Query(None),
    max_stipend: float | None = Query(None),
    duration: int | None = Query(None),
    keyword: str | None = Query(None),
    current_user: User | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
    redis_client: redis.Redis = Depends(get_redis)
):
    """Search public internships with filters."""
    from sqlalchemy.orm import selectinload
    
    query = select(Internship, Company).join(
        Company, Internship.company_id == Company.id
    ).options(selectinload(Internship.requirements)).where(Internship.status == "open")

    if job_family_id is not None:
        query = query.where(Internship.job_family_id == job_family_id)
    if track_type:
        query = query.where(Internship.track_type == track_type)
    if location:
        query = query.where(Internship.location.ilike(f"%{location}%"))
    if min_stipend is not None:
        query = query.where(Internship.stipend >= min_stipend)
    if max_stipend is not None:
        query = query.where(Internship.stipend <= max_stipend)
    if duration is not None:
        query = query.where(Internship.duration_weeks == duration)
    if keyword:
        query = query.where(
            (Internship.title.ilike(f"%{keyword}%")) | 
            (Internship.description.ilike(f"%{keyword}%"))
        )

    result = await db.execute(query)
    internships_rows = result.all()

    student = None
    if current_user and current_user.role == UserRole.STUDENT:
        student_res = await db.execute(select(Student).where(Student.user_id == current_user.id))
        student = student_res.scalar_one_or_none()

    response_data = []
    for inc, comp in internships_rows:
        match_percentage = 0.0
        
        if student:
            cache_key = f"fit_score:{student.id}:{inc.id}"
            fit_score_str = await redis_client.get(cache_key) if redis_client else None
            if fit_score_str:
                match_percentage = float(fit_score_str)
            else:
                match_percentage = await FitScoreCalculator.calculate_fit_score(student.id, inc.id, db)
                if redis_client:
                    await redis_client.setex(cache_key, 3600, str(match_percentage))

        gap_analysis = None
        if student:
            gap_analysis = await GapAnalyser.analyse_gaps(student.id, inc.id, db)

        inc_dict = {
            "id": inc.id,
            "company_id": inc.company_id,
            "title": inc.title,
            "description": inc.description,
            "location": inc.location,
            "duration_weeks": inc.duration_weeks,
            "stipend": inc.stipend,
            "application_deadline": inc.application_deadline,
            "job_family_id": inc.job_family_id,
            "sub_role_id": inc.sub_role_id,
            "track_type": inc.track_type,
            "total_slots": inc.total_slots,
            "accepted_tiers": inc.accepted_tiers,
            "status": inc.status,
            "created_at": inc.created_at,
            "requirements": inc.requirements,
            "match_percentage": round(match_percentage, 1),
            "company_name": comp.company_name,
            "is_individual_verified": comp.is_individual_verified,
            "verification_method": comp.verification_method,
            "trust_tier": comp.trust_tier,
            "gap_analysis": gap_analysis
        }
        response_data.append(inc_dict)

    return response_data

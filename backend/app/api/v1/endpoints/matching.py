from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Dict, Any

from app.db.session import get_db
from app.dependencies import require_role
from app.models.user import User, UserRole
from app.models.company import Company
from app.models.internship import Internship
from app.models.student import Student
from app.models.application import Application
from app.services.matching import FairAllocationEngine, FitScoreCalculator, GapAnalyser, TierBander
from app.core.redis import get_redis
import redis.asyncio as redis

router = APIRouter()

@router.get("/internships/{id}/matches")
async def get_matches(
    id: int,
    current_user: User = Depends(require_role(UserRole.COMPANY_REP)),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Company).where(Company.user_id == current_user.id))
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Company profile not found.")

    internship = await db.scalar(select(Internship).where(Internship.id == id, Internship.company_id == company.id))
    if not internship:
        raise HTTPException(status_code=404, detail="Internship not found or unauthorized.")

    competitive_pool_apps = await FairAllocationEngine.get_competitive_pool(id, db)
    equity_pool_apps = await FairAllocationEngine.get_equity_pool(id, db)

    async def serialize_pool(pool):
        res = []
        for app in pool:
            student = await db.scalar(select(Student).where(Student.id == app.student_id))
            user = await db.scalar(select(User).where(User.id == student.user_id))
            gaps = await GapAnalyser.analyse_gaps(app.student_id, id, db)
            res.append({
                "application_id": app.id,
                "student_id": app.student_id,
                "applicant_name": f"{user.first_name} {user.last_name}" if user else "Unknown",
                "fit_score": float(app.fit_score) if app.fit_score else 0.0,
                "tier": app.tier_at_application,
                "status": app.status,
                "gap_analysis": gaps
            })
        return res

    return {
        "competitive_pool": await serialize_pool(competitive_pool_apps),
        "equity_pool": await serialize_pool(equity_pool_apps)
    }

@router.post("/matching/recalculate-all")
async def recalculate_all(
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db),
    redis_client: redis.Redis = Depends(get_redis)
):
    internships_result = await db.execute(select(Internship).where(Internship.status == "open"))
    internships = internships_result.scalars().all()

    students_result = await db.execute(select(Student))
    students = students_result.scalars().all()

    for student in students:
        for internship in internships:
            fit_score = await FitScoreCalculator.calculate_fit_score(student.id, internship.id, db)
            
            cache_key = f"fit_score:{student.id}:{internship.id}"
            if redis_client:
                await redis_client.setex(cache_key, 3600, str(fit_score))
            
            tier = TierBander.assign_tier(fit_score)
            student.current_tier = tier
            
            # Update any pending application for this student/internship to reflect the newest score and tier
            app_result = await db.execute(select(Application).where(
                Application.student_id == student.id,
                Application.internship_id == internship.id
            ))
            application = app_result.scalar_one_or_none()
            if application:
                application.fit_score = fit_score
                application.tier_at_application = tier

    await db.commit()
    
    return {"message": "Recalculation triggered successfully."}

from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.models.job_family import JobFamily
from app.schemas.student import JobFamilyResponse

router = APIRouter()

@router.get("/", response_model=List[JobFamilyResponse])
async def get_job_families(db: AsyncSession = Depends(get_db)):
    """Get all job families with their associated sub-roles."""
    result = await db.execute(
        select(JobFamily).options(selectinload(JobFamily.sub_roles))
    )
    job_families = result.scalars().all()
    return job_families

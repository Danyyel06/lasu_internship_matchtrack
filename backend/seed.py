#!/usr/bin/env python
"""Seed script: loads Job Families and Sub-roles from fixtures/job_families.json into the database.

Usage:
    cd backend
    .venv\Scripts\python seed.py
"""
import asyncio
import json
import sys
from pathlib import Path

# Ensure the backend app package is importable
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings
from app.models.job_family import JobFamily, SubRole  # noqa — registers models with Base


FIXTURE_PATH = Path(__file__).parent / "fixtures" / "job_families.json"


async def seed(session: AsyncSession) -> None:
    with open(FIXTURE_PATH, encoding="utf-8") as f:
        families_data = json.load(f)

    families_seeded = 0
    sub_roles_seeded = 0

    for family_data in families_data:
        # Upsert job family by name
        result = await session.execute(
            select(JobFamily).where(JobFamily.name == family_data["name"])
        )
        family = result.scalar_one_or_none()

        if family is None:
            family = JobFamily(
                name=family_data["name"],
                description=family_data.get("description"),
                default_weights=family_data.get("default_weights"),
            )
            session.add(family)
            await session.flush()  # get ID
            families_seeded += 1
            print(f"  + Created family: {family.name}")
        else:
            family.description = family_data.get("description")
            family.default_weights = family_data.get("default_weights")
            print(f"  ~ Updated family: {family.name}")

        # Upsert sub-roles
        for sr_data in family_data.get("sub_roles", []):
            result = await session.execute(
                select(SubRole).where(
                    SubRole.job_family_id == family.id,
                    SubRole.name == sr_data["name"],
                )
            )
            sub_role = result.scalar_one_or_none()

            if sub_role is None:
                sub_role = SubRole(
                    job_family_id=family.id,
                    name=sr_data["name"],
                    description=sr_data.get("description"),
                    skills=sr_data.get("skills", []),
                )
                session.add(sub_role)
                sub_roles_seeded += 1
            else:
                sub_role.description = sr_data.get("description")
                sub_role.skills = sr_data.get("skills", [])

    await session.commit()
    print(f"\nSeed complete: {families_seeded} new families, {sub_roles_seeded} new sub-roles.")


async def main() -> None:
    print(f"Connecting to: {settings.DATABASE_URL[:40]}...")
    engine = create_async_engine(settings.DATABASE_URL)
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        print("Seeding Job Families and Sub-roles...")
        await seed(session)

    await engine.dispose()
    print("Done.")


if __name__ == "__main__":
    asyncio.run(main())

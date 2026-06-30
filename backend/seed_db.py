import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.job_family import JobFamily, SubRole

async def seed_job_families():
    async with AsyncSessionLocal() as session:
        # Check if already seeded
        result = await session.execute(select(JobFamily))
        if result.scalars().first():
            print("Job Families already seeded.")
            return

        print("Seeding Job Families...")
        
        families_data = [
            {
                "name": "Software and Technology",
                "description": "Software development, IT, and tech roles",
                "sub_roles": ["Frontend Engineer", "Backend Developer", "Full Stack Engineer", "DevOps Engineer", "Data Scientist", "UI/UX Designer"]
            },
            {
                "name": "Engineering and Manufacturing",
                "description": "Traditional engineering and manufacturing",
                "sub_roles": ["Mechanical Engineer", "Electrical Engineer", "Civil Engineer", "Production Engineer", "Quality Assurance"]
            },
            {
                "name": "Business and Management",
                "description": "Business operations, HR, and management",
                "sub_roles": ["Business Analyst", "HR Assistant", "Operations Intern", "Project Coordinator"]
            },
            {
                "name": "Finance and Accounting",
                "description": "Accounting, finance, and banking",
                "sub_roles": ["Accounting Intern", "Financial Analyst", "Audit Assistant", "Tax Intern"]
            }
        ]
        
        for family in families_data:
            jf = JobFamily(
                name=family["name"],
                description=family["description"],
                matching_weights={
                    "cgpa": 20,
                    "skills": 40,
                    "projects": 30,
                    "coursework": 10
                }
            )
            session.add(jf)
            await session.flush()  # to get jf.id
            
            for role_name in family["sub_roles"]:
                sr = SubRole(
                    job_family_id=jf.id,
                    name=role_name,
                    description=f"Internship in {role_name}"
                )
                session.add(sr)
                
        await session.commit()
        print("Database seeding completed.")

if __name__ == "__main__":
    asyncio.run(seed_job_families())

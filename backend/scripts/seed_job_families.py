import asyncio
import sys
import os
from sqlalchemy import select
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import AsyncSessionLocal
from app.models.job_family import JobFamily, SubRole

JOB_FAMILIES_DATA = [
    {
        "name": "Software and Technology",
        "description": "Software engineering, data science, IT, and related fields.",
        "default_weights": {"cgpa": 20, "skills": 50, "project": 20, "coursework": 10},
        "sub_roles": [
            "Frontend Developer", "Backend Developer", "Full Stack Developer",
            "Data Scientist", "DevOps Engineer", "Mobile Developer",
            "UI/UX Designer", "Product Manager", "QA Engineer", "Systems Analyst"
        ]
    },
    {
        "name": "Engineering and Manufacturing",
        "description": "Mechanical, civil, electrical, and manufacturing engineering.",
        "default_weights": {"cgpa": 30, "skills": 40, "project": 20, "coursework": 10},
        "sub_roles": [
            "Mechanical Engineer", "Civil Engineer", "Electrical Engineer",
            "Manufacturing Engineer", "Process Engineer", "Quality Engineer",
            "Hardware Engineer", "Automation Engineer"
        ]
    },
    {
        "name": "Business and Management",
        "description": "Business administration, HR, operations, and management.",
        "default_weights": {"cgpa": 40, "skills": 30, "project": 10, "coursework": 20},
        "sub_roles": [
            "Business Analyst", "HR Specialist", "Operations Manager",
            "Project Manager", "Sales Representative", "Marketing Specialist",
            "Supply Chain Analyst", "Management Consultant"
        ]
    },
    {
        "name": "Finance and Accounting",
        "description": "Finance, accounting, banking, and economics.",
        "default_weights": {"cgpa": 50, "skills": 20, "project": 0, "coursework": 30},
        "sub_roles": [
            "Financial Analyst", "Accountant", "Auditor",
            "Investment Banker", "Tax Consultant", "Risk Analyst",
            "Credit Analyst", "Actuary"
        ]
    },
    {
        "name": "Health and Life Sciences",
        "description": "Medicine, nursing, pharmacy, biology, and research.",
        "default_weights": {"cgpa": 60, "skills": 20, "project": 10, "coursework": 10},
        "sub_roles": [
            "Clinical Researcher", "Lab Technician", "Biomedical Engineer",
            "Pharmacist Intern", "Public Health Analyst", "Medical Writer"
        ]
    },
    {
        "name": "Media and Communications",
        "description": "Journalism, PR, digital media, and communications.",
        "default_weights": {"cgpa": 20, "skills": 40, "project": 30, "coursework": 10},
        "sub_roles": [
            "Journalist", "PR Specialist", "Content Writer",
            "Social Media Manager", "Video Editor", "Graphic Designer",
            "Copywriter", "Communications Specialist"
        ]
    },
    {
        "name": "Education and Social Services",
        "description": "Teaching, counseling, social work, and educational administration.",
        "default_weights": {"cgpa": 40, "skills": 20, "project": 10, "coursework": 30},
        "sub_roles": [
            "Teaching Assistant", "Counselor", "Social Worker",
            "Instructional Designer", "Educational Administrator", "Special Education Assistant"
        ]
    },
    {
        "name": "Architecture and Built Environment",
        "description": "Architecture, urban planning, construction management.",
        "default_weights": {"cgpa": 30, "skills": 30, "project": 30, "coursework": 10},
        "sub_roles": [
            "Architectural Assistant", "Urban Planner", "Construction Manager",
            "Interior Designer", "Surveyor", "Landscape Architect"
        ]
    },
    {
        "name": "Science and Research",
        "description": "Physics, chemistry, environmental science, and academic research.",
        "default_weights": {"cgpa": 50, "skills": 20, "project": 10, "coursework": 20},
        "sub_roles": [
            "Research Assistant", "Chemist", "Physicist",
            "Environmental Scientist", "Data Analyst", "Lab Assistant"
        ]
    },
    {
        "name": "Legal and Compliance",
        "description": "Law, compliance, paralegal, and regulatory affairs.",
        "default_weights": {"cgpa": 60, "skills": 10, "project": 0, "coursework": 30},
        "sub_roles": [
            "Paralegal", "Legal Researcher", "Compliance Analyst",
            "Contract Administrator", "Regulatory Affairs Specialist"
        ]
    }
]

async def seed_job_families():
    async with AsyncSessionLocal() as db:
        for family_data in JOB_FAMILIES_DATA:
            # Check if exists
            result = await db.execute(select(JobFamily).where(JobFamily.name == family_data["name"]))
            existing_family = result.scalar_one_or_none()

            if not existing_family:
                print(f"Adding Job Family: {family_data['name']}")
                new_family = JobFamily(
                    name=family_data["name"],
                    description=family_data["description"],
                    default_weights=family_data["default_weights"]
                )
                db.add(new_family)
                await db.flush()
                family_id = new_family.id
            else:
                print(f"Updating Job Family: {family_data['name']}")
                existing_family.description = family_data["description"]
                existing_family.default_weights = family_data["default_weights"]
                family_id = existing_family.id
                await db.flush()

            # Seed sub-roles
            for role_name in family_data["sub_roles"]:
                result_role = await db.execute(select(SubRole).where(SubRole.name == role_name, SubRole.job_family_id == family_id))
                existing_role = result_role.scalar_one_or_none()
                if not existing_role:
                    new_role = SubRole(job_family_id=family_id, name=role_name)
                    db.add(new_role)

        await db.commit()
        print("Job Families and Sub-roles seeded successfully!")

if __name__ == "__main__":
    asyncio.run(seed_job_families())

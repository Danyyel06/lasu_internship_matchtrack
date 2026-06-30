import asyncio
import os
import sys
import argparse

# Add the parent directory to sys.path so we can import 'app'
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)

from sqlalchemy import text
from app.db.session import async_engine, AsyncSessionLocal
from app.db.base import Base
from app.core.security import hash_password
from app.models.user import User, UserRole
from app.models.job_family import JobFamily, SubRole
from app.models.system_setting import SystemSetting
from app.models.department_objective import DepartmentObjective

async def reset_db():
    print("Dropping all tables...")
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    
    print("Creating all tables...")
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

async def seed_data():
    print("Seeding baseline data...")
    async with AsyncSessionLocal() as db:
        # 1. Create Super Admin User
        admin_user = User(
            email="admin@lasu.edu.ng",
            password_hash=hash_password("password123"),
            first_name="Super",
            last_name="Admin",
            role=UserRole.SUPER_ADMIN,
            is_verified=True
        )
        db.add(admin_user)

        # 2. Create System Settings
        settings = [
            SystemSetting(key="internship_cycle_start", value="2024-05-01"),
            SystemSetting(key="internship_cycle_end", value="2024-10-31"),
            SystemSetting(key="equity_track_quota", value="20"),
            SystemSetting(key="missed_pulse_threshold", value="2"),
        ]
        db.add_all(settings)

        # 3. Create Job Families and SubRoles
        job_families_data = {
            "Software and Technology": [
                "Frontend Developer", "Backend Developer", "Mobile Developer", "DevOps Engineer", "Data Scientist", "System Administrator"
            ],
            "Engineering and Manufacturing": [
                "Mechanical Engineer", "Electrical Engineer", "Civil Engineer", "Chemical Engineer", "Production Supervisor", "Quality Control"
            ],
            "Business and Management": [
                "Business Analyst", "Marketing Executive", "HR Assistant", "Operations Analyst", "Sales Representative", "Project Manager"
            ],
            "Finance and Accounting": [
                "Accountant", "Financial Analyst", "Auditor", "Tax Consultant", "Investment Banker", "Risk Manager"
            ],
            "Health and Life Sciences": [
                "Clinical Researcher", "Lab Technician", "Healthcare Administrator", "Pharmacist Assistant", "Biomedical Engineer", "Public Health Officer"
            ],
            "Media and Communications": [
                "Journalist", "PR Specialist", "Social Media Manager", "Content Creator", "Copywriter", "Video Editor"
            ],
            "Education and Social Services": [
                "Teacher Assistant", "Social Worker", "Counselor", "Curriculum Developer", "Community Outreach", "Special Education Assistant"
            ],
            "Architecture and Built Environment": [
                "Architectural Draftsman", "Urban Planner", "Quantity Surveyor", "Interior Designer", "Construction Manager", "Landscape Architect"
            ],
            "Science and Research": [
                "Research Assistant", "Chemist", "Biologist", "Physicist", "Environmental Scientist", "Geologist"
            ],
            "Legal and Compliance": [
                "Paralegal", "Legal Assistant", "Compliance Officer", "Contract Administrator", "Legal Researcher", "Corporate Counsel Assistant"
            ]
        }

        for jf_name, roles in job_families_data.items():
            jf = JobFamily(
                name=jf_name,
                description=f"Opportunities in {jf_name}",
                default_weights={
                    "cgpa": 20,
                    "skills": 50,
                    "projects": 20,
                    "coursework": 10
                }
            )
            db.add(jf)
            await db.flush()  # To get the ID
            
            for role_name in roles:
                sr = SubRole(job_family_id=jf.id, name=role_name)
                db.add(sr)

        # 4. Create dummy department learning objectives so the unified framework works
        depts = ["Computer Science", "Mechanical Engineering", "Business Administration"]
        for dept in depts:
            db.add(DepartmentObjective(department_name=dept, objective_text=f"Understand practical applications of {dept} principles."))
            db.add(DepartmentObjective(department_name=dept, objective_text=f"Develop professional communication skills in a corporate {dept} environment."))
            db.add(DepartmentObjective(department_name=dept, objective_text=f"Apply theoretical {dept} knowledge to solve real-world industry problems."))

        await db.commit()
        print("Data seeded successfully!")

async def main():
    parser = argparse.ArgumentParser(description="Reset and seed the database")
    parser.add_argument("--confirm", action="store_true", help="Confirm database wipe")
    args = parser.parse_args()

    if not args.confirm:
        print("WARNING: This will drop all tables and permanently delete all data.")
        print("Run with --confirm to proceed.")
        return

    await reset_db()
    await seed_data()

if __name__ == "__main__":
    asyncio.run(main())

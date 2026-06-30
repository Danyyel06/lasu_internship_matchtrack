import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from app.core.config import settings
from app.models.job_family import JobFamily, SubRole
from app.db.session import AsyncSessionLocal

async def seed_data():
    async_session = AsyncSessionLocal
    
    job_families_data = [
        {
            "name": "Software and Technology",
            "description": "Software, data, cybersecurity, AI",
            "default_weights": {"cgpa": 20, "skills": 50, "projects": 20, "coursework": 10},
            "sub_roles": [
                {"name": "Software Development", "description": "Web, mobile, backend", "skills": ["Python / programming basics", "Web development (HTML, CSS, JS)", "Version Control (Git)"]},
                {"name": "Data Science & Analytics", "description": "Working with data, insights", "skills": ["Data analysis (Excel/SQL/Python)", "Data visualization (Tableau/PowerBI)", "Machine Learning basics"]},
                {"name": "Cybersecurity", "description": "Network security, risk management", "skills": ["Network fundamentals", "Ethical hacking basics", "Security compliance"]}
            ]
        },
        {
            "name": "Engineering and Manufacturing",
            "description": "Civil, mechanical, production",
            "default_weights": {"cgpa": 30, "skills": 40, "projects": 10, "coursework": 20},
            "sub_roles": [
                {"name": "Mechanical Engineering", "description": "Machine design, thermodynamics", "skills": ["CAD software (SolidWorks/AutoCAD)", "Thermodynamics", "Manufacturing processes"]},
                {"name": "Civil Engineering", "description": "Structural analysis, construction", "skills": ["Structural design", "AutoCAD/Revit", "Construction management"]}
            ]
        },
        {
            "name": "Business and Management",
            "description": "Accounting, marketing, management",
            "default_weights": {"cgpa": 25, "skills": 35, "projects": 25, "coursework": 15},
            "sub_roles": [
                {"name": "Project Management", "description": "Planning, execution", "skills": ["Agile/Scrum", "Project planning tools", "Risk management"]},
                {"name": "Marketing & Sales", "description": "Digital marketing, sales strategy", "skills": ["SEO/SEM", "Content creation", "CRM software"]}
            ]
        },
        {
            "name": "Finance and Accounting",
            "description": "Financial analysis, accounting",
            "default_weights": {"cgpa": 40, "skills": 30, "projects": 0, "coursework": 30},
            "sub_roles": [
                {"name": "Financial Analysis", "description": "Financial modeling, forecasting", "skills": ["Financial modeling", "Excel proficiency", "Data interpretation"]},
                {"name": "Accounting", "description": "Bookkeeping, tax, audit", "skills": ["Accounting principles", "Tax preparation", "Audit procedures"]}
            ]
        },
        {
            "name": "Health and Life Sciences",
            "description": "Medicine, pharmacy, public health",
            "default_weights": {"cgpa": 30, "skills": 40, "projects": 0, "coursework": 30},
            "sub_roles": [
                {"name": "Public Health", "description": "Epidemiology, health policy", "skills": ["Epidemiology basics", "Health data analysis", "Community health outreach"]},
                {"name": "Clinical Research", "description": "Trials, medical research", "skills": ["Clinical trial protocols", "Data collection", "Regulatory compliance"]}
            ]
        },
        {
            "name": "Media and Communications",
            "description": "Journalism, PR, mass comms",
            "default_weights": {"cgpa": 20, "skills": 40, "projects": 30, "coursework": 10},
            "sub_roles": [
                {"name": "Journalism", "description": "Reporting, editing", "skills": ["Copywriting", "Research", "Editing tools"]},
                {"name": "Public Relations", "description": "Brand management", "skills": ["Press releases", "Crisis management", "Media relations"]}
            ]
        },
        {
            "name": "Education and Social Services",
            "description": "Teaching, social work",
            "default_weights": {"cgpa": 30, "skills": 30, "projects": 20, "coursework": 20},
            "sub_roles": [
                {"name": "Teaching & Instruction", "description": "Curriculum delivery", "skills": ["Lesson planning", "Classroom management", "Educational technology"]},
                {"name": "Social Work", "description": "Counseling, case management", "skills": ["Case management", "Counseling basics", "Advocacy"]}
            ]
        },
        {
            "name": "Architecture and Built Environment",
            "description": "Architecture, urban planning",
            "default_weights": {"cgpa": 25, "skills": 45, "projects": 20, "coursework": 10},
            "sub_roles": [
                {"name": "Architecture", "description": "Building design", "skills": ["Architectural drafting", "3D modeling (SketchUp/Rhino)", "Building codes"]},
                {"name": "Urban Planning", "description": "City planning, zoning", "skills": ["GIS software", "Policy analysis", "Environmental planning"]}
            ]
        },
        {
            "name": "Science and Research",
            "description": "Biology, chemistry, physics",
            "default_weights": {"cgpa": 35, "skills": 35, "projects": 10, "coursework": 20},
            "sub_roles": [
                {"name": "Laboratory Technician", "description": "Lab equipment, testing", "skills": ["Lab safety protocols", "Equipment calibration", "Data recording"]},
                {"name": "Research Assistant", "description": "Data gathering, lit review", "skills": ["Literature review", "Statistical analysis", "Report writing"]}
            ]
        },
        {
            "name": "Legal and Compliance",
            "description": "Law, regulatory compliance",
            "default_weights": {"cgpa": 40, "skills": 30, "projects": 0, "coursework": 30},
            "sub_roles": [
                {"name": "Legal Assistant / Paralegal", "description": "Legal research, drafting", "skills": ["Legal research", "Document drafting", "Case management"]},
                {"name": "Compliance Officer", "description": "Regulatory checks", "skills": ["Regulatory knowledge", "Risk assessment", "Policy drafting"]}
            ]
        }
    ]

    async with async_session() as db:
        for family_data in job_families_data:
            # Check if exists
            result = await db.execute(select(JobFamily).filter_by(name=family_data["name"]))
            existing = result.scalar_one_or_none()
            if not existing:
                jf = JobFamily(
                    name=family_data["name"],
                    description=family_data["description"],
                    default_weights=family_data["default_weights"]
                )
                db.add(jf)
                await db.flush()
                
                for sub_role in family_data["sub_roles"]:
                    sr = SubRole(
                        job_family_id=jf.id,
                        name=sub_role["name"],
                        description=sub_role["description"],
                        skills=sub_role["skills"]
                    )
                    db.add(sr)
        
        await db.commit()
        print("Database seeded successfully!")

if __name__ == "__main__":
    asyncio.run(seed_data())

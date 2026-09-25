import asyncio
import sys
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
import os

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.session import AsyncSessionLocal
from app.models.job_family import JobFamily

JOB_FAMILY_COURSES = {
    "Software and Technology": [
      'Introduction to Programming / Computer Science 101',
      'Data Structures and Algorithms',
      'Database Management Systems',
      'Computer Networks and Communication',
      'Software Engineering / System Analysis'
    ],
    "Engineering and Manufacturing": [
      'Engineering Mathematics / Calculus',
      'Mechanics of Materials / Thermodynamics',
      'Engineering Drawing / CAD',
      'Fluid Mechanics',
      'Manufacturing Processes'
    ],
    "Business and Management": [
      'Principles of Management',
      'Business Economics / Microeconomics',
      'Organizational Behavior',
      'Business Communication',
      'Marketing Principles'
    ],
    "Finance and Accounting": [
      'Financial Accounting / Reporting',
      'Managerial Accounting',
      'Corporate Finance',
      'Taxation Principles',
      'Auditing and Assurance'
    ],
    "Health and Life Sciences": [
      'Human Anatomy / Physiology',
      'Biochemistry / Cell Biology',
      'Public Health / Epidemiology',
      'Pharmacology / Pathology',
      'Biostatistics'
    ],
    "Media and Communications": [
      'Introduction to Mass Communication',
      'Journalism and News Writing',
      'Public Relations / Advertising',
      'Digital Media Production',
      'Media Ethics and Law'
    ],
    "Education and Social Services": [
      'Foundations of Education',
      'Educational Psychology',
      'Curriculum Development',
      'Sociology / Social Problems',
      'Counseling Principles'
    ],
    "Architecture and Built Environment": [
      'Architectural Design / Drafting',
      'Building Construction / Materials',
      'History of Architecture',
      'Structural Mechanics',
      'Urban Planning Basics'
    ],
    "Science and Research": [
      'General Chemistry / Physics',
      'Laboratory Techniques and Safety',
      'Research Methodology',
      'Quantitative Analysis',
      'Advanced Mathematics'
    ],
    "Legal and Compliance": [
      'Introduction to Legal Systems',
      'Contract Law / Tort Law',
      'Constitutional Law',
      'Commercial / Corporate Law',
      'Ethics and Professional Conduct'
    ]
}

async def main():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(JobFamily))
        jfs = result.scalars().all()
        for jf in jfs:
            if jf.name in JOB_FAMILY_COURSES:
                jf.coursework_options = JOB_FAMILY_COURSES[jf.name]
                print(f"Updated {jf.name} with coursework.")
        await session.commit()

if __name__ == "__main__":
    asyncio.run(main())

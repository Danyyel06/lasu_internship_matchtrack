"""
Script to populate skills for sub-roles that are missing them.
Run from the backend directory with: python -m scripts.populate_subrole_skills
"""
import asyncio
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.dirname(os.path.dirname(__file__))))

from sqlalchemy import select, update
from app.db.session import AsyncSessionLocal as SessionLocal
from app.models.job_family import SubRole, JobFamily

# Skills mapping for sub-roles that are currently missing skills
SKILLS_MAP = {
    # Software and Technology
    "Full Stack Developer": ["HTML & CSS", "JavaScript", "React.js", "Python or Node.js", "REST API Design", "SQL Databases", "Git & Version Control", "Docker Basics", "Testing & Debugging", "System Design"],
    "UI/UX Designer": ["Figma or Sketch", "User Research", "Wireframing & Prototyping", "Usability Testing", "Design Systems", "Information Architecture", "Accessibility Standards", "Visual Design", "Interaction Design", "Stakeholder Communication"],
    "Product Manager": ["Product Strategy", "User Stories", "Roadmap Planning", "Stakeholder Management", "Data Analysis", "Wireframing Basics", "Agile Methodology", "Market Research", "Presentation Skills", "Communication Skills"],
    "QA Engineer": ["Manual Testing", "Test Case Design", "Bug Tracking", "Automated Testing Basics", "API Testing", "Performance Testing", "Selenium or Cypress", "Git & Version Control", "SQL Basics", "Attention to Detail"],
    "Systems Analyst": ["Requirements Analysis", "System Design", "Data Flow Diagrams", "SQL & Database Design", "Business Process Modelling", "UML Diagrams", "Stakeholder Communication", "Microsoft Visio", "Technical Documentation", "Problem Solving"],

    # Engineering and Manufacturing
    "Manufacturing Engineer": ["Lean Manufacturing", "CAD Software", "Process Optimisation", "Quality Control", "Production Planning", "Industrial Safety", "Six Sigma Basics", "Material Science", "Report Writing", "Microsoft Excel"],
    "Process Engineer": ["Process Simulation", "Chemical Engineering Fundamentals", "Data Analysis", "HYSYS or Aspen", "Process Optimisation", "Safety Procedures", "Quality Assurance", "Technical Documentation", "Microsoft Excel", "Problem Solving"],
    "Quality Engineer": ["ISO Standards", "Statistical Process Control", "Root Cause Analysis", "Quality Auditing", "Measurement & Calibration", "Non-Destructive Testing", "Technical Documentation", "Six Sigma Basics", "Microsoft Excel", "Attention to Detail"],
    "Hardware Engineer": ["Circuit Design", "PCB Layout", "Embedded Systems", "Microcontrollers", "Oscilloscopes & Multimeters", "Soldering", "Troubleshooting", "AutoCAD Electrical", "Report Writing", "Safety Standards"],
    "Automation Engineer": ["PLC Programming", "SCADA Systems", "Industrial Robotics", "Control Systems", "HMI Design", "Electrical Wiring", "Process Instrumentation", "Troubleshooting", "Technical Documentation", "Safety Standards"],

    # Business and Management
    "HR Specialist": ["Recruitment Support", "Employee Relations", "HRIS Systems", "Labour Law Basics", "Performance Management", "Communication Skills", "Microsoft Office Suite", "Confidentiality", "Report Writing", "Onboarding Coordination"],
    "Operations Manager": ["Process Optimisation", "Supply Chain Basics", "Resource Allocation", "Microsoft Excel", "Performance Monitoring", "Vendor Management", "Budget Management", "Communication Skills", "Problem Solving", "Report Writing"],
    "Project Manager": ["Project Planning", "Risk Management", "Agile Methodology", "Microsoft Project or Jira", "Stakeholder Management", "Budget Tracking", "Meeting Facilitation", "Report Writing", "Gantt Charts", "Time Management"],
    "Marketing Specialist": ["Market Research", "Digital Marketing", "Content Creation", "Social Media Management", "Google Analytics", "SEO Basics", "Email Marketing", "Copywriting", "Campaign Management", "Presentation Skills"],
    "Supply Chain Analyst": ["Supply Chain Management", "Inventory Analysis", "Microsoft Excel (Advanced)", "Demand Forecasting", "ERP Systems", "Logistics Coordination", "Data Analysis", "Vendor Evaluation", "Report Writing", "Problem Solving"],
    "Management Consultant": ["Strategic Analysis", "Business Case Development", "Data Analysis", "PowerPoint Presentations", "Market Research", "Stakeholder Management", "Problem Solving", "Financial Modelling", "Communication Skills", "Report Writing"],

    # Finance and Accounting
    "Risk Analyst": ["Risk Assessment", "Financial Modelling", "Statistical Analysis", "Microsoft Excel (Advanced)", "Regulatory Compliance", "Data Analysis", "VaR Models", "Report Writing", "Critical Thinking", "Communication Skills"],
    "Credit Analyst": ["Credit Analysis", "Financial Statements Reading", "Risk Assessment", "Microsoft Excel", "Lending Regulations", "Data Analysis", "Due Diligence", "Report Writing", "Communication Skills", "Attention to Detail"],
    "Actuary": ["Statistical Analysis", "Probability Theory", "Microsoft Excel (Advanced)", "Financial Modelling", "Risk Assessment", "Insurance Principles", "Data Analysis", "Programming (R or Python)", "Report Writing", "Communication Skills"],

    # Health and Life Sciences
    "Pharmacist Intern": ["Drug Dispensing", "Pharmacology", "Drug Interactions", "Patient Counselling", "Inventory Management", "Compounding Basics", "Regulatory Compliance", "Communication Skills", "Attention to Detail", "Record Keeping"],
    "Public Health Analyst": ["Epidemiology", "Health Data Analysis", "Biostatistics", "SPSS or Stata", "Research Methodology", "Disease Surveillance", "Report Writing", "Microsoft Excel", "Community Health", "Presentation Skills"],
    "Medical Writer": ["Medical Writing", "Clinical Research Knowledge", "Scientific Literature Review", "Regulatory Guidelines", "Editing & Proofreading", "APA or AMA Citation", "Microsoft Word", "Attention to Detail", "Communication Skills", "Data Interpretation"],

    # Media and Communications
    "Content Writer": ["Content Writing", "SEO Writing", "Research Skills", "Copyediting", "Blog Writing", "WordPress Basics", "Social Media", "Grammar & Style", "Deadline Management", "Creative Thinking"],
    "Graphic Designer": ["Adobe Photoshop", "Adobe Illustrator", "Figma or Canva", "Typography", "Colour Theory", "Brand Identity", "Layout Design", "Print Production", "Visual Communication", "Creative Thinking"],
    "Communications Specialist": ["Corporate Communications", "Press Release Writing", "Media Relations", "Crisis Communication", "Content Strategy", "Internal Communications", "Stakeholder Engagement", "Social Media", "Presentation Skills", "Report Writing"],

    # Education and Social Services
    "Teaching Assistant": ["Classroom Management", "Lesson Plan Support", "Student Assessment", "Communication Skills", "Patience & Empathy", "Educational Technology", "Record Keeping", "Time Management", "Team Collaboration", "Adaptability"],
    "Instructional Designer": ["Curriculum Development", "Learning Management Systems", "Educational Technology", "Content Creation", "Assessment Design", "Multimedia Production", "User Experience Basics", "Communication Skills", "Research Skills", "Creative Thinking"],
    "Educational Administrator": ["School Administration", "Policy Implementation", "Record Management", "Microsoft Office Suite", "Stakeholder Communication", "Budget Basics", "Event Coordination", "Report Writing", "Leadership Skills", "Conflict Resolution"],

    # Architecture and Built Environment
    "Architectural Assistant": ["AutoCAD", "Revit", "3D Modelling", "Architectural Drawing", "Building Regulations", "Design Principles", "Construction Detailing", "SketchUp", "Report Writing", "Team Collaboration"],
    "Surveyor": ["Land Surveying", "Total Station Operation", "GPS Equipment", "AutoCAD", "Topographic Mapping", "Land Law Basics", "Data Collection", "Measurement Accuracy", "Report Writing", "Microsoft Excel"],

    # Science and Research
    "Data Analyst": ["Python or R", "SQL", "Data Visualisation", "Microsoft Excel", "Statistical Analysis", "Pandas & NumPy", "Power BI or Tableau", "Data Cleaning", "Critical Thinking", "Report Writing"],
    "Lab Assistant": ["Laboratory Techniques", "Sample Preparation", "Equipment Calibration", "Lab Safety Protocols", "Data Recording", "Microscopy", "Chemical Handling", "Quality Control", "Attention to Detail", "Report Writing"],

    # Legal and Compliance
    "Compliance Analyst": ["Regulatory Analysis", "Compliance Monitoring", "Risk Assessment", "Policy Documentation", "Data Analysis", "Microsoft Excel", "Report Writing", "Attention to Detail", "Communication Skills", "Legal Research"],
    "Regulatory Affairs Specialist": ["Regulatory Frameworks", "Compliance Documentation", "Risk Assessment", "Policy Analysis", "Stakeholder Communication", "Legal Research", "Report Writing", "Attention to Detail", "Microsoft Office", "Communication Skills"],
}


async def populate_skills():
    db = SessionLocal()
    try:
        updated = 0
        not_found = []
        
        for role_name, skills in SKILLS_MAP.items():
            result = await db.execute(
                select(SubRole).where(SubRole.name == role_name)
            )
            sub_roles = result.scalars().all()
            
            if not sub_roles:
                not_found.append(role_name)
                continue
            
            for sr in sub_roles:
                if not sr.skills or len(sr.skills) == 0:
                    sr.skills = skills
                    updated += 1
                    print(f"  [OK] Updated: {role_name} (id={sr.id}) with {len(skills)} skills")
                else:
                    print(f"  [SKIP] Skipped: {role_name} (id={sr.id}) -- already has {len(sr.skills)} skills")
        
        await db.commit()
        print(f"\n{'='*50}")
        print(f"Updated {updated} sub-roles with skills")
        if not_found:
            print(f"Not found in DB: {not_found}")
            
    except Exception as e:
        import traceback
        traceback.print_exc()
    finally:
        await db.close()


if __name__ == "__main__":
    asyncio.run(populate_skills())

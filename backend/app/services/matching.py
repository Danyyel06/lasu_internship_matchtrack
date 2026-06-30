from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Dict, Any
from app.models.student import Student, StudentSkill
from app.models.internship import Internship, InternshipRequirement
from app.models.job_family import JobFamily
from app.models.application import Application

class FitScoreCalculator:
    @staticmethod
    async def calculate_profile_fit_score(student_id: int, db: AsyncSession) -> float:
        from app.models.student import StudentJobFamilySelection
        
        student = await db.scalar(select(Student).where(Student.id == student_id))
        if not student:
            return 0.0

        # CGPA Score (Normalize 0-5 to 0-100)
        cgpa = float(student.cgpa) if student.cgpa else 0.0
        cgpa_score = min(max((cgpa / 5.0) * 100, 0), 100)

        # Skills Score (average of verified_levels across listed skills)
        skills_result = await db.execute(select(StudentSkill).where(StudentSkill.student_id == student.id))
        student_skills = skills_result.scalars().all()
        
        skills_score = 0.0
        if student_skills:
            total_levels = sum([s.verified_level or 0 for s in student_skills])
            avg_level = total_levels / len(student_skills)
            skills_score = min((avg_level / 5.0) * 100, 100)

        # Project Score
        projects = student.project_count or 0
        if projects == 0:
            project_score = 0.0
        elif projects == 1:
            project_score = 33.0
        elif projects == 2:
            project_score = 66.0
        else:
            project_score = 100.0

        # Coursework Score (Assuming 5 relevant courses is 100%)
        courses = student.coursework_count or 0
        coursework_score = min((courses / 5.0) * 100, 100)

        # Apply Weights
        weights = {"cgpa": 25, "skills": 25, "projects": 25, "coursework": 25}
        jf_sel_result = await db.execute(select(StudentJobFamilySelection).where(StudentJobFamilySelection.student_id == student.id))
        jf_sel = jf_sel_result.scalar_one_or_none()
        
        if jf_sel and jf_sel.job_family_id:
            job_family = await db.scalar(select(JobFamily).where(JobFamily.id == jf_sel.job_family_id))
            if job_family and job_family.default_weights:
                weights = job_family.default_weights

        final_score = (
            (cgpa_score * weights.get("cgpa", 25) / 100) +
            (skills_score * weights.get("skills", 25) / 100) +
            (project_score * weights.get("projects", 25) / 100) +
            (coursework_score * weights.get("coursework", 25) / 100)
        )
        return round(final_score, 2)

    @staticmethod
    async def calculate_fit_score(student_id: int, internship_id: int, db: AsyncSession) -> float:
        student = await db.scalar(select(Student).where(Student.id == student_id))
        internship = await db.scalar(select(Internship).where(Internship.id == internship_id))
        
        if not student or not internship:
            return 0.0

        # CGPA Score (Normalize 0-5 to 0-100)
        cgpa = float(student.cgpa) if student.cgpa else 0.0
        cgpa_score = min(max((cgpa / 5.0) * 100, 0), 100)

        # Skills Score
        reqs_result = await db.execute(select(InternshipRequirement).where(InternshipRequirement.internship_id == internship.id))
        requirements = reqs_result.scalars().all()
        
        skills_result = await db.execute(select(StudentSkill).where(StudentSkill.student_id == student.id))
        student_skills = {s.skill_name: s.verified_level or 0 for s in skills_result.scalars().all()}
        
        skills_score = 0.0
        if requirements:
            total_levels = 0
            for req in requirements:
                s_level = student_skills.get(req.skill_name, 0)
                total_levels += s_level
            
            # Average level across required skills, normalized to 100 (assuming max level is 5)
            avg_level = total_levels / len(requirements)
            skills_score = min((avg_level / 5.0) * 100, 100)
        else:
            skills_score = 100.0 # If no skills required, full score

        # Project Score
        projects = student.project_count or 0
        if projects == 0:
            project_score = 0.0
        elif projects == 1:
            project_score = 33.0
        elif projects == 2:
            project_score = 66.0
        else:
            project_score = 100.0

        # Coursework Score (Assuming 5 relevant courses is 100%)
        courses = student.coursework_count or 0
        coursework_score = min((courses / 5.0) * 100, 100)

        # Apply Weights
        weights = {"cgpa": 25, "skills": 25, "projects": 25, "coursework": 25}
        if internship.job_family_id:
            job_family = await db.scalar(select(JobFamily).where(JobFamily.id == internship.job_family_id))
            if job_family and job_family.default_weights:
                weights = job_family.default_weights

        final_score = (
            (cgpa_score * weights.get("cgpa", 25) / 100) +
            (skills_score * weights.get("skills", 25) / 100) +
            (project_score * weights.get("projects", 25) / 100) +
            (coursework_score * weights.get("coursework", 25) / 100)
        )

        return round(final_score, 2)

class TierBander:
    @staticmethod
    def assign_tier(fit_score: float) -> str:
        if fit_score >= 70:
            return "T1"
        elif fit_score >= 40:
            return "T2"
        else:
            return "T3"

class GapAnalyser:
    @staticmethod
    async def analyse_gaps(student_id: int, internship_id: int, db: AsyncSession) -> List[Dict[str, Any]]:
        reqs_result = await db.execute(select(InternshipRequirement).where(InternshipRequirement.internship_id == internship_id))
        requirements = reqs_result.scalars().all()
        
        skills_result = await db.execute(select(StudentSkill).where(StudentSkill.student_id == student_id))
        student_skills = {s.skill_name: s.verified_level or 0 for s in skills_result.scalars().all()}
        
        gaps = []
        for req in requirements:
            s_level = student_skills.get(req.skill_name, 0)
            r_level = req.required_level or 0
            gap_val = r_level - s_level
            
            gaps.append({
                "skill_name": req.skill_name,
                "student_level": s_level,
                "required_level": r_level,
                "gap": gap_val if gap_val > 0 else 0,
                "meets_requirement": s_level >= r_level,
                "is_mandatory": req.is_mandatory
            })
        return gaps

class FairAllocationEngine:
    @staticmethod
    async def get_competitive_pool(internship_id: int, db: AsyncSession) -> List[Application]:
        apps_result = await db.execute(select(Application).where(Application.internship_id == internship_id))
        applications = apps_result.scalars().all()
        
        competitive_pool = []
        for app in applications:
            gaps = await GapAnalyser.analyse_gaps(app.student_id, internship_id, db)
            meets_all_mandatory = all(g["meets_requirement"] for g in gaps if g["is_mandatory"])
            if meets_all_mandatory:
                competitive_pool.append(app)
                
        # Sort by fit_score descending
        competitive_pool.sort(key=lambda x: float(x.fit_score or 0), reverse=True)
        return competitive_pool

    @staticmethod
    async def get_equity_pool(internship_id: int, db: AsyncSession) -> List[Application]:
        apps_result = await db.execute(select(Application).where(Application.internship_id == internship_id))
        applications = apps_result.scalars().all()
        
        t1_apps = []
        t2_apps = []
        t3_apps = []
        
        for app in applications:
            tier = app.tier_at_application
            if tier == "T1":
                t1_apps.append(app)
            elif tier == "T2":
                t2_apps.append(app)
            elif tier == "T3":
                t3_apps.append(app)
                
        # Sort each tier by fit_score descending
        t1_apps.sort(key=lambda x: float(x.fit_score or 0), reverse=True)
        t2_apps.sort(key=lambda x: float(x.fit_score or 0), reverse=True)
        t3_apps.sort(key=lambda x: float(x.fit_score or 0), reverse=True)
        
        equity_pool = []
        max_len = max(len(t1_apps), len(t2_apps), len(t3_apps))
        
        for i in range(max_len):
            if i < len(t1_apps):
                equity_pool.append(t1_apps[i])
            if i < len(t2_apps):
                equity_pool.append(t2_apps[i])
            if i < len(t3_apps):
                equity_pool.append(t3_apps[i])
                
        return equity_pool

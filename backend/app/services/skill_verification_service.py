import os
import json
import hashlib
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Tuple, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from fastapi import HTTPException, status
import httpx

from app.models.student import Student, StudentSkill, StudentJobFamilySelection
from app.models.job_family import JobFamily, SubRole
from app.models.skill_verification import SkillVerificationQuestion, SkillVerificationAttempt
from app.services.matching import FitScoreCalculator, TierBander
from app.services.matching import FitScoreCalculator, TierBander


class SkillVerificationService:
    @staticmethod
    def _get_difficulty_tier(level: int) -> str:
        tiers = {
            1: "basic_awareness",
            2: "foundational",
            3: "applied",
            4: "professional",
            5: "expert"
        }
        return tiers.get(level, "foundational")

    @staticmethod
    def _get_question_count(level: int) -> int:
        if level <= 2:
            return 2
        elif level == 3:
            return 4
        else:
            return 5
            
    @staticmethod
    async def build_context_package(student_id: int, db: AsyncSession) -> Dict[str, Any]:
        student = await db.scalar(select(Student).where(Student.id == student_id))
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")

        jf_sel = await db.scalar(select(StudentJobFamilySelection).where(StudentJobFamilySelection.student_id == student_id))
        if not jf_sel:
            raise HTTPException(status_code=400, detail="Student has not selected a job family")

        job_family = await db.scalar(select(JobFamily).where(JobFamily.id == jf_sel.job_family_id))
        sub_role_name = None
        if jf_sel.selected_sub_role_id:
            sub_role = await db.scalar(select(SubRole).where(SubRole.id == jf_sel.selected_sub_role_id))
            sub_role_name = sub_role.name if sub_role else None

        skills_result = await db.execute(select(StudentSkill).where(StudentSkill.student_id == student_id))
        skills = skills_result.scalars().all()

        skill_data = []
        for s in skills:
            skill_data.append({
                "skill_name": s.skill_name,
                "claimed_level": s.claimed_level or 1,
                "difficulty_tier": SkillVerificationService._get_difficulty_tier(s.claimed_level or 1),
                "verification_status": s.verification_status
            })
            
        skill_data.sort(key=lambda x: x["skill_name"])
        
        context_pkg = {
            "job_family": job_family.name if job_family else "Unknown",
            "sub_role": sub_role_name or "Unknown",
            "skills": skill_data
        }
        
        hash_str = json.dumps(context_pkg, sort_keys=True).encode('utf-8')
        profile_hash = hashlib.sha256(hash_str).hexdigest()
        
        return {"context": context_pkg, "hash": profile_hash}
        
    @staticmethod
    async def get_or_generate_questions(student_id: int, db: AsyncSession) -> List[SkillVerificationQuestion]:
        pkg = await SkillVerificationService.build_context_package(student_id, db)
        profile_hash = pkg["hash"]
        
        q_result = await db.execute(
            select(SkillVerificationQuestion)
            .where(SkillVerificationQuestion.student_id == student_id)
            .where(SkillVerificationQuestion.profile_snapshot_hash == profile_hash)
        )
        existing_qs = q_result.scalars().all()
        
        skills_to_test = [s for s in pkg["context"]["skills"] if s["verification_status"] in ["unverified", "failed", "re_verifying"]]
        
        if not skills_to_test:
            return []
            
        existing_skill_names = {q.skill_name for q in existing_qs}
        skills_needed = [s for s in skills_to_test if s["skill_name"] not in existing_skill_names]
        
        if not skills_needed:
            return [q for q in existing_qs if q.skill_name in {s["skill_name"] for s in skills_to_test}]
            
        new_qs = await SkillVerificationService._generate_questions_from_ai(student_id, pkg["context"], skills_needed, profile_hash, db)
        
        all_qs = [q for q in existing_qs if q.skill_name in {s["skill_name"] for s in skills_to_test}] + new_qs
        return all_qs

    @staticmethod
    async def _generate_questions_from_ai(student_id: int, context: Dict[str, Any], skills_to_generate: List[Dict[str, Any]], profile_hash: str, db: AsyncSession) -> List[SkillVerificationQuestion]:
        from app.core.config import settings
        import logging
        import asyncio
        
        logger = logging.getLogger(__name__)
        api_key = settings.GEMINI_API_KEY
        
        if not api_key:
            raise HTTPException(status_code=500, detail="Skill Verification AI service is temporarily unavailable (API key missing). Please try again later.")
            
        # Fetch attempt counts for the dynamic prompt
        attempt_counts = {}
        for s in skills_to_generate:
            skill_name = s["skill_name"]
            res = await db.execute(
                select(func.max(SkillVerificationAttempt.attempt_number))
                .where(SkillVerificationAttempt.student_id == student_id)
                .where(SkillVerificationAttempt.skill_name == skill_name)
            )
            attempt_counts[skill_name] = res.scalar() or 0

        prompt_skills = ""
        for s in skills_to_generate:
            skill_name = s['skill_name']
            count = SkillVerificationService._get_question_count(s['claimed_level'])
            attempts = attempt_counts[skill_name]
            
            complexity_note = ""
            if attempts == 1:
                complexity_note = " This is a same-day grace retake. Provide slightly more complex questions than the first attempt to prevent memorization, but keep the overall difficulty tier the same."
            elif attempts >= 2:
                complexity_note = " The student previously claimed this skill but failed multiple times and has returned after a cooldown. Provide significantly tougher questions for this tier to rigorously verify their claim."
                
            prompt_skills += f"- {skill_name}: Level {s['claimed_level']} ({s['difficulty_tier']}) - Generate {count} questions.{complexity_note}\n"

        prompt = (
            "You are a skill assessment engine for a Nigerian university internship platform.\n\n"
            f"Job Family: {context['job_family']}\n"
            f"Sub-Role: {context['sub_role']}\n\n"
            "Generate multiple-choice questions for the following skills:\n"
            f"{prompt_skills}\n"
            "Return a JSON object where each key is the exact skill name, and the value is an array of question objects.\n"
            "Each question object must contain:\n"
            '  "question": string,\n'
            '  "options": array of exactly 4 strings,\n'
            '  "correct_index": integer (0-3),\n'
            '  "explanation": string,\n'
            '  "skill_name": string,\n'
            '  "difficulty_tier": string\n\n'
            "Return ONLY valid JSON, no markdown formatting blocks around it."
        )

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.3, "responseMimeType": "application/json"},
        }
        headers = {
            "Content-Type": "application/json",
            "x-goog-api-key": api_key,
        }

        max_retries = 5
        resp = None
        for attempt_num in range(max_retries + 1):
            try:
                async with httpx.AsyncClient(timeout=60) as client:
                    resp = await client.post(url, headers=headers, json=payload)
                    
                if resp.status_code == 429 and attempt_num < max_retries:
                    wait = 2 ** (attempt_num + 1)
                    logger.warning(f"Rate-limited (429) on skill verification generation, retrying in {wait}s")
                    await asyncio.sleep(wait)
                    continue
                    
                resp.raise_for_status()
                break
            except Exception as e:
                if attempt_num == max_retries:
                    logger.error(f"Failed to generate questions after {max_retries} retries: {e}")
                    raise HTTPException(status_code=500, detail="Skill Verification AI service is temporarily unavailable due to high load. Please try again later.")
                wait = 2 ** (attempt_num + 1)
                await asyncio.sleep(wait)
                
        if not resp:
            raise HTTPException(status_code=500, detail="Failed to reach AI service")

        raw_text = resp.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
        
        try:
            questions_data = json.loads(raw_text)
        except Exception:
            if raw_text.startswith("```"):
                raw_text = raw_text.split("```", 2)[1]
                if raw_text.startswith("json"):
                    raw_text = raw_text[4:]
                questions_data = json.loads(raw_text.strip())

        created_qs = []
        for s in skills_to_generate:
            skill_name = s["skill_name"]
            if skill_name in questions_data:
                q_model = SkillVerificationQuestion(
                    student_id=student_id,
                    skill_name=skill_name,
                    difficulty_tier=s["difficulty_tier"],
                    questions=questions_data[skill_name],
                    profile_snapshot_hash=profile_hash
                )
                db.add(q_model)
                created_qs.append(q_model)

        await db.commit()
        for q in created_qs:
            await db.refresh(q)
            
        return created_qs

    @staticmethod
    async def grade_skill_attempt(student_id: int, skill_name: str, student_answers: List[int], snapshot_id: int, failed_tab_switch: bool, db: AsyncSession) -> Dict[str, Any]:
        snapshot = await db.scalar(select(SkillVerificationQuestion).where(SkillVerificationQuestion.id == snapshot_id))
        if not snapshot or snapshot.student_id != student_id or snapshot.skill_name != skill_name:
            raise HTTPException(status_code=400, detail="Invalid snapshot for this skill")

        questions = snapshot.questions or []
        total_q = len(questions)
        correct_answers = [q.get("correct_index", 0) for q in questions]

        score = 0
        if not failed_tab_switch:
            for i, ans in enumerate(student_answers):
                if i < len(correct_answers) and ans == correct_answers[i]:
                    score += 1

        import math
        required_pass = math.ceil(total_q * 0.7)
        passed = (score >= required_pass) and not failed_tab_switch

        attempt_result = await db.execute(
            select(func.max(SkillVerificationAttempt.attempt_number))
            .where(SkillVerificationAttempt.student_id == student_id)
            .where(SkillVerificationAttempt.skill_name == skill_name)
        )
        max_attempt = attempt_result.scalar() or 0
        
        attempt = SkillVerificationAttempt(
            student_id=student_id,
            skill_name=skill_name,
            attempt_number=max_attempt + 1,
            score=score,
            total_questions=total_q,
            passed=passed,
            failed_due_to_tab_switch=failed_tab_switch,
            questions_snapshot_id=snapshot_id,
            student_answers=student_answers
        )
        db.add(attempt)

        skill = await db.scalar(select(StudentSkill).where(StudentSkill.student_id == student_id, StudentSkill.skill_name == skill_name))
        if skill:
            skill.last_attempt_at = datetime.now(timezone.utc)
            
            status_changed = await SkillVerificationService.check_and_apply_reverification(skill, passed, db)
            
            if not passed:
                if skill.verification_status != "verified":
                    skill.verification_status = "failed"
                
                # Grace attempt: If it's their very first failure (attempt_number 1), give immediate retake
                if attempt.attempt_number == 1:
                    skill.cooldown_until = None
                else:
                    from app.models.system_setting import SystemSetting
                    cooldown_setting = await db.scalar(select(SystemSetting).where(SystemSetting.key == "skill_reverify_cooldown_days"))
                    cooldown_days = int(cooldown_setting.value) if cooldown_setting else 7
                    skill.cooldown_until = datetime.now(timezone.utc) + timedelta(days=cooldown_days)
            elif status_changed and passed:
                skill.verification_status = "verified"
                skill.verified_level = skill.claimed_level

        await db.commit()

        return {
            "skill_name": skill_name,
            "passed": passed,
            "score": score,
            "total_questions": total_q,
            "verification_status": skill.verification_status if skill else "failed",
            "correct_answers": correct_answers
        }

    @staticmethod
    async def check_and_apply_reverification(skill: StudentSkill, passed: bool, db: AsyncSession) -> bool:
        if not passed:
            return False
            
        if skill.verification_status == "unverified":
            return True 

        if skill.verification_status in ["failed", "re_verifying"]:
            if skill.successful_reverify_count == 0:
                skill.successful_reverify_count = 1
                skill.verification_status = "re_verifying"
                return False
            else:
                attempts = await db.execute(
                    select(SkillVerificationAttempt)
                    .where(SkillVerificationAttempt.student_id == skill.student_id)
                    .where(SkillVerificationAttempt.skill_name == skill.skill_name)
                    .where(SkillVerificationAttempt.passed == True)
                )
                passing_attempts = attempts.scalars().all()
                
                days = {a.attempted_at.date() for a in passing_attempts if a.attempted_at}
                current_day = datetime.now(timezone.utc).date()
                days.add(current_day)
                
                if len(days) >= 2:
                    return True
                else:
                    skill.successful_reverify_count = 1
                    skill.verification_status = "re_verifying"
                    return False
        return False

    @staticmethod
    async def recalculate_and_cache_verified_score(student_id: int, db: AsyncSession) -> Tuple[float, str]:
        student = await db.scalar(select(Student).where(Student.id == student_id))
        
        cgpa = float(student.cgpa) if student.cgpa else 0.0
        cgpa_score = min(max((cgpa / 5.0) * 100, 0), 100)

        skills_result = await db.execute(select(StudentSkill).where(StudentSkill.student_id == student_id))
        student_skills = skills_result.scalars().all()
        
        skills_score = 0.0
        if student_skills:
            total_levels = 0
            for s in student_skills:
                if s.verification_status == "verified" and s.verified_level:
                    total_levels += s.verified_level
                else:
                    discounted = int((s.claimed_level or 0) * 0.5)
                    total_levels += discounted
                    
            avg_level = total_levels / len(student_skills)
            skills_score = min((avg_level / 5.0) * 100, 100)

        projects = student.project_count or 0
        if projects == 0: project_score = 0.0
        elif projects == 1: project_score = 33.0
        elif projects == 2: project_score = 66.0
        else: project_score = 100.0

        courses = student.coursework_count or 0
        coursework_score = min((courses / 5.0) * 100, 100)

        weights = {"cgpa": 25, "skills": 25, "projects": 25, "coursework": 25}
        jf_sel = await db.scalar(select(StudentJobFamilySelection).where(StudentJobFamilySelection.student_id == student_id))
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
        
        final_score = round(final_score, 2)
        student.verified_fit_score = final_score
        student.current_tier = TierBander.assign_tier(final_score)
        
        await db.commit()
        return final_score, student.current_tier

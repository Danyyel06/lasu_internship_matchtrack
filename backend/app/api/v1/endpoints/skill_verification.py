from typing import List, Dict, Any
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.dependencies import get_current_user, require_role
from app.models.user import User, UserRole
from app.models.student import Student, StudentSkill
from app.models.job_family import SubRole, JobFamily
from app.models.student import StudentJobFamilySelection

from app.schemas.skill_verification import (
    SkillVerificationStatusResponse, SkillVerificationStatusItem,
    BeginVerificationResponse, SkillQuestionGroup, SkillQuestionItem,
    SubmitSkillRequest, SubmitSkillResponse, CompleteVerificationResponse,
    AddSkillRequest, ReVerifyRequest, ReVerifyResponse
)
from app.services.skill_verification_service import SkillVerificationService

router = APIRouter()

@router.get("/allowed-skills", response_model=Dict[str, Any])
async def get_allowed_skills(
    current_user: User = Depends(require_role(UserRole.STUDENT)),
    db: AsyncSession = Depends(get_db)
):
    """Return the skill list for the student's sub-role, minus skills already added."""
    student = await db.scalar(select(Student).where(Student.user_id == current_user.id))
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    jf_sel = await db.scalar(
        select(StudentJobFamilySelection).where(StudentJobFamilySelection.student_id == student.id)
    )
    if not jf_sel or not jf_sel.selected_sub_role_id:
        return {"sub_role": None, "allowed_skills": [], "already_added": []}

    sub_role = await db.scalar(select(SubRole).where(SubRole.id == jf_sel.selected_sub_role_id))
    job_family = await db.scalar(select(JobFamily).where(JobFamily.id == sub_role.job_family_id))
    allowed_skills: List[str] = sub_role.skills or []

    existing_result = await db.execute(
        select(StudentSkill.skill_name).where(StudentSkill.student_id == student.id)
    )
    already_added = [row[0] for row in existing_result.all()]
    remaining = [s for s in allowed_skills if s not in already_added]

    return {
        "sub_role": sub_role.name,
        "job_family": job_family.name if job_family else None,
        "allowed_skills": remaining,
        "already_added": already_added,
    }

@router.get("/status", response_model=SkillVerificationStatusResponse)
async def get_verification_status(
    current_user: User = Depends(require_role(UserRole.STUDENT)),
    db: AsyncSession = Depends(get_db)
):
    student = await db.scalar(select(Student).where(Student.user_id == current_user.id))
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    skills_result = await db.execute(select(StudentSkill).where(StudentSkill.student_id == student.id))
    skills = skills_result.scalars().all()
    
    skill_items = [
        SkillVerificationStatusItem(
            skill_name=s.skill_name,
            claimed_level=s.claimed_level or 1,
            verified_level=s.verified_level,
            verification_status=s.verification_status,
            cooldown_until=s.cooldown_until
        ) for s in skills
    ]

    return SkillVerificationStatusResponse(
        preliminary_fit_score=student.preliminary_fit_score,
        verified_fit_score=student.verified_fit_score,
        skill_verification_completed_at=student.skill_verification_completed_at,
        skills=skill_items
    )

@router.post("/begin", response_model=BeginVerificationResponse)
async def begin_verification(
    current_user: User = Depends(require_role(UserRole.STUDENT)),
    db: AsyncSession = Depends(get_db)
):
    student = await db.scalar(select(Student).where(Student.user_id == current_user.id))
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    qs = await SkillVerificationService.get_or_generate_questions(student.id, db)
    
    # Check if there's anything to verify
    if not qs:
        # Meaning everything is verified or nothing unverified. Just return empty
        return BeginVerificationResponse(skill_groups=[], profile_snapshot_hash="")
        
    hash_str = qs[0].profile_snapshot_hash or ""
    
    skill_groups = []
    for q in qs:
        items = []
        for q_dict in (q.questions or []):
            items.append(SkillQuestionItem(
                question=q_dict.get("question", ""),
                options=q_dict.get("options", [])
            ))
            
        skill_groups.append(SkillQuestionGroup(
            skill_name=q.skill_name,
            claimed_level=1,  # Placeholder — overwritten from StudentSkill on lines 90-94 below
            difficulty_tier=q.difficulty_tier,
            difficulty_label=q.difficulty_tier.replace("_", " ").title(),
            questions=items,
            question_snapshot_id=q.id
        ))

    # Fix claimed_level properly from StudentSkill
    skills_result = await db.execute(select(StudentSkill).where(StudentSkill.student_id == student.id))
    skill_dict = {s.skill_name: s.claimed_level for s in skills_result.scalars().all()}
    
    for sg in skill_groups:
        sg.claimed_level = skill_dict.get(sg.skill_name, 1)

    return BeginVerificationResponse(
        skill_groups=skill_groups,
        profile_snapshot_hash=hash_str
    )

@router.post("/submit-skill", response_model=SubmitSkillResponse)
async def submit_skill(
    payload: SubmitSkillRequest,
    current_user: User = Depends(require_role(UserRole.STUDENT)),
    db: AsyncSession = Depends(get_db)
):
    student = await db.scalar(select(Student).where(Student.user_id == current_user.id))
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    result = await SkillVerificationService.grade_skill_attempt(
        student.id, 
        payload.skill_name, 
        payload.student_answers, 
        payload.questions_snapshot_id, 
        payload.failed_due_to_tab_switch, 
        db
    )
    
    return SubmitSkillResponse(**result)

@router.post("/complete", response_model=CompleteVerificationResponse)
async def complete_verification(
    current_user: User = Depends(require_role(UserRole.STUDENT)),
    db: AsyncSession = Depends(get_db)
):
    student = await db.scalar(select(Student).where(Student.user_id == current_user.id))
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    student.skill_verification_completed_at = datetime.now(timezone.utc)
    
    score, tier = await SkillVerificationService.recalculate_and_cache_verified_score(student.id, db)
    
    skills_result = await db.execute(select(StudentSkill).where(StudentSkill.student_id == student.id))
    skills = skills_result.scalars().all()
    
    verified_count = sum(1 for s in skills if s.verification_status == "verified")
    failed_count = sum(1 for s in skills if s.verification_status == "failed")
    
    return CompleteVerificationResponse(
        verified_fit_score=score,
        current_tier=tier,
        skills_verified_count=verified_count,
        skills_failed_count=failed_count
    )

@router.post("/add-skill", response_model=BeginVerificationResponse)
async def add_skill(
    payload: AddSkillRequest,
    current_user: User = Depends(require_role(UserRole.STUDENT)),
    db: AsyncSession = Depends(get_db)
):
    student = await db.scalar(select(Student).where(Student.user_id == current_user.id))
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Validate against sub-role
    jf_sel = await db.scalar(select(StudentJobFamilySelection).where(StudentJobFamilySelection.student_id == student.id))
    if jf_sel and jf_sel.selected_sub_role_id:
        sub_role = await db.scalar(select(SubRole).where(SubRole.id == jf_sel.selected_sub_role_id))
        allowed_skills = sub_role.skills or []
        if payload.skill_name not in allowed_skills:
            raise HTTPException(status_code=400, detail=f"Skill '{payload.skill_name}' is not applicable to your sub-role.")
            
    # Check if exists
    existing = await db.scalar(select(StudentSkill).where(StudentSkill.student_id == student.id, StudentSkill.skill_name == payload.skill_name))
    if existing:
        raise HTTPException(status_code=400, detail="Skill already exists in your profile.")

    # Create skill
    skill = StudentSkill(
        student_id=student.id,
        skill_name=payload.skill_name,
        claimed_level=payload.claimed_level,
        verification_status="unverified"
    )
    db.add(skill)
    await db.commit()
    
    # Generate questions just for this skill (by calling get_or_generate_questions which will pick it up)
    qs = await SkillVerificationService.get_or_generate_questions(student.id, db)
    
    # Filter only this new skill
    new_qs = [q for q in qs if q.skill_name == payload.skill_name]
    
    if not new_qs:
        raise HTTPException(status_code=500, detail="Failed to generate questions")
        
    hash_str = new_qs[0].profile_snapshot_hash or ""
    
    q = new_qs[0]
    items = []
    for q_dict in (q.questions or []):
        items.append(SkillQuestionItem(
            question=q_dict.get("question", ""),
            options=q_dict.get("options", [])
        ))
        
    sg = SkillQuestionGroup(
        skill_name=q.skill_name,
        claimed_level=payload.claimed_level,
        difficulty_tier=q.difficulty_tier,
        difficulty_label=q.difficulty_tier.replace("_", " ").title(),
        questions=items,
        question_snapshot_id=q.id
    )

    return BeginVerificationResponse(
        skill_groups=[sg],
        profile_snapshot_hash=hash_str
    )

@router.post("/upgrade-skill", response_model=BeginVerificationResponse)
async def upgrade_skill(
    payload: AddSkillRequest,
    current_user: User = Depends(require_role(UserRole.STUDENT)),
    db: AsyncSession = Depends(get_db)
):
    student = await db.scalar(select(Student).where(Student.user_id == current_user.id))
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    skill = await db.scalar(select(StudentSkill).where(StudentSkill.student_id == student.id, StudentSkill.skill_name == payload.skill_name))
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
        
    if skill.verification_status != "verified":
        raise HTTPException(status_code=400, detail="Only verified skills can be upgraded.")
        
    if payload.claimed_level <= (skill.verified_level or 0):
        raise HTTPException(status_code=400, detail="New level must be higher than current verified level.")
        
    if payload.claimed_level > 5:
        raise HTTPException(status_code=400, detail="Maximum skill level is 5.")

    skill.claimed_level = payload.claimed_level
    skill.verification_status = "re_verifying"
    
    old_snapshots = await db.execute(
        select(SkillVerificationQuestion)
        .where(SkillVerificationQuestion.student_id == student.id)
        .where(SkillVerificationQuestion.skill_name == payload.skill_name)
    )
    for old_s in old_snapshots.scalars():
        await db.delete(old_s)
        
    await db.commit()
    
    qs = await SkillVerificationService.get_or_generate_questions(student.id, db)
    new_qs = [q for q in qs if q.skill_name == payload.skill_name]
    
    if not new_qs:
        raise HTTPException(status_code=500, detail="Failed to generate fresh questions")
        
    hash_str = new_qs[0].profile_snapshot_hash or ""
    q = new_qs[0]
    items = []
    for q_dict in (q.questions or []):
        items.append(SkillQuestionItem(
            question=q_dict.get("question", ""),
            options=q_dict.get("options", [])
        ))
        
    sg = SkillQuestionGroup(
        skill_name=q.skill_name,
        claimed_level=payload.claimed_level,
        difficulty_tier=q.difficulty_tier,
        difficulty_label=q.difficulty_tier.replace("_", " ").title(),
        questions=items,
        question_snapshot_id=q.id
    )

    return BeginVerificationResponse(
        skill_groups=[sg],
        profile_snapshot_hash=hash_str
    )

@router.post("/re-verify", response_model=ReVerifyResponse)
async def re_verify(
    payload: ReVerifyRequest,
    current_user: User = Depends(require_role(UserRole.STUDENT)),
    db: AsyncSession = Depends(get_db)
):
    skill_name = payload.skill_name
    student = await db.scalar(select(Student).where(Student.user_id == current_user.id))
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    skill = await db.scalar(select(StudentSkill).where(StudentSkill.student_id == student.id, StudentSkill.skill_name == skill_name))
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
        
    if skill.verification_status not in ["failed", "re_verifying", "unverified"]:
        raise HTTPException(status_code=400, detail="Skill is already verified.")
        
    if skill.cooldown_until and skill.cooldown_until > datetime.now(timezone.utc):
        return ReVerifyResponse(allowed=False, cooldown_until=skill.cooldown_until)
        
    # Allowed, generate fresh questions. First clear out the old snapshot for this skill so a new one generates
    # Actually get_or_generate_questions checks for `profile_snapshot_hash`. If we want fresh questions, we can tweak the profile hash slightly or 
    # explicitly force a regeneration. But if the student didn't change level, the hash is the same.
    # To force fresh questions, we can delete the existing snapshot for this skill!
    old_snapshots = await db.execute(
        select(SkillVerificationQuestion)
        .where(SkillVerificationQuestion.student_id == student.id)
        .where(SkillVerificationQuestion.skill_name == skill_name)
    )
    for old_s in old_snapshots.scalars():
        await db.delete(old_s)
        
    await db.commit()
    
    qs = await SkillVerificationService.get_or_generate_questions(student.id, db)
    new_qs = [q for q in qs if q.skill_name == skill_name]
    
    if not new_qs:
        raise HTTPException(status_code=500, detail="Failed to generate fresh questions")
        
    q = new_qs[0]
    items = []
    for q_dict in (q.questions or []):
        items.append(SkillQuestionItem(
            question=q_dict.get("question", ""),
            options=q_dict.get("options", [])
        ))
        
    sg = SkillQuestionGroup(
        skill_name=q.skill_name,
        claimed_level=skill.claimed_level or 1,
        difficulty_tier=q.difficulty_tier,
        difficulty_label=q.difficulty_tier.replace("_", " ").title(),
        questions=items,
        question_snapshot_id=q.id
    )
    
    return ReVerifyResponse(allowed=True, skill_groups=[sg])

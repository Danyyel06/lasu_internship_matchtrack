import os

filepath = "c:/Users/User/lasu-internship-platform/backend/app/api/v1/endpoints/hod.py"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

new_endpoints = """
class AssignSupervisorRequest(BaseModel):
    supervisor_id: int

@router.post("/students/{student_id}/assign-supervisor")
async def assign_academic_supervisor(
    student_id: int,
    payload: AssignSupervisorRequest,
    current_user: User = Depends(require_role(UserRole.HEAD_OF_DEPARTMENT)),
    db: AsyncSession = Depends(get_db)
):
    # Verify HOD
    hod_res = await db.execute(select(HeadOfDepartment).where(HeadOfDepartment.user_id == current_user.id))
    hod = hod_res.scalar_one_or_none()
    if not hod:
        raise HTTPException(status_code=400, detail="HOD profile not found")

    # Verify Student exists and is in the same department
    student_res = await db.execute(select(Student).where(Student.id == student_id))
    student = student_res.scalar_one_or_none()
    if not student or student.department != hod.department:
        raise HTTPException(status_code=403, detail="Student not found or not in your department")

    # Verify Supervisor exists and is in the same department
    sup_res = await db.execute(
        select(AcademicSupervisorProfile)
        .where(AcademicSupervisorProfile.user_id == payload.supervisor_id)
        .where(AcademicSupervisorProfile.department == hod.department)
    )
    sup = sup_res.scalar_one_or_none()
    if not sup:
        raise HTTPException(status_code=400, detail="Invalid supervisor selection")

    # Find the accepted application
    app_res = await db.execute(
        select(Application)
        .where(Application.student_id == student_id)
        .where(Application.status.in_(['accepted', 'Accepted']))
    )
    application = app_res.scalar_one_or_none()
    
    if not application:
        raise HTTPException(status_code=400, detail="Student does not have an active placement")
        
    application.academic_supervisor_id = payload.supervisor_id
    await db.commit()
    
    return {"status": "success", "message": "Supervisor assigned successfully"}
"""

if "AssignSupervisorRequest" not in content:
    content += new_endpoints

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Rewritten hod.py")

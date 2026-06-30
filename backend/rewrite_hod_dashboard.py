import os

filepath = "c:/Users/User/lasu-internship-platform/backend/app/api/v1/endpoints/hod.py"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

new_endpoints = """
@router.get("/dashboard-stats")
async def get_dashboard_stats(
    current_user: User = Depends(require_role(UserRole.HEAD_OF_DEPARTMENT)),
    db: AsyncSession = Depends(get_db)
):
    hod_res = await db.execute(select(HeadOfDepartment).where(HeadOfDepartment.user_id == current_user.id))
    hod = hod_res.scalar_one_or_none()
    if not hod:
        raise HTTPException(status_code=400, detail="HOD profile not found")

    # Total students
    total_students_res = await db.execute(
        select(func.count(Student.id)).where(Student.department == hod.department)
    )
    total_students = total_students_res.scalar() or 0

    # Placed students
    placed_students_res = await db.execute(
        select(func.count(Application.id))
        .join(Student, Application.student_id == Student.id)
        .where(Student.department == hod.department)
        .where(Application.status.in_(['accepted', 'Accepted']))
    )
    placed_students = placed_students_res.scalar() or 0

    # Total supervisors
    total_supervisors_res = await db.execute(
        select(func.count(AcademicSupervisorProfile.id))
        .where(AcademicSupervisorProfile.department == hod.department)
    )
    total_supervisors = total_supervisors_res.scalar() or 0

    # For now, just return a dummy active alerts count until we have real ones
    active_alerts = 0

    return {
        "total_students": total_students,
        "placed_students": placed_students,
        "total_supervisors": total_supervisors,
        "active_alerts": active_alerts
    }
"""

if "@router.get(\"/dashboard-stats\")" not in content:
    content += new_endpoints

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Rewritten hod.py for dashboard stats")

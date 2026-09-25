from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth, job_families, ws, students, companies, internships, applications,
    matching, dev, growth, notifications, logs, monthly_review, skill_verification,
    cgpa_extract
)

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(job_families.router, prefix="/job-families", tags=["Job Families"])
api_router.include_router(students.router, prefix="/students", tags=["Students"])
api_router.include_router(companies.router, prefix="/companies", tags=["Companies"])
api_router.include_router(internships.router, prefix="/internships", tags=["Internships"])
api_router.include_router(applications.router, prefix="/applications", tags=["Applications"])
api_router.include_router(skill_verification.router, prefix="/skill-verification", tags=["Skill Verification"])
api_router.include_router(matching.router, tags=["Matching"])
api_router.include_router(growth.router, prefix="/growth", tags=["Growth"])
api_router.include_router(logs.router, prefix="/logs", tags=["Bi-Weekly Logs"])
api_router.include_router(monthly_review.router, prefix="/monthly-review", tags=["Monthly Review"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(dev.router, prefix="/dev", tags=["Development"])
api_router.include_router(ws.router, prefix="/ws", tags=["WebSockets"])

from app.api.v1.endpoints import supervisors, hod, academic_supervisors, admin
api_router.include_router(supervisors.router, prefix="/supervisors", tags=["Supervisors"])
api_router.include_router(academic_supervisors.router, prefix="/academic-supervisors", tags=["Academic Supervisors"])
api_router.include_router(hod.router, prefix="/hod", tags=["Head of Department"])
api_router.include_router(admin.router, prefix="/admin", tags=["Super Admin"])
api_router.include_router(cgpa_extract.router, prefix="/transcript", tags=["Transcript"])

import os

filepath = "c:/Users/User/lasu-internship-platform/backend/app/api/v1/endpoints/academic_supervisors.py"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Make sure Intervention is imported
if "from app.models.intervention import Intervention" not in content:
    content = content.replace("from app.models.unified_framework import UnifiedFramework", "from app.models.unified_framework import UnifiedFramework\nfrom app.models.intervention import Intervention")

if "from datetime import datetime" not in content:
    content = content.replace("from typing import List, Optional", "from typing import List, Optional\nfrom datetime import datetime, date")
else:
    # ensure date is imported
    if "from datetime import datetime, date" not in content:
        content = content.replace("from datetime import datetime", "from datetime import datetime, date")

# Add Schemas and Endpoints at the end
new_code = """
class InterventionCreate(BaseModel):
    contact_method: str
    contact_date: str # YYYY-MM-DD
    notes: str

@router.post("/students/{student_id}/interventions")
async def log_intervention(
    student_id: int,
    payload: InterventionCreate,
    current_user: User = Depends(require_role(UserRole.ACADEMIC_SUPERVISOR)),
    db: AsyncSession = Depends(get_db)
):
    app_res = await db.execute(
        select(Application)
        .where(Application.student_id == student_id)
        .where(Application.status.in_(['accepted', 'Accepted']))
    )
    application = app_res.scalar_one_or_none()
    
    if not application or application.academic_supervisor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to log intervention for this student")
        
    try:
        dt = datetime.strptime(payload.contact_date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
        
    new_intervention = Intervention(
        application_id=application.id,
        academic_supervisor_id=current_user.id,
        contact_method=payload.contact_method,
        contact_date=dt,
        notes=payload.notes
    )
    
    db.add(new_intervention)
    await db.commit()
    
    return {"status": "success", "message": "Intervention logged successfully"}
"""

if "class InterventionCreate" not in content:
    content += new_code

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Rewritten academic_supervisors.py with intervention endpoints")

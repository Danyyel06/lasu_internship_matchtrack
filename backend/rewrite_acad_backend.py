import os

filepath = "c:/Users/User/lasu-internship-platform/backend/app/api/v1/endpoints/academic_supervisors.py"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

search = """        company_name = comp_obj.company_name
        role_title = int_obj.title
        framework_status = "not_sent"
        pulse_status = "submitted"
        pulse_date = datetime.now().strftime("%Y-%m-%d")

        fw_res = await db.execute(select(UnifiedFramework).where(UnifiedFramework.application_id == app_obj.id))
        fw = fw_res.scalar_one_or_none()
        if fw:
            framework_status = fw.status.lower()"""

replace = """        from app.models.weekly_pulse import WeeklyPulse
        
        company_name = comp_obj.company_name
        role_title = int_obj.title
        framework_status = "not_sent"
        
        # Calculate week number
        now = datetime.now()
        week_number = now.isocalendar()[1]
        
        # Check pulse for current week
        pulse_res = await db.execute(select(WeeklyPulse).where(WeeklyPulse.application_id == app_obj.id, WeeklyPulse.week_number == week_number))
        pulse = pulse_res.scalar_one_or_none()
        
        if pulse and pulse.reflection:
            pulse_status = "submitted"
            pulse_date = pulse.submitted_at.strftime("%Y-%m-%d") if pulse.submitted_at else now.strftime("%Y-%m-%d")
        elif pulse and pulse.micro_goals:
            pulse_status = "in_progress"
            pulse_date = now.strftime("%Y-%m-%d")
        else:
            pulse_status = "overdue" if now.weekday() > 0 else "pending" # Overdue if Monday passed without goals, simplified logic
            pulse_date = "-"

        fw_res = await db.execute(select(UnifiedFramework).where(UnifiedFramework.application_id == app_obj.id))
        fw = fw_res.scalar_one_or_none()
        if fw:
            framework_status = fw.status.lower()"""

content = content.replace(search, replace)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Rewritten academic_supervisors.py")

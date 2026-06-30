import pytest
from unittest.mock import AsyncMock, MagicMock
from app.services.matching import FitScoreCalculator, TierBander, GapAnalyser, FairAllocationEngine
from app.models.student import Student, StudentSkill
from app.models.internship import Internship, InternshipRequirement
from app.models.application import Application

@pytest.mark.asyncio
async def test_fit_score_high_cgpa_skills():
    db = AsyncMock()
    
    student = Student(id=1, cgpa=4.5, project_count=3, coursework_count=5)
    internship = Internship(id=1, job_family_id=None)
    
    db.scalar.side_effect = [student, internship, None] # job_family is None
    
    req_mock = MagicMock()
    req_mock.scalars.return_value.all.return_value = [InternshipRequirement(skill_name="Python", required_level=4)]
    
    skill_mock = MagicMock()
    skill_mock.scalars.return_value.all.return_value = [StudentSkill(skill_name="Python", verified_level=4)]
    
    db.execute.side_effect = [req_mock, skill_mock]
    
    score = await FitScoreCalculator.calculate_fit_score(1, 1, db)
    
    # cgpa = 4.5/5.0 * 100 = 90
    # skills = 4/5.0 * 100 = 80
    # project = 100
    # coursework = 100
    # avg = (90*25 + 80*25 + 100*25 + 100*25) / 100 = (22.5 + 20 + 25 + 25) = 92.5
    assert score > 70.0
    assert score == 92.5

@pytest.mark.asyncio
async def test_fit_score_low_cgpa_skills():
    db = AsyncMock()
    
    student = Student(id=2, cgpa=2.0, project_count=0, coursework_count=0)
    internship = Internship(id=2, job_family_id=None)
    
    db.scalar.side_effect = [student, internship, None]
    
    req_mock = MagicMock()
    req_mock.scalars.return_value.all.return_value = [InternshipRequirement(skill_name="Java", required_level=4)]
    
    skill_mock = MagicMock()
    skill_mock.scalars.return_value.all.return_value = [StudentSkill(skill_name="Java", verified_level=2)]
    
    db.execute.side_effect = [req_mock, skill_mock]
    
    score = await FitScoreCalculator.calculate_fit_score(2, 2, db)
    
    # cgpa = 2.0/5.0 * 100 = 40
    # skills = 2/5.0 * 100 = 40
    # project = 0
    # coursework = 0
    # avg = (40*25 + 40*25 + 0 + 0) / 100 = 20
    assert score < 40.0
    assert score == 20.0

@pytest.mark.asyncio
async def test_fair_allocation_competitive():
    db = AsyncMock()
    
    app1 = Application(id=1, student_id=1, internship_id=1, fit_score=80)
    app2 = Application(id=2, student_id=2, internship_id=1, fit_score=50)
    
    app_mock = MagicMock()
    app_mock.scalars.return_value.all.return_value = [app1, app2]
    
    db.execute.side_effect = [app_mock]
    
    # Patch GapAnalyser
    original_analyse = GapAnalyser.analyse_gaps
    async def mock_analyse_gaps(student_id, internship_id, db):
        if student_id == 1:
            return [{"meets_requirement": True, "is_mandatory": True}]
        else:
            return [{"meets_requirement": False, "is_mandatory": True}]
            
    GapAnalyser.analyse_gaps = mock_analyse_gaps
    
    pool = await FairAllocationEngine.get_competitive_pool(1, db)
    GapAnalyser.analyse_gaps = original_analyse
    
    assert len(pool) == 1
    assert pool[0].id == 1

@pytest.mark.asyncio
async def test_fair_allocation_equity_interleaving():
    db = AsyncMock()
    
    apps = [
        Application(id=1, tier_at_application="T1", fit_score=90),
        Application(id=2, tier_at_application="T1", fit_score=85),
        Application(id=3, tier_at_application="T2", fit_score=60),
        Application(id=4, tier_at_application="T3", fit_score=30),
        Application(id=5, tier_at_application="T3", fit_score=20),
    ]
    
    app_mock = MagicMock()
    app_mock.scalars.return_value.all.return_value = apps
    
    db.execute.return_value = app_mock
    
    pool = await FairAllocationEngine.get_equity_pool(1, db)
    
    assert len(pool) == 5
    assert pool[0].tier_at_application == "T1"
    assert pool[1].tier_at_application == "T2"
    assert pool[2].tier_at_application == "T3"
    assert pool[3].tier_at_application == "T1"
    assert pool[4].tier_at_application == "T3"

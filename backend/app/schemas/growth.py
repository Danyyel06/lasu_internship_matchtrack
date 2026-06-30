from pydantic import BaseModel
from typing import List


class GrowthSummaryResponse(BaseModel):
    total_logs: int
    total_wednesday_submissions: int
    total_saturday_submissions: int
    total_quizzes_passed: int
    total_quizzes_attempted: int
    pass_rate_percentage: float

    class Config:
        from_attributes = True

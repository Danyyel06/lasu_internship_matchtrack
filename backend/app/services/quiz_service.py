"""
AI Quiz Service — generates and grades quizzes from weekly log content.

Uses Google Gemini API to generate 5 multiple-choice questions based on the
student's Wednesday and Saturday check-in entries. Falls back gracefully if
the API key is not configured.
"""
import os
import json
from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.weekly_log import WeeklyLog, AIQuizAttempt
from app.schemas.log import QuizResultResponse

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
PASS_THRESHOLD = 3  # Score >= 3 out of 5 to pass


def _build_prompt(log: WeeklyLog) -> str:
    wed = log.wed_content or {}
    sat = log.sat_content or {}

    context = (
        f"Wednesday check-in:\n"
        f"  Focus Area: {wed.get('focus_area', '')}\n"
        f"  Core Action: {wed.get('core_action', '')}\n"
        f"  Blocker: {wed.get('the_blocker', '')}\n"
        f"  Takeaway: {wed.get('the_takeaway', '')}\n\n"
        f"Saturday check-in:\n"
        f"  Focus Area: {sat.get('focus_area', '')}\n"
        f"  Core Action: {sat.get('core_action', '')}\n"
        f"  Blocker: {sat.get('the_blocker', '')}\n"
        f"  Takeaway: {sat.get('the_takeaway', '')}"
    )

    return (
        "You are an educational quiz generator for SIWES (Student Industrial Work Experience Scheme) interns.\n\n"
        "Based on the following student's weekly work log, generate exactly 5 multiple-choice questions "
        "that test comprehension of what they learned and did this week.\n\n"
        f"{context}\n\n"
        "Format your response as a JSON array with exactly 5 objects, each with:\n"
        '  "question": string,\n'
        '  "options": array of exactly 4 strings,\n'
        '  "correct_index": integer (0-3)\n\n'
        "Return ONLY the JSON array, no markdown, no explanation."
    )


class AIQuizService:

    @staticmethod
    async def generate_and_save(log_id: int, db: AsyncSession) -> Optional[AIQuizAttempt]:
        """
        Generate quiz questions from the log content using Gemini.
        If GEMINI_API_KEY is not set or generation fails, leaves quiz_attempt as None.
        """
        if not GEMINI_API_KEY:
            return None

        log_res = await db.execute(select(WeeklyLog).where(WeeklyLog.id == log_id))
        log = log_res.scalar_one_or_none()
        if not log:
            return None

        # Skip if quiz already generated
        if log.quiz_attempt:
            return log.quiz_attempt

        try:
            import httpx

            prompt = _build_prompt(log)
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.post(
                    f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}",
                    json={
                        "contents": [{"parts": [{"text": prompt}]}],
                        "generationConfig": {"temperature": 0.7, "maxOutputTokens": 1024},
                    },
                )
            resp.raise_for_status()
            raw_text = resp.json()["candidates"][0]["content"]["parts"][0]["text"]

            # Strip possible markdown code fences
            raw_text = raw_text.strip()
            if raw_text.startswith("```"):
                raw_text = raw_text.split("```", 2)[1]
                if raw_text.startswith("json"):
                    raw_text = raw_text[4:]
            questions = json.loads(raw_text)

            # Validate structure
            assert isinstance(questions, list) and len(questions) == 5
            correct_answers = [int(q["correct_index"]) for q in questions]

            # Strip correct_index from what the student sees
            quiz_questions = [
                {"question": q["question"], "options": q["options"]}
                for q in questions
            ]

            attempt = AIQuizAttempt(
                weekly_log_id=log.id,
                questions=quiz_questions,
                correct_answers=correct_answers,
            )
            db.add(attempt)
            await db.commit()
            await db.refresh(attempt)
            return attempt

        except Exception:
            # Generation failed — quiz remains unavailable
            return None

    @staticmethod
    async def grade_and_save(
        log: WeeklyLog,
        student_answers: List[int],
        db: AsyncSession,
    ) -> QuizResultResponse:
        """Grade the student's answers and persist the result."""
        attempt = log.quiz_attempt
        if not attempt or not attempt.correct_answers:
            # No quiz generated — auto-pass with 0 score
            if not attempt:
                attempt = AIQuizAttempt(weekly_log_id=log.id)
                db.add(attempt)
                await db.flush()

            attempt.student_answers = student_answers
            attempt.score = 0
            attempt.passed = False
            attempt.attempted_at = datetime.now(timezone.utc)
            await db.commit()
            return QuizResultResponse(
                weekly_log_id=log.id,
                score=0,
                passed=False,
                failed_due_to_tab_switch=False,
            )

        correct = attempt.correct_answers
        score = sum(
            1
            for i, ans in enumerate(student_answers)
            if i < len(correct) and ans == correct[i]
        )
        passed = score >= PASS_THRESHOLD

        attempt.student_answers = student_answers
        attempt.score = score
        attempt.passed = passed
        attempt.attempted_at = datetime.now(timezone.utc)
        await db.commit()

        return QuizResultResponse(
            weekly_log_id=log.id,
            score=score,
            passed=passed,
            failed_due_to_tab_switch=False,
            questions=attempt.questions,
            student_answers=student_answers,
            correct_answers=correct,
        )

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

/**
 * AIQuiz screen
 * Route: /student/log/quiz/:logId  (logId = WeeklyLog DB id, NOT week number)
 *
 * Anti-cheat:
 *  - visibilitychange: if document becomes hidden → auto-fail
 *  - window blur: if user tabs away → auto-fail
 *  Both events fire the same auto-fail handler and submit immediately.
 *
 * Flow:
 *  1. GET /api/v1/logs/quiz/{logId}/questions → load questions
 *  2. Student answers one question at a time
 *  3. POST /api/v1/logs/quiz/{logId}/submit → server grades and returns score
 */

interface Question {
  question: string;
  options: string[];
}

interface QuizResult {
  score: number;
  passed: boolean;
  failed_due_to_tab_switch: boolean;
  questions?: Question[];
  student_answers?: number[];
  correct_answers?: number[];
}

export default function AIQuiz() {
  const { logId } = useParams<{ logId: string }>();
  const navigate = useNavigate();
  const numericLogId = parseInt(logId || '0', 10);

  // Quiz states
  const [questions, setQuestions] = useState<Question[]>([]);
  const [weekNumber, setWeekNumber] = useState<number>(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alreadyAttempted, setAlreadyAttempted] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [autoFailed, setAutoFailed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);

  // ── Load questions ────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const res = await axios.get(
          `http://localhost:8000/api/v1/logs/quiz/${numericLogId}/questions`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = res.data;
        if (data.already_attempted) {
          setAlreadyAttempted(true);
        }
        setQuestions(data.questions || []);
        setWeekNumber(data.week_number || 0);
      } catch (err: any) {
        const detail = err?.response?.data?.detail;
        setError(
          detail === 'Quiz not yet available. Please try again in a moment.'
            ? '⚙️ Your quiz is still being generated. Please go back and try again in a few seconds.'
            : detail || 'Failed to load quiz. Please go back and try again.'
        );
      } finally {
        setLoading(false);
      }
    };
    if (numericLogId) fetchQuestions();
  }, [numericLogId]);

  // ── Auto-fail handler ─────────────────────────────────────────────────────
  const handleAutoFail = useCallback(async () => {
    if (!quizStarted || autoFailed || result) return;
    setAutoFailed(true);
    setSubmitting(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.post(
        `http://localhost:8000/api/v1/logs/quiz/${numericLogId}/submit`,
        {
          weekly_log_id: numericLogId,
          student_answers: [],
          failed_due_to_tab_switch: true,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResult(res.data);
    } catch {
      setResult({ score: 0, passed: false, failed_due_to_tab_switch: true });
    } finally {
      setSubmitting(false);
    }
  }, [quizStarted, autoFailed, result, numericLogId]);

  // ── Anti-cheat: visibilitychange + window blur ────────────────────────────
  useEffect(() => {
    if (!quizStarted) return;

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleAutoFail();
      }
    };
    const onBlur = () => {
      handleAutoFail();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onBlur);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', onBlur);
    };
  }, [quizStarted, handleAutoFail]);

  // ── Normal submit ─────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.post(
        `http://localhost:8000/api/v1/logs/quiz/${numericLogId}/submit`,
        {
          weekly_log_id: numericLogId,
          student_answers: selectedAnswers,
          failed_due_to_tab_switch: false,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResult(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectOption = (optionIndex: number) => {
    const next = [...selectedAnswers];
    next[currentIndex] = optionIndex;
    setSelectedAnswers(next);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(i => i + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(i => i - 1);
    }
  };

  const isLastQuestion = currentIndex === questions.length - 1;
  const currentAnswer = selectedAnswers[currentIndex];
  const answeredCount = selectedAnswers.filter(a => a !== undefined).length;
  const allAnswered = answeredCount === questions.length;

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="fixed inset-0 bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white text-sm">Loading your quiz...</p>
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="fixed inset-0 bg-neutral-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-neutral-800 font-medium mb-6">{error}</p>
          <button
            onClick={() => navigate('/student/log')}
            className="px-6 py-3 bg-neutral-900 text-white rounded-xl text-sm font-semibold hover:bg-neutral-700 transition-colors"
          >
            ← Back to Evidence Log
          </button>
        </div>
      </div>
    );
  }

  // ── Already attempted ─────────────────────────────────────────────────────
  if (alreadyAttempted) {
    return (
      <div className="fixed inset-0 bg-neutral-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 text-center">
          <div className="text-4xl mb-4">✅</div>
          <h2 className="text-xl font-bold text-neutral-900 mb-2">Quiz Already Completed</h2>
          <p className="text-neutral-500 mb-6 text-sm">
            You have already submitted this week's quiz. Your score is recorded.
          </p>
          <button
            onClick={() => navigate('/student/log')}
            className="px-6 py-3 bg-neutral-900 text-white rounded-xl text-sm font-semibold"
          >
            View Evidence Log
          </button>
        </div>
      </div>
    );
  }

  // ── Results screen ────────────────────────────────────────────────────────
  if (result) {
    return (
      <div className="fixed inset-0 bg-neutral-950 flex items-center justify-center p-4 overflow-y-auto">
        <div className="max-w-lg w-full bg-white rounded-2xl p-8 my-8">
          {/* Score header */}
          <div className={`text-center mb-8 p-6 rounded-2xl ${
            result.failed_due_to_tab_switch
              ? 'bg-orange-50'
              : result.passed ? 'bg-green-50' : 'bg-red-50'
          }`}>
            <div className="text-5xl mb-3">
              {result.failed_due_to_tab_switch ? '⚡' : result.passed ? '🏆' : '😔'}
            </div>
            <h2 className="text-2xl font-bold text-neutral-900 mb-1">
              {result.failed_due_to_tab_switch
                ? 'Auto-Failed'
                : result.passed
                ? 'Quiz Passed!'
                : 'Quiz Failed'}
            </h2>
            {result.failed_due_to_tab_switch ? (
              <p className="text-orange-700 text-sm font-medium">
                You switched tabs or windows during the quiz. This attempt has been recorded as a failure.
              </p>
            ) : (
              <p className={`text-2xl font-bold mt-2 ${result.passed ? 'text-green-700' : 'text-red-700'}`}>
                {result.score} / {questions.length || 5}
              </p>
            )}
          </div>

          {/* Q&A review accordion */}
          {result.questions && result.questions.length > 0 && (
            <div className="mb-6 space-y-3">
              <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-wider">Review</h3>
              {result.questions.map((q, i) => {
                const studentAns = result.student_answers?.[i];
                const correctAns = result.correct_answers?.[i];
                const isCorrect = studentAns === correctAns;
                return (
                  <details key={i} className="group border border-neutral-200 rounded-xl overflow-hidden">
                    <summary className={`flex items-center gap-3 px-4 py-3 cursor-pointer select-none list-none ${
                      isCorrect ? 'bg-green-50' : 'bg-red-50'
                    }`}>
                      <span className={`flex-shrink-0 text-sm font-bold ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                        {isCorrect ? '✓' : '✗'} Q{i + 1}
                      </span>
                      <p className="text-sm text-neutral-800 font-medium">{q.question}</p>
                    </summary>
                    <div className="px-4 py-3 space-y-1.5 bg-white">
                      {q.options.map((opt, j) => (
                        <div key={j} className={`px-3 py-2 rounded-lg text-sm ${
                          j === correctAns ? 'bg-green-50 text-green-800 font-medium border border-green-200' :
                          j === studentAns && !isCorrect ? 'bg-red-50 text-red-800 border border-red-200' :
                          'text-neutral-600'
                        }`}>
                          {j === correctAns && '✓ '}{opt}
                          {j === studentAns && j !== correctAns && ' ← your answer'}
                        </div>
                      ))}
                    </div>
                  </details>
                );
              })}
            </div>
          )}

          <button
            onClick={() => navigate('/student/log')}
            className="w-full py-3.5 bg-neutral-900 hover:bg-neutral-700 text-white rounded-xl text-sm font-bold transition-colors"
          >
            Back to Evidence Log
          </button>
        </div>
      </div>
    );
  }

  // ── Pre-start screen ──────────────────────────────────────────────────────
  if (!quizStarted) {
    return (
      <div className="fixed inset-0 bg-neutral-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 text-center">
          <div className="text-4xl mb-4">🧠</div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">
            Week {weekNumber} AI Quiz
          </h1>
          <p className="text-neutral-500 text-sm mb-6">
            {questions.length} scenario questions based on your check-in content.
          </p>
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6 text-left">
            <p className="text-orange-800 text-sm font-bold mb-2">⚠️ Important Rules</p>
            <ul className="text-orange-700 text-sm space-y-1">
              <li>• Do NOT switch tabs or windows during the quiz</li>
              <li>• Switching away <span className="font-bold">automatically fails</span> your attempt</li>
              <li>• You have one attempt only</li>
              <li>• You need {Math.ceil(questions.length * 0.6)}/{questions.length} to pass</li>
            </ul>
          </div>
          <button
            onClick={() => setQuizStarted(true)}
            className="w-full py-4 bg-neutral-900 hover:bg-neutral-700 text-white rounded-xl font-bold text-sm transition-colors"
          >
            Start Quiz →
          </button>
          <button
            onClick={() => navigate('/student/log')}
            className="mt-3 w-full py-3 text-neutral-500 text-sm hover:text-neutral-700 transition-colors"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  // ── Active quiz (full-screen locked) ──────────────────────────────────────
  if (autoFailed) {
    return (
      <div className="fixed inset-0 bg-neutral-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 text-center">
          <div className="text-4xl mb-4">⚡</div>
          <h2 className="text-xl font-bold text-neutral-900 mb-2">Tab Switch Detected</h2>
          <p className="text-neutral-500 text-sm mb-2">
            You left the quiz window. This attempt has been automatically failed.
          </p>
          {submitting && <p className="text-blue-600 text-sm mb-4 animate-pulse">Recording result...</p>}
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  return (
    <div className="fixed inset-0 bg-neutral-950 flex flex-col overflow-hidden">
      {/* Quiz header */}
      <div className="bg-neutral-900 border-b border-neutral-800 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div>
          <p className="text-xs text-neutral-500 uppercase tracking-wider font-bold">Week {weekNumber} AI Quiz</p>
          <p className="text-white text-sm font-semibold mt-0.5">
            Question {currentIndex + 1} of {questions.length}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {questions.map((_, i) => (
            <div key={i} className={`h-2 rounded-full transition-all ${
              selectedAnswers[i] !== undefined ? 'w-6 bg-blue-500' :
              i === currentIndex ? 'w-4 bg-neutral-400' : 'w-2 bg-neutral-700'
            }`} />
          ))}
        </div>
      </div>

      {/* Anti-cheat warning strip */}
      <div className="bg-orange-900/60 border-b border-orange-700/40 px-6 py-2 flex items-center gap-2">
        <span className="text-orange-300 text-xs font-medium">
          ⚡ Anti-cheat active — switching tabs or windows will automatically fail this attempt
        </span>
      </div>

      {/* Question area */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col justify-between">
        <div className="max-w-xl mx-auto w-full space-y-6">
          <div>
            <p className="text-xs text-neutral-500 uppercase tracking-wider font-bold mb-2">
              Q{currentIndex + 1}
            </p>
            <h2 className="text-lg font-semibold text-white leading-relaxed">
              {currentQ?.question}
            </h2>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {currentQ?.options.map((option, i) => (
              <button
                key={i}
                onClick={() => handleSelectOption(i)}
                className={`w-full text-left px-5 py-4 rounded-xl border-2 text-sm font-medium transition-all ${
                  currentAnswer === i
                    ? 'border-blue-500 bg-blue-900/40 text-blue-300'
                    : 'border-neutral-700 bg-neutral-800/50 text-neutral-300 hover:border-neutral-500 hover:bg-neutral-800'
                }`}
              >
                <span className={`inline-flex w-7 h-7 rounded-full items-center justify-center text-xs font-bold mr-3 ${
                  currentAnswer === i ? 'bg-blue-500 text-white' : 'bg-neutral-700 text-neutral-400'
                }`}>
                  {String.fromCharCode(65 + i)}
                </span>
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation + Submit */}
        <div className="max-w-xl mx-auto w-full mt-8 flex gap-3">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="flex-1 py-3.5 rounded-xl text-sm font-semibold border border-neutral-700 text-neutral-300 hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            ← Previous
          </button>

          {isLastQuestion ? (
            <button
              onClick={handleSubmit}
              disabled={!allAnswered || submitting}
              className={`flex-1 py-3.5 rounded-xl text-sm font-bold transition-colors ${
                allAnswered && !submitting
                  ? 'bg-blue-600 hover:bg-blue-500 text-white'
                  : 'bg-neutral-700 text-neutral-500 cursor-not-allowed'
              }`}
            >
              {submitting ? 'Submitting...' : allAnswered ? 'Submit Quiz →' : `Answer all (${answeredCount}/${questions.length})`}
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={currentAnswer === undefined}
              className={`flex-1 py-3.5 rounded-xl text-sm font-bold transition-colors ${
                currentAnswer !== undefined
                  ? 'bg-blue-600 hover:bg-blue-500 text-white'
                  : 'bg-neutral-700 text-neutral-500 cursor-not-allowed'
              }`}
            >
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

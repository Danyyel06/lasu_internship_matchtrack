import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../lib/axios';

interface Question {
  question: string;
  options: string[];
}

interface SkillGroup {
  skill_name: string;
  claimed_level: number;
  difficulty_tier: string;
  difficulty_label: string;
  questions: Question[];
  question_snapshot_id: number;
}

export default function SkillDiagnosticTest() {
  const navigate = useNavigate();
  const [skillGroups, setSkillGroups] = useState<SkillGroup[]>([]);
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [testStarted, setTestStarted] = useState(false);
  const [groupIntro, setGroupIntro] = useState(true);
  
  const [autoFailed, setAutoFailed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [groupResult, setGroupResult] = useState<{passed: boolean, score: number, total: number} | null>(null);

  // Load questions on mount
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await axiosInstance.post('/skill-verification/begin');
        const groups = res.data.skill_groups;
        if (!groups || groups.length === 0) {
          // Nothing to verify, redirect to dashboard or result
          navigate('/student/skill-verification');
          return;
        }
        setSkillGroups(groups);
      } catch (err: any) {
        setError(err?.response?.data?.detail || 'Failed to start diagnostic.');
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, [navigate]);

  // Tab switch logic
  const handleAutoFail = useCallback(async () => {
    if (!testStarted || groupIntro || autoFailed || groupResult || submitting) return;
    setAutoFailed(true);
    setSubmitting(true);
    try {
      const group = skillGroups[currentGroupIndex];
      const res = await axiosInstance.post('/skill-verification/submit-skill', {
        skill_name: group.skill_name,
        student_answers: [],
        questions_snapshot_id: group.question_snapshot_id,
        failed_due_to_tab_switch: true
      });
      setGroupResult({
        passed: res.data.passed,
        score: res.data.score,
        total: res.data.total_questions
      });
    } catch {
      setGroupResult({ passed: false, score: 0, total: 1 });
    } finally {
      setSubmitting(false);
    }
  }, [testStarted, groupIntro, autoFailed, groupResult, submitting, skillGroups, currentGroupIndex]);

  useEffect(() => {
    if (!testStarted || groupIntro) return;

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') handleAutoFail();
    };
    const onBlur = () => handleAutoFail();

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onBlur);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', onBlur);
    };
  }, [testStarted, groupIntro, handleAutoFail]);

  const handleSelectOption = (idx: number) => {
    const next = [...selectedAnswers];
    next[currentQIndex] = idx;
    setSelectedAnswers(next);
  };

  const handleNextQ = () => {
    const group = skillGroups[currentGroupIndex];
    if (currentQIndex < group.questions.length - 1) {
      setCurrentQIndex(i => i + 1);
    }
  };

  const handlePrevQ = () => {
    if (currentQIndex > 0) {
      setCurrentQIndex(i => i - 1);
    }
  };

  const handleSubmitGroup = async () => {
    setSubmitting(true);
    try {
      const group = skillGroups[currentGroupIndex];
      const res = await axiosInstance.post('/skill-verification/submit-skill', {
        skill_name: group.skill_name,
        student_answers: selectedAnswers,
        questions_snapshot_id: group.question_snapshot_id,
        failed_due_to_tab_switch: false
      });
      setGroupResult({
        passed: res.data.passed,
        score: res.data.score,
        total: res.data.total_questions
      });
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleContinueNextGroup = async () => {
    if (currentGroupIndex === skillGroups.length - 1) {
      // Complete full diagnostic
      setSubmitting(true);
      try {
        await axiosInstance.post('/skill-verification/complete');
        navigate('/student/skill-verification/result');
      } catch (err) {
        alert('Failed to finalize verification');
        setSubmitting(false);
      }
    } else {
      // Next skill
      setCurrentGroupIndex(i => i + 1);
      setCurrentQIndex(0);
      setSelectedAnswers([]);
      setGroupResult(null);
      setAutoFailed(false);
      setGroupIntro(true);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-neutral-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-neutral-950 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl max-w-md w-full text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={() => navigate('/student/skill-verification')} className="px-6 py-2 bg-neutral-900 text-white rounded-lg">Go Back</button>
        </div>
      </div>
    );
  }

  if (!testStarted) {
    return (
      <div className="fixed inset-0 bg-neutral-950 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl max-w-md w-full text-center">
          <div className="text-4xl mb-4">⚙️</div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">Diagnostic Ready</h1>
          <p className="text-neutral-500 mb-6 text-sm">
            You will be tested on {skillGroups.length} skills. You cannot pause or save progress once started.
          </p>
          <button onClick={() => setTestStarted(true)} className="w-full py-4 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 transition-colors">
            Start Test
          </button>
        </div>
      </div>
    );
  }

  const currentGroup = skillGroups[currentGroupIndex];

  if (groupIntro) {
    return (
      <div className="fixed inset-0 bg-neutral-950 flex flex-col items-center justify-center p-6 text-white text-center">
        <p className="text-teal-400 font-bold uppercase tracking-widest text-sm mb-4">Skill {currentGroupIndex + 1} of {skillGroups.length}</p>
        <h1 className="text-4xl font-bold mb-2">{currentGroup.skill_name}</h1>
        <p className="text-neutral-400 mb-8">{currentGroup.difficulty_label} • {currentGroup.questions.length} questions</p>
        <button onClick={() => setGroupIntro(false)} className="px-8 py-3 bg-white text-neutral-900 font-bold rounded-full hover:bg-neutral-200 transition-colors">
          Continue
        </button>
      </div>
    );
  }

  if (groupResult) {
    return (
      <div className="fixed inset-0 bg-neutral-950 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl max-w-md w-full text-center">
          {autoFailed ? (
            <div className="text-5xl mb-4">⚡</div>
          ) : (
            <div className="text-5xl mb-4">{groupResult.passed ? '✅' : '❌'}</div>
          )}
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">
            {autoFailed ? 'Tab Switch Detected' : groupResult.passed ? 'Skill Verified!' : 'Not Verified'}
          </h2>
          <p className="text-neutral-600 mb-6">
            {autoFailed 
              ? 'You left the window, so this skill attempt automatically failed.' 
              : `You scored ${groupResult.score} / ${groupResult.total}`}
          </p>
          <button 
            onClick={handleContinueNextGroup}
            disabled={submitting}
            className="w-full py-4 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl font-bold disabled:opacity-50"
          >
            {submitting ? 'Finalizing...' : currentGroupIndex === skillGroups.length - 1 ? 'Finish Diagnostic' : 'Next Skill →'}
          </button>
        </div>
      </div>
    );
  }

  const currentQ = currentGroup.questions[currentQIndex];
  const currentAnswer = selectedAnswers[currentQIndex];
  const answeredCount = selectedAnswers.filter(a => a !== undefined).length;
  const allAnswered = answeredCount === currentGroup.questions.length;
  const isLastQuestion = currentQIndex === currentGroup.questions.length - 1;

  return (
    <div className="fixed inset-0 bg-neutral-950 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-neutral-900 border-b border-neutral-800 px-6 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-neutral-500 uppercase tracking-wider font-bold">Now Testing: {currentGroup.skill_name}</p>
          <p className="text-white text-sm font-semibold mt-0.5">Question {currentQIndex + 1} of {currentGroup.questions.length}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-neutral-500 font-bold">Skill {currentGroupIndex + 1} of {skillGroups.length}</p>
        </div>
      </div>

      <div className="bg-orange-900/60 border-b border-orange-700/40 px-6 py-2 flex items-center">
        <span className="text-orange-300 text-xs font-medium">
          ⚡ Anti-cheat active — switching tabs will automatically fail this skill group.
        </span>
      </div>

      {/* Question */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col">
        <div className="max-w-xl mx-auto w-full space-y-6 flex-1">
          <h2 className="text-lg font-semibold text-white leading-relaxed">{currentQ?.question}</h2>
          
          <div className="space-y-3">
            {currentQ?.options.map((option, i) => (
              <button
                key={i}
                onClick={() => handleSelectOption(i)}
                className={`w-full text-left px-5 py-4 rounded-xl border-2 text-sm font-medium transition-all ${
                  currentAnswer === i
                    ? 'border-teal-500 bg-teal-900/40 text-teal-300'
                    : 'border-neutral-700 bg-neutral-800/50 text-neutral-300 hover:border-neutral-500 hover:bg-neutral-800'
                }`}
              >
                <span className={`inline-flex w-7 h-7 rounded-full items-center justify-center text-xs font-bold mr-3 ${
                  currentAnswer === i ? 'bg-teal-500 text-white' : 'bg-neutral-700 text-neutral-400'
                }`}>
                  {String.fromCharCode(65 + i)}
                </span>
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* Nav */}
        <div className="max-w-xl mx-auto w-full mt-8 flex gap-3 pb-8">
          <button
            onClick={handlePrevQ}
            disabled={currentQIndex === 0}
            className="flex-1 py-3.5 rounded-xl text-sm font-semibold border border-neutral-700 text-neutral-300 hover:bg-neutral-800 disabled:opacity-40"
          >
            ← Previous
          </button>
          
          {isLastQuestion ? (
            <button
              onClick={handleSubmitGroup}
              disabled={!allAnswered || submitting}
              className={`flex-1 py-3.5 rounded-xl text-sm font-bold transition-colors ${
                allAnswered && !submitting ? 'bg-teal-600 text-white' : 'bg-neutral-700 text-neutral-500'
              }`}
            >
              {submitting ? 'Submitting...' : 'Submit Skill Group'}
            </button>
          ) : (
            <button
              onClick={handleNextQ}
              disabled={currentAnswer === undefined}
              className={`flex-1 py-3.5 rounded-xl text-sm font-bold transition-colors ${
                currentAnswer !== undefined ? 'bg-teal-600 text-white' : 'bg-neutral-700 text-neutral-500'
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

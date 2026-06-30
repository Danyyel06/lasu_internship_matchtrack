import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

// Status values returned by the backend /logs/current-week endpoint
// wed_status / sat_status: "not_started" | "submitted" | "locked"
// quiz_status: "unavailable" | "available" | "completed" | "generating"
interface CurrentWeekStatus {
  week_number: number;
  wed_status: string;
  sat_status: string;
  quiz_status: string;
  weekly_log_id: number | null;
  quiz_result?: {
    score: number;
    passed: boolean;
    failed_due_to_tab_switch: boolean;
  } | null;
}

interface LogEntry {
  id: number;
  week_number: number;
  wed_submitted_at: string | null;
  sat_submitted_at: string | null;
  wed_content: { focus_area: string; core_action: string; the_blocker: string; the_takeaway: string } | null;
  sat_content: { focus_area: string; core_action: string; the_blocker: string; the_takeaway: string } | null;
  quiz_score: number | null;
  quiz_passed: boolean | null;
}

export default function LogDashboard() {
  const navigate = useNavigate();
  const [currentWeek, setCurrentWeek] = useState<CurrentWeekStatus | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [noPlacement, setNoPlacement] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const headers = { Authorization: `Bearer ${token}` };

        const [weekRes, logsRes] = await Promise.all([
          axios.get('http://localhost:8000/api/v1/logs/current-week', { headers }),
          axios.get('http://localhost:8000/api/v1/logs/my-logs', { headers }),
        ]);
        setCurrentWeek(weekRes.data);
        setLogs(logsRes.data);
      } catch (err: any) {
        if (err?.response?.status === 400) {
          setNoPlacement(true);
        } else {
          setError('Failed to load log data. Please check your connection and try again.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const StatusBadge = ({ status }: { status: string }) => {
    if (status === 'submitted') return <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-100">✓ Submitted</span>;
    if (status === 'not_started') return <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100">⏳ Pending</span>;
    if (status === 'locked') return <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-400">🔒 Locked</span>;
    if (status === 'available') return <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100">🧠 Ready</span>;
    if (status === 'generating') return <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">⚙️ Generating...</span>;
    if (status === 'completed') return <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-600">✅ Done</span>;
    if (status === 'unavailable') return <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-400">—</span>;
    return null;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 bg-neutral-100 rounded w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-48 bg-neutral-100 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (noPlacement) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-neutral-900 mb-6">Evidence Log</h1>
        <div className="bg-white rounded-xl border border-neutral-200 p-10 text-center shadow-sm">
          <div className="text-5xl mb-4">📋</div>
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">No Active Placement Yet</h2>
          <p className="text-neutral-500 max-w-md mx-auto">
            Your Evidence Log becomes available once you have an accepted internship placement. 
            Browse internships and apply to get started.
          </p>
          <Link
            to="/student/browse"
            className="mt-6 inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-colors"
          >
            Browse Internships
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-neutral-900 mb-6">Evidence Log</h1>
        <div className="bg-danger-50 border border-danger-base rounded-xl p-6 text-center">
          <p className="text-danger-dark font-medium">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 text-sm text-blue-600 hover:underline">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const handleQuizStart = () => {
    if (currentWeek?.weekly_log_id) {
      navigate(`/student/log/quiz/${currentWeek.weekly_log_id}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Evidence Log</h1>
        <p className="text-neutral-500 mt-1">
          Submit your bi-weekly check-ins every Wednesday and Saturday. Saturday unlocks your AI quiz.
        </p>
      </div>

      {/* Current Week */}
      {currentWeek && (
        <div>
          <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-4">
            Current Period — Week {currentWeek.week_number}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* Wednesday Card */}
            <div className={`bg-white rounded-xl border-2 p-6 shadow-sm transition-all ${
              currentWeek.wed_status === 'submitted' ? 'border-green-300' : 'border-neutral-200'
            }`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-2xl mb-2">📝</div>
                  <h3 className="font-bold text-neutral-900 text-sm">Wednesday Check-in</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">Mid-week progress</p>
                </div>
                <StatusBadge status={currentWeek.wed_status} />
              </div>
              <p className="text-xs text-neutral-600 mb-4 leading-relaxed">
                {currentWeek.wed_status === 'submitted'
                  ? 'Your Wednesday check-in has been recorded.'
                  : 'Share your Focus Area, Core Action, Blocker, and Takeaway.'}
              </p>
              {currentWeek.wed_status === 'not_started' ? (
                <Link
                  to="/student/log/submit/wednesday"
                  className="block w-full text-center py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  Submit Now →
                </Link>
              ) : (
                <div className="py-2 text-center text-sm text-green-700 font-medium bg-green-50 rounded-lg">
                  ✓ Complete
                </div>
              )}
            </div>

            {/* Saturday Card */}
            <div className={`bg-white rounded-xl border-2 p-6 shadow-sm transition-all ${
              currentWeek.sat_status === 'submitted' ? 'border-green-300' :
              currentWeek.sat_status === 'locked' ? 'border-dashed border-neutral-200 opacity-60' :
              'border-neutral-200'
            }`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-2xl mb-2">📸</div>
                  <h3 className="font-bold text-neutral-900 text-sm">Saturday Check-in</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">End-of-week wrap-up</p>
                </div>
                <StatusBadge status={currentWeek.sat_status} />
              </div>
              <p className="text-xs text-neutral-600 mb-4 leading-relaxed">
                {currentWeek.sat_status === 'locked'
                  ? 'Complete your Wednesday check-in first to unlock this.'
                  : currentWeek.sat_status === 'submitted'
                  ? 'Your Saturday check-in has been recorded.'
                  : 'Wrap up your week. Includes a mandatory workplace photo.'}
              </p>
              {currentWeek.sat_status === 'not_started' ? (
                <Link
                  to="/student/log/submit/saturday"
                  className="block w-full text-center py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  Submit Now →
                </Link>
              ) : currentWeek.sat_status === 'locked' ? (
                <div className="py-2 text-center text-sm text-neutral-400 font-medium">
                  🔒 Complete Wednesday first
                </div>
              ) : (
                <div className="py-2 text-center text-sm text-green-700 font-medium bg-green-50 rounded-lg">
                  ✓ Complete
                </div>
              )}
            </div>

            {/* AI Quiz Card */}
            <div className={`bg-white rounded-xl border-2 p-6 shadow-sm transition-all ${
              currentWeek.quiz_status === 'completed' && currentWeek.quiz_result?.passed ? 'border-green-300' :
              currentWeek.quiz_status === 'completed' && !currentWeek.quiz_result?.passed ? 'border-red-300' :
              currentWeek.quiz_status === 'available' ? 'border-amber-300' :
              'border-dashed border-neutral-200 opacity-60'
            }`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-2xl mb-2">🧠</div>
                  <h3 className="font-bold text-neutral-900 text-sm">AI Scenario Quiz</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">5 questions · auto-graded</p>
                </div>
                <StatusBadge status={currentWeek.quiz_status} />
              </div>
              <p className="text-xs text-neutral-600 mb-4 leading-relaxed">
                {currentWeek.quiz_status === 'unavailable' || currentWeek.quiz_status === 'locked'
                  ? 'Submit your Saturday check-in to unlock the AI quiz.'
                  : currentWeek.quiz_status === 'generating'
                  ? 'Your quiz is being generated by AI. Check back in a moment.'
                  : currentWeek.quiz_status === 'available'
                  ? 'Your quiz is ready! Do not switch tabs during the quiz.'
                  : currentWeek.quiz_result?.failed_due_to_tab_switch
                  ? 'Auto-failed (tab switch detected).'
                  : currentWeek.quiz_result?.passed
                  ? `Passed with ${currentWeek.quiz_result.score}/5. Well done!`
                  : `Score: ${currentWeek.quiz_result?.score ?? 0}/5. Better luck next week.`}
              </p>
              {currentWeek.quiz_status === 'available' ? (
                <button
                  onClick={handleQuizStart}
                  className="block w-full text-center py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  Start Quiz →
                </button>
              ) : currentWeek.quiz_status === 'generating' ? (
                <button onClick={() => window.location.reload()} className="block w-full text-center py-2 border border-blue-300 text-blue-600 text-sm font-semibold rounded-lg hover:bg-blue-50 transition-colors">
                  Refresh
                </button>
              ) : currentWeek.quiz_status === 'completed' ? (
                <div className={`py-2 text-center text-sm font-medium rounded-lg ${
                  currentWeek.quiz_result?.passed ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'
                }`}>
                  {currentWeek.quiz_result?.passed ? '✓ Passed' : '✗ Failed'}
                </div>
              ) : (
                <div className="py-2 text-center text-sm text-neutral-400">🔒 Locked</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Log History */}
      <div>
        <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-4">Log History</h2>

        {logs.length === 0 ? (
          <div className="bg-white rounded-xl border border-neutral-200 p-8 text-center shadow-sm">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-neutral-600 font-medium">No previous logs yet.</p>
            <p className="text-neutral-400 text-sm mt-1">Your submitted check-ins will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => {
              const bothSubmitted = log.wed_submitted_at && log.sat_submitted_at;
              const oneSubmitted = log.wed_submitted_at || log.sat_submitted_at;
              return (
                <div key={log.id} className="bg-white rounded-xl border border-neutral-200 p-5 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                        bothSubmitted ? 'bg-green-500' :
                        oneSubmitted ? 'bg-amber-400' : 'bg-red-400'
                      }`} />
                      <div>
                        <p className="font-semibold text-neutral-900">Week {log.week_number}</p>
                        <div className="flex gap-4 mt-1">
                          <span className="text-xs text-neutral-500">
                            Wed: {log.wed_submitted_at
                              ? <span className="text-green-700">✓ {new Date(log.wed_submitted_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}</span>
                              : <span className="text-neutral-400">Not submitted</span>}
                          </span>
                          <span className="text-xs text-neutral-500">
                            Sat: {log.sat_submitted_at
                              ? <span className="text-green-700">✓ {new Date(log.sat_submitted_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}</span>
                              : <span className="text-neutral-400">Not submitted</span>}
                          </span>
                        </div>
                      </div>
                    </div>
                    {log.quiz_score !== null && (
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                        log.quiz_passed ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                      }`}>
                        🧠 Quiz: {log.quiz_score}/5 — {log.quiz_passed ? 'Passed' : 'Failed'}
                      </span>
                    )}
                  </div>

                  {/* Preview of Wednesday focus area */}
                  {log.wed_content?.focus_area && (
                    <div className="mt-3 pt-3 border-t border-neutral-100">
                      <p className="text-xs text-neutral-400 font-medium uppercase tracking-wider mb-1">Focus Area</p>
                      <p className="text-sm text-neutral-700 line-clamp-2">{log.wed_content.focus_area}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

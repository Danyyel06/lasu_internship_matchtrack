import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../lib/axios';

interface WeekLog {
  week_number: number;
  wed_submitted: boolean;
  sat_submitted: boolean;
  wed_content: { focus_area: string; core_action: string; the_blocker: string; the_takeaway: string } | null;
  sat_content: { focus_area: string; core_action: string; the_blocker: string; the_takeaway: string } | null;
  quiz_score: number | null;
  quiz_passed: boolean | null;
}

interface Digest {
  student_name: string;
  department: string;
  month_year: string;
  weeks: WeekLog[];
  existing_review: { action: 'endorsed' | 'flagged'; flag_comment: string | null; created_at_wat: string } | null;
}

export default function MonthlyDigest() {
  const { studentId, monthYear } = useParams<{ studentId: string; monthYear: string }>();
  const navigate = useNavigate();

  const [digest, setDigest] = useState<Digest | null>(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<'none' | 'endorse' | 'flag'>('none');
  const [flagComment, setFlagComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null);

  useEffect(() => {
    const fetchDigest = async () => {
      try {
        const res = await api.get(`/monthly-review/${studentId}/${monthYear}/digest`);
        setDigest(res.data);
        if (res.data.existing_review) {
          setAction(res.data.existing_review.action === 'endorsed' ? 'endorse' : 'flag');
        }
      } catch (err: any) {
        setError(err?.response?.data?.detail || err.message || 'Failed to load digest.');
      } finally {
        setLoading(false);
      }
    };
    fetchDigest();
  }, [studentId, monthYear]);

  const handleSubmit = async (submitAction: 'endorse' | 'flag') => {
    if (submitAction === 'flag' && !flagComment.trim()) {
      setError('Please provide a flag comment.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const endpoint = `/monthly-review/${studentId}/${monthYear}/${submitAction}`;
      await api.post(endpoint, submitAction === 'flag' ? { flag_comment: flagComment } : {});
      navigate('/supervisor/monthly-review');
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-6 text-neutral-500">Loading monthly digest...</div>;
  if (!digest) return <div className="p-6 text-danger-dark">{error || 'Digest not found.'}</div>;

  const isLocked = !!digest.existing_review;

  const LogField = ({ label, value }: { label: string; value: string }) => (
    <div>
      <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm text-neutral-700">{value}</p>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-32">
      <div>
        <button onClick={() => navigate('/supervisor/monthly-review')} className="text-sm text-neutral-500 hover:text-neutral-700 flex items-center gap-1 mb-4">
          ← Back to Monthly Review
        </button>
        <h1 className="text-2xl font-bold text-neutral-900">Monthly Digest</h1>
        <p className="text-neutral-500 mt-1">
          <strong>{digest.student_name}</strong> · {digest.department} · {digest.month_year}
        </p>
      </div>

      {isLocked && digest.existing_review && (
        <div className={`rounded-xl p-4 border ${digest.existing_review.action === 'endorsed' ? 'bg-success-50 border-success-base' : 'bg-danger-50 border-danger-base'}`}>
          <p className={`font-semibold ${digest.existing_review.action === 'endorsed' ? 'text-success-dark' : 'text-danger-dark'}`}>
            {digest.existing_review.action === 'endorsed' ? '✅ This month has been endorsed' : '🚩 This month has been flagged'}
          </p>
          {digest.existing_review.flag_comment && (
            <p className="text-sm text-neutral-600 mt-1">Comment: {digest.existing_review.flag_comment}</p>
          )}
          <p className="text-xs text-neutral-400 mt-1">
            Submitted on {new Date(digest.existing_review.created_at_wat).toLocaleDateString()}
          </p>
        </div>
      )}

      {/* Week-by-week log cards */}
      {digest.weeks.length === 0 ? (
        <div className="bg-white rounded-xl border border-neutral-200 p-10 text-center">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-neutral-600 font-medium">No weekly log entries for this month yet.</p>
          <p className="text-neutral-400 text-sm mt-1">Entries will appear here as the intern submits their weekly logs.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {digest.weeks.map((log) => (
            <div key={log.week_number} className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
              <button
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-neutral-50 transition-colors"
                onClick={() => setExpandedWeek(expandedWeek === log.week_number ? null : log.week_number)}
              >
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-neutral-900">Week {log.week_number}</span>
                  <div className="flex gap-2">
                    {log.wed_submitted
                      ? <span className="px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-700 font-medium">Wed ✓</span>
                      : <span className="px-2 py-0.5 rounded text-xs bg-neutral-100 text-neutral-400 font-medium">Wed –</span>
                    }
                    {log.sat_submitted
                      ? <span className="px-2 py-0.5 rounded text-xs bg-violet-50 text-violet-700 font-medium">Sat ✓</span>
                      : <span className="px-2 py-0.5 rounded text-xs bg-neutral-100 text-neutral-400 font-medium">Sat –</span>
                    }
                    {log.quiz_score !== null && (
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${log.quiz_passed ? 'bg-success-50 text-success-dark' : 'bg-danger-50 text-danger-dark'}`}>
                        Quiz: {log.quiz_score}/5
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-neutral-400">{expandedWeek === log.week_number ? '▲' : '▼'}</span>
              </button>

              {expandedWeek === log.week_number && (
                <div className="border-t border-neutral-100 p-6 space-y-6">
                  {/* Wednesday */}
                  {log.wed_content ? (
                    <div>
                      <h3 className="text-sm font-bold text-blue-700 mb-3">Wednesday Check-in</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <LogField label="Focus Area" value={log.wed_content.focus_area} />
                        <LogField label="Core Action" value={log.wed_content.core_action} />
                        <LogField label="Blocker" value={log.wed_content.the_blocker} />
                        <LogField label="Takeaway" value={log.wed_content.the_takeaway} />
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-neutral-400 italic">No Wednesday check-in submitted.</p>
                  )}

                  {/* Saturday */}
                  {log.sat_content ? (
                    <div>
                      <h3 className="text-sm font-bold text-violet-700 mb-3">Saturday Check-in</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <LogField label="Focus Area" value={log.sat_content.focus_area} />
                        <LogField label="Core Action" value={log.sat_content.core_action} />
                        <LogField label="Blocker" value={log.sat_content.the_blocker} />
                        <LogField label="Takeaway" value={log.sat_content.the_takeaway} />
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-neutral-400 italic">No Saturday check-in submitted.</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Sticky Endorse / Flag Footer */}
      {!isLocked && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 p-4 md:px-8 shadow-lg z-10">
          {error && <p className="text-xs text-danger-dark mb-2">{error}</p>}

          {action === 'flag' && (
            <div className="mb-3">
              <textarea
                value={flagComment}
                onChange={(e) => setFlagComment(e.target.value)}
                maxLength={300}
                placeholder="Describe the concern (required)..."
                rows={2}
                className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-danger-base resize-none"
              />
              <div className="flex justify-end text-xs text-neutral-400">{flagComment.length}/300</div>
            </div>
          )}

          <div className="flex gap-3 max-w-3xl mx-auto">
            {action !== 'flag' && (
              <button
                onClick={() => handleSubmit('endorse')}
                disabled={submitting}
                className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-colors"
              >
                ✅ Endorse Month
              </button>
            )}
            {action !== 'endorse' && (
              <button
                onClick={() => action === 'flag' ? handleSubmit('flag') : setAction('flag')}
                disabled={submitting}
                className="flex-1 py-3 border-2 border-danger-base text-danger-dark hover:bg-danger-50 disabled:opacity-50 font-semibold rounded-xl text-sm transition-colors"
              >
                🚩 {action === 'flag' ? (submitting ? 'Submitting...' : 'Confirm Flag') : 'Flag Concern'}
              </button>
            )}
            {action === 'flag' && (
              <button
                onClick={() => { setAction('none'); setFlagComment(''); setError(null); }}
                className="px-5 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-semibold rounded-xl text-sm transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

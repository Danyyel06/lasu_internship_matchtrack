import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/axios';

interface PendingReview {
  student_id: number;
  student_name: string;
  department: string;
  application_id: number;
  month_year: string;
  log_submission_count: number;
  status: 'pending' | 'endorsed' | 'flagged';
}

export default function MonthlyReviewList() {
  const [reviews, setReviews] = useState<PendingReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await api.get('/monthly-review/pending');
        setReviews(res.data);
      } catch {
        console.error('Failed to load pending reviews');
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'endorsed': return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-success-50 text-success-dark">✅ Endorsed</span>;
      case 'flagged': return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-danger-50 text-danger-dark">🚩 Flagged</span>;
      default: return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">⏳ Pending</span>;
    }
  };

  if (loading) return <div className="p-6 text-neutral-500">Loading monthly reviews...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Monthly Review</h1>
        <p className="text-neutral-500 mt-1">Review and endorse or flag each intern's monthly progress digest.</p>
      </div>

      {reviews.length === 0 ? (
        <div className="bg-white rounded-xl border border-neutral-200 p-10 text-center">
          <div className="text-4xl mb-4">📋</div>
          <p className="text-neutral-600 font-medium">No pending monthly reviews.</p>
          <p className="text-neutral-400 text-sm mt-1">You're all caught up! Reviews appear at the start of each month.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={`${r.student_id}-${r.month_year}`} className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg border border-neutral-200">
                    {r.student_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-900">{r.student_name}</h3>
                    <p className="text-sm text-neutral-500">{r.department}</p>
                    <p className="text-xs text-neutral-400 mt-0.5">Period: {r.month_year}</p>
                  </div>
                </div>

                <div className="flex flex-col sm:items-end gap-2">
                  {getStatusBadge(r.status)}
                  <span className="text-xs font-medium text-neutral-500">
                    {r.log_submission_count} log{r.log_submission_count !== 1 ? 's' : ''} submitted
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-neutral-100 flex justify-end">
                <Link
                  to={`/supervisor/monthly-review/${r.student_id}/${r.month_year}`}
                  className={`inline-flex items-center px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    r.status === 'pending'
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                  }`}
                >
                  {r.status === 'pending' ? 'Review Digest →' : 'View Digest →'}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function SupervisorDashboard() {
  const [interns, setInterns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInterns = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const res = await axios.get('http://localhost:8000/api/v1/supervisors/interns/growth', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setInterns(res.data);
      } catch (err) {
        console.error("Failed to fetch interns", err);
      } finally {
        setLoading(false);
      }
    };
    fetchInterns();
  }, []);

  const overdueCount = interns.filter(i => i.consecutive_missed >= 2).length;

  if (loading) return <div className="p-6">Loading dashboard...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">Dashboard</h1>
        <div className="text-sm text-neutral-500">
          Current Cycle: <span className="font-medium text-neutral-900">2026 Summer</span>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-sm">
          <p className="text-xs font-bold tracking-wider text-neutral-500 uppercase mb-1">Assigned Interns</p>
          <p className="text-3xl font-bold text-neutral-900">{interns.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-sm">
          <p className="text-xs font-bold tracking-wider text-neutral-500 uppercase mb-1">Pending Monthly Reviews</p>
          <p className="text-3xl font-bold text-amber-600">{interns.length}</p>
          <Link to="/supervisor/monthly-review" className="text-xs text-blue-600 hover:underline font-medium mt-1 inline-block">Review now →</Link>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-sm">
          <p className="text-xs font-bold tracking-wider text-neutral-500 uppercase mb-1">Overdue Log Submissions</p>
          <p className={`text-3xl font-bold ${overdueCount > 0 ? 'text-danger-dark' : 'text-neutral-900'}`}>{overdueCount}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">Interns Under Your Supervision</h2>
          <Link to="/supervisor/monthly-review" className="text-sm font-semibold text-blue-600 hover:underline">Monthly Review →</Link>
        </div>
        
        <div className="divide-y divide-neutral-200">
          {interns.length === 0 ? (
            <div className="p-6 text-neutral-500 text-center">No interns assigned to you yet.</div>
          ) : (
            interns.map((intern) => (
              <div 
                key={intern.id} 
                className={`p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors hover:bg-neutral-50 ${
                  intern.consecutive_missed >= 2 ? 'bg-red-50/50 border-l-4 border-l-danger-base' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg border border-neutral-200">
                    {intern.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
                      {intern.name}
                      {intern.consecutive_missed >= 2 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-danger-100 text-danger-dark">
                          OVERDUE LOG
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-neutral-600">{intern.role}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-6 text-sm">
                  <div>
                    <span className="text-neutral-500 block text-xs mb-1">Current Week</span>
                    <span className="font-medium text-neutral-900">Week {intern.current_week}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-xs mb-1">Log Status</span>
                    <span className={`font-medium ${
                      intern.pulse_status === 'submitted' ? 'text-success-dark' :
                      intern.pulse_status === 'late' ? 'text-warning-dark' : 'text-danger-dark'
                    }`}>
                      {intern.pulse_status === 'submitted' ? 'Submitted' : intern.pulse_status === 'late' ? 'Overdue' : 'Missing'}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-xs mb-1">Last Activity</span>
                    <span className="font-medium text-neutral-900">{intern.last_activity}</span>
                  </div>
                  <Link
                    to={`/supervisor/interns/${intern.id}`}
                    className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg transition-colors bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    View Profile
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

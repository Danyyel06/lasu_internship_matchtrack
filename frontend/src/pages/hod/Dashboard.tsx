import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function HodDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>({
    total_students: 0,
    placed_students: 0,
    total_supervisors: 0,
    active_alerts: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const res = await axios.get('/api/v1/hod/dashboard-stats', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(res.data);
      } catch (err: any) {
        console.error("Failed to fetch dashboard stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Department Overview</h1>
          <p className="text-neutral-500">Monitor placements, assignments, and alerts for your department.</p>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-neutral-500">Loading dashboard...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <span className="text-lg">🎓</span>
              </div>
              <p className="text-sm font-medium text-neutral-500 mb-1">Total Students</p>
              <h2 className="text-3xl font-bold text-neutral-900">{stats.total_students}</h2>
            </div>
            
            <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center mb-4">
                <span className="text-lg">✅</span>
              </div>
              <p className="text-sm font-medium text-neutral-500 mb-1">Placed Students</p>
              <div className="flex items-end gap-2">
                <h2 className="text-3xl font-bold text-neutral-900">{stats.placed_students}</h2>
                <span className="text-sm font-medium text-green-600 mb-1">{stats.total_students > 0 ? Math.round((stats.placed_students/stats.total_students)*100) : 0}%</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
                <span className="text-lg">👨‍🏫</span>
              </div>
              <p className="text-sm font-medium text-neutral-500 mb-1">Academic Supervisors</p>
              <h2 className="text-3xl font-bold text-neutral-900">{stats.total_supervisors}</h2>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-red-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-red-50 rounded-bl-full -mr-4 -mt-4"></div>
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4 relative z-10">
                <span className="text-lg">⚠️</span>
              </div>
              <p className="text-sm font-medium text-neutral-500 mb-1 relative z-10">Active Alerts</p>
              <h2 className="text-3xl font-bold text-red-600 relative z-10">{stats.active_alerts}</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-neutral-900">Recent Alerts</h3>
                <button 
                  onClick={() => navigate('/hod/alerts')}
                  className="text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                  View All
                </button>
              </div>
              {stats.active_alerts === 0 ? (
                <div className="text-center py-8 text-neutral-500 text-sm">
                  No active alerts requiring attention.
                </div>
              ) : (
                <div className="text-center py-8 text-neutral-500 text-sm">
                  There are active alerts that require review.
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-neutral-900">Quick Actions</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => navigate('/hod/students')}
                  className="p-4 border border-neutral-200 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-neutral-50 transition-colors"
                >
                  <span className="text-2xl">👨‍🎓</span>
                  <span className="text-sm font-medium text-neutral-700">Assign Supervisors</span>
                </button>
                <button 
                  onClick={() => navigate('/hod/reports')}
                  className="p-4 border border-neutral-200 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-neutral-50 transition-colors"
                >
                  <span className="text-2xl">📊</span>
                  <span className="text-sm font-medium text-neutral-700">View Reports</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

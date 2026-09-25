import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<any>(null);
  const [activityData, setActivityData] = useState<any[]>([]);
  const [pendingVerifications, setPendingVerifications] = useState<any[]>([]);
  const [period, setPeriod] = useState<number>(30);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const headers = { Authorization: `Bearer ${token}` };
        
        const [metricsRes, activityRes, companiesRes, hodsRes, auditRes] = await Promise.all([
          axios.get('/api/v1/admin/metrics', { headers }),
          axios.get(`/api/v1/admin/activity-chart?days=${period}`, { headers }),
          axios.get('/api/v1/admin/pending-companies', { headers }),
          axios.get('/api/v1/admin/pending-hods', { headers }),
          axios.get('/api/v1/admin/audit-logs?limit=5', { headers })
        ]);

        setMetrics(metricsRes.data);
        setActivityData(activityRes.data);
        
        const combinedPending = [
          ...companiesRes.data.map((c: any) => ({ ...c, accountType: 'Company' })),
          ...hodsRes.data.map((h: any) => ({ ...h, accountType: 'HOD' }))
        ].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
        
        setPendingVerifications(combinedPending.slice(0, 5)); // Show top 5
        setAuditLogs(auditRes.data);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      }
    };
    fetchDashboardData();
  }, [period]);

  const metricCards = metrics ? [
    { title: "Total Students", value: metrics.totalStudents, icon: "🎓", color: "bg-blue-100 text-blue-700" },
    { title: "Verified Companies", value: metrics.totalCompanies, icon: "🏢", color: "bg-green-100 text-green-700" },
    { title: "Verified HODs", value: metrics.totalHODs, icon: "🏛️", color: "bg-purple-100 text-purple-700" },
    { title: "Active Placements", value: metrics.activePlacements, icon: "🤝", color: "bg-amber-100 text-amber-700" },
    { title: "Unplaced Students", value: metrics.studentsWithoutPlacement, icon: "⏳", color: "bg-red-100 text-red-700" },
    { title: "Equity Compliance", value: `${metrics.equityComplianceRate}%`, icon: "⚖️", color: "bg-teal-100 text-teal-700" },
  ] : [];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">Platform Overview</h1>
          <p className="text-neutral-500 text-xs sm:text-sm mt-1">Real-time metrics and system activity</p>
        </div>
        <div className="text-xs sm:text-sm font-medium text-neutral-500 bg-white px-3 sm:px-4 py-2 rounded-lg border border-neutral-200 shadow-sm self-start sm:self-auto">
          Status: <span className="text-green-600 font-semibold">All Systems Operational</span>
        </div>
      </div>

      {/* 6 Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {metricCards.map((card, idx) => (
          <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-neutral-200 hover:border-blue-300 transition-colors">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl mb-3 ${card.color}`}>
              {card.icon}
            </div>
            <p className="text-xs font-medium text-neutral-500">{card.title}</p>
            <p className="text-2xl font-bold text-neutral-900 mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart (Spans 2 columns) */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-neutral-200 p-5">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-neutral-900">Platform Activity ({period} Days)</h2>
            <select 
              value={period}
              onChange={(e) => setPeriod(Number(e.target.value))}
              className="text-sm border-neutral-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={30}>Last 30 Days</option>
              <option value={90}>Last 90 Days</option>
            </select>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activityData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                <XAxis dataKey="date" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                <YAxis tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Legend iconType="circle" wrapperStyle={{fontSize: '12px', paddingTop: '20px'}} />
                <Line type="monotone" dataKey="New Registrations" stroke="#3b82f6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="New Internship Postings" stroke="#10b981" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="New Placements" stroke="#f59e0b" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Active Pulse Submissions" stroke="#8b5cf6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sidebar panels */}
        <div className="space-y-6">
          {/* Pending Verifications */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-bold text-neutral-900">Pending Verifications</h2>
              <span className="bg-neutral-100 text-neutral-700 text-xs font-bold px-2 py-1 rounded-full">{pendingVerifications.length}</span>
            </div>
            <div className="space-y-3">
              {pendingVerifications.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center p-3 hover:bg-neutral-50 rounded-lg border border-transparent hover:border-neutral-200 transition-colors cursor-pointer" onClick={() => navigate('/super-admin/verify')}>
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{item.name}</p>
                    <p className="text-xs text-neutral-500">{item.accountType}</p>
                  </div>
                  <span className="text-xs text-neutral-400">{item.submittedAt}</span>
                </div>
              ))}
              {pendingVerifications.length === 0 && (
                <div className="text-sm text-neutral-500 text-center py-4">No pending verifications.</div>
              )}
            </div>
            <button 
              className="w-full mt-4 text-sm text-blue-600 font-medium hover:text-blue-700 py-2"
              onClick={() => navigate('/super-admin/verify')}
            >
              Review All Requests →
            </button>
          </div>

          {/* Recent Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-5">
            <h2 className="text-sm font-bold text-neutral-900 mb-4">Recent Actions</h2>
            <div className="relative border-l-2 border-neutral-100 ml-3 space-y-6">
              {auditLogs.map((log: any, idx: number) => (
                <div key={idx} className="pl-4 relative">
                  <div className={`absolute -left-[5px] top-1 w-2 h-2 rounded-full ${log.color} ring-4 ring-white`}></div>
                  <p className="text-sm font-medium text-neutral-900">{log.action}</p>
                  <p className="text-xs text-neutral-500">By {log.user} • {log.time}</p>
                </div>
              ))}
              {auditLogs.length === 0 && (
                <div className="text-sm text-neutral-500 py-4 pl-4">No recent actions.</div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-5">
            <h2 className="text-sm font-bold text-neutral-900 mb-4">Quick Actions</h2>
            <div className="space-y-4">
              <div className="border border-neutral-200 rounded-lg p-4">
                <h3 className="text-xs font-semibold text-neutral-900 mb-2">Override Application Supervisors</h3>
                <form 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.target as HTMLFormElement;
                    const appId = (form.elements.namedItem('appId') as HTMLInputElement).value;
                    const indId = (form.elements.namedItem('indId') as HTMLInputElement).value;
                    const acaId = (form.elements.namedItem('acaId') as HTMLInputElement).value;
                    if (!appId) return;
                    
                    const payload: any = {};
                    if (indId) payload.industry_supervisor_id = parseInt(indId);
                    if (acaId) payload.academic_supervisor_id = parseInt(acaId);

                    try {
                      const token = localStorage.getItem('access_token');
                      await axios.put(`/api/v1/admin/applications/${appId}/supervisors`, payload, {
                        headers: { Authorization: `Bearer ${token}` }
                      });
                      alert('Supervisors updated successfully');
                      form.reset();
                    } catch (err) {
                      alert('Failed to update supervisors');
                    }
                  }}
                  className="space-y-3"
                >
                  <input name="appId" type="number" placeholder="Application ID" required className="w-full text-sm border border-neutral-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500" />
                  <input name="indId" type="number" placeholder="Industry Supervisor ID (Optional)" className="w-full text-sm border border-neutral-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500" />
                  <input name="acaId" type="number" placeholder="Academic Supervisor ID (Optional)" className="w-full text-sm border border-neutral-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500" />
                  <button type="submit" className="w-full bg-blue-600 text-white text-sm font-medium py-2 rounded-md hover:bg-blue-700 transition-colors">
                    Update Supervisors
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

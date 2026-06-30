import { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function SuperAdminDashboard() {
  const [metrics, setMetrics] = useState<any>(null);
  const [activityData, setActivityData] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const headers = { Authorization: `Bearer ${token}` };
        
        const [metricsRes, activityRes] = await Promise.all([
          axios.get('http://localhost:8000/api/v1/admin/metrics', { headers }),
          axios.get('http://localhost:8000/api/v1/admin/activity-chart', { headers })
        ]);

        setMetrics(metricsRes.data);
        setActivityData(activityRes.data);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      }
    };
    fetchDashboardData();
  }, []);

  const metricCards = metrics ? [
    { title: "Total Students", value: metrics.totalStudents, icon: "🎓", color: "bg-blue-100 text-blue-700" },
    { title: "Verified Companies", value: metrics.totalCompanies, icon: "🏢", color: "bg-green-100 text-green-700" },
    { title: "Verified HODs", value: metrics.totalHODs, icon: "🏛️", color: "bg-purple-100 text-purple-700" },
    { title: "Active Placements", value: metrics.activePlacements, icon: "🤝", color: "bg-amber-100 text-amber-700" },
    { title: "Unplaced Students", value: metrics.studentsWithoutPlacement, icon: "⏳", color: "bg-red-100 text-red-700" },
    { title: "Equity Compliance", value: `${metrics.equityComplianceRate}%`, icon: "⚖️", color: "bg-teal-100 text-teal-700" },
  ] : [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Platform Overview</h1>
          <p className="text-neutral-500 text-sm mt-1">Real-time metrics and system activity</p>
        </div>
        <div className="text-sm font-medium text-neutral-500 bg-white px-4 py-2 rounded-lg border border-neutral-200 shadow-sm">
          Status: <span className="text-green-600">All Systems Operational</span>
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
            <h2 className="text-lg font-bold text-neutral-900">Platform Activity (30 Days)</h2>
            <select className="text-sm border-neutral-300 rounded-lg focus:ring-blue-500 focus:border-blue-500">
              <option>Last 30 Days</option>
              <option>Last 90 Days</option>
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
              <span className="bg-neutral-100 text-neutral-700 text-xs font-bold px-2 py-1 rounded-full">0</span>
            </div>
            <div className="space-y-3">
              {[].map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center p-3 hover:bg-neutral-50 rounded-lg border border-transparent hover:border-neutral-200 transition-colors cursor-pointer">
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{item.name}</p>
                    <p className="text-xs text-neutral-500">{item.type}</p>
                  </div>
                  <span className="text-xs text-neutral-400">{item.time}</span>
                </div>
              ))}
              <div className="text-sm text-neutral-500 text-center py-4">No pending verifications.</div>
            </div>
            <button className="w-full mt-4 text-sm text-blue-600 font-medium hover:text-blue-700 py-2">
              Review All Requests →
            </button>
          </div>

          {/* Recent Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-5">
            <h2 className="text-sm font-bold text-neutral-900 mb-4">Recent Actions</h2>
            <div className="relative border-l-2 border-neutral-100 ml-3 space-y-6">
              {[].map((log: any, idx: number) => (
                <div key={idx} className="pl-4 relative">
                  <div className={`absolute -left-[5px] top-1 w-2 h-2 rounded-full ${log.color} ring-4 ring-white`}></div>
                  <p className="text-sm font-medium text-neutral-900">{log.action}</p>
                  <p className="text-xs text-neutral-500">By {log.user} • {log.time}</p>
                </div>
              ))}
              <div className="text-sm text-neutral-500 py-4 pl-4">No recent actions.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

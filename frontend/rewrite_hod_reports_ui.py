import os

filepath = "c:/Users/User/lasu-internship-platform/frontend/src/pages/hod/Reports.tsx"

new_content = """import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import axios from 'axios';

export default function HODReports() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const res = await axios.get('http://localhost:8000/api/v1/hod/reports/placement-stats', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(res.data);
      } catch (err) {
        console.error("Failed to fetch reports stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6'];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Department Reports</h1>
          <p className="text-neutral-500 mt-1">Analytics and placement statistics for your department.</p>
        </div>
        <button className="text-sm font-medium text-neutral-600 hover:text-neutral-900 py-2 px-4 rounded-lg border border-neutral-300 hover:bg-neutral-50 transition-colors flex items-center gap-2">
          <span>↓</span> Download CSV
        </button>
      </div>

      {loading ? (
         <div className="p-12 text-center text-neutral-500">Loading reports...</div>
      ) : !stats ? (
         <div className="p-12 text-center text-neutral-500">Failed to load reports.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
            <h3 className="font-bold text-neutral-900 mb-6">Placement by Industry</h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.placementByIndustry}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats.placementByIndustry.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
            <h3 className="font-bold text-neutral-900 mb-6">Placement Status by Level</h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.placementByLevel} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280'}} />
                  <Tooltip 
                    cursor={{fill: '#F3F4F6'}}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend />
                  <Bar dataKey="placed" name="Placed" stackId="a" fill="#10B981" radius={[0, 0, 4, 4]} />
                  <Bar dataKey="unplaced" name="Unplaced" stackId="a" fill="#FCA5A5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
"""

with open(filepath, "w", encoding="utf-8") as f:
    f.write(new_content)

print("Rewritten Reports.tsx")

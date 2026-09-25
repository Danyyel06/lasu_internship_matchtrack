import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';

export default function CompanyReports() {
  const [cycleFilter, setCycleFilter] = useState('All Cycles');
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<any>(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const res = await axios.get('/api/v1/companies/reports', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setReportData(res.data);
      } catch (err) {
        console.error("Failed to fetch reports", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  if (loading) {
    return <div className="p-12 text-center text-neutral-500">Loading reports...</div>;
  }
  
  if (!reportData) {
    return <div className="p-12 text-center text-red-500">Failed to load reports.</div>;
  }

  const { metrics, fps_trend, reports } = reportData;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Performance Reports</h1>
          <p className="text-neutral-500 mt-1">Track your reputation metrics and download historical performance data.</p>
        </div>
        <div className="flex gap-3">
          <select 
            value={cycleFilter}
            onChange={(e) => setCycleFilter(e.target.value)}
            className="p-2 border border-neutral-300 rounded-lg outline-none bg-white text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option>All Cycles</option>
            <option>2025/2026 (Current)</option>
            <option>2024/2025</option>
            <option>2023/2024</option>
          </select>
        </div>
      </div>

      {/* 1. Reputation Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-wider mb-1">Fair Participation Score</h3>
          <div className="text-4xl font-black text-slate-900 mb-2">{metrics.fps}<span className="text-lg text-neutral-400">/100</span></div>
          <p className="text-xs text-neutral-500 max-w-[200px] leading-relaxed">Based on your Equity Track participation and past cycle engagement.</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>
          </div>
          <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-wider mb-1">Intern Satisfaction</h3>
          <div className="text-4xl font-black text-slate-900 mb-2">{metrics.intern_satisfaction}<span className="text-lg text-neutral-400">/5.0</span></div>
          <p className="text-xs text-neutral-500 max-w-[200px] leading-relaxed">Aggregated from post-internship surveys submitted by your interns.</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
          </div>
          <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-wider mb-1">Full-Time Offer Rate</h3>
          <div className="text-4xl font-black text-slate-900 mb-2">{metrics.offer_rate}<span className="text-lg text-neutral-400">%</span></div>
          <p className="text-xs text-neutral-500 max-w-[200px] leading-relaxed">Percentage of interns offered a full-time role post-graduation.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 3. Line Chart */}
        <div className="lg:col-span-2 bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-6">Fair Participation Score Trend</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={fps_trend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <Line type="monotone" dataKey="fps" stroke="#2563eb" strokeWidth={3} dot={{ r: 6, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
                <CartesianGrid stroke="#f5f5f5" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="cycle" axisLine={false} tickLine={false} tick={{ fill: '#737373', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#737373', fontSize: 12 }} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Downloadable Reports */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm flex flex-col">
          <h3 className="font-bold text-slate-900 mb-1">End-of-Cycle Reports</h3>
          <p className="text-sm text-neutral-500 mb-6">Download your official cycle summaries for HR compliance.</p>
          
          <div className="space-y-4 flex-1">
            {reports.map((report: any) => (
              <div key={report.id} className="p-4 border border-neutral-200 rounded-xl flex items-center justify-between group hover:border-blue-300 hover:bg-blue-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    report.theme === 'red' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                  }`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={report.icon} />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{report.title}</h4>
                    <p className="text-xs text-neutral-500">{report.type} • {report.size}</p>
                  </div>
                </div>
                <button className="text-blue-600 hover:text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

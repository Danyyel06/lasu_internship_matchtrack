import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

const mockChartData = [
  { period: 'Week 1–2', submitted: 2, missed: 0 },
  { period: 'Week 3–4', submitted: 2, missed: 0 },
  { period: 'Week 5–6', submitted: 1, missed: 1 },
  { period: 'Week 7–8', submitted: 2, missed: 0 },
  { period: 'Week 9–10', submitted: 2, missed: 0 },
];

export default function GrowthDashboard() {
  const [quizScores] = useState([
    { period: 'Week 1–2', score: 4, passed: true },
    { period: 'Week 3–4', score: 5, passed: true },
    { period: 'Week 5–6', score: 2, passed: false },
    { period: 'Week 7–8', score: 4, passed: true },
  ]);

  const totalSubmitted = mockChartData.reduce((acc, d) => acc + d.submitted, 0);
  const totalMissed = mockChartData.reduce((acc, d) => acc + d.missed, 0);
  const avgQuizScore = quizScores.length
    ? (quizScores.reduce((acc, q) => acc + q.score, 0) / quizScores.length).toFixed(1)
    : '—';

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Growth Dashboard</h1>
        <p className="text-neutral-600 mt-1">Visualize your evidence log submissions and AI quiz performance.</p>
      </div>

      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-xl">
            📋
          </div>
          <div>
            <div className="text-sm text-neutral-500 font-medium">Logs Submitted</div>
            <div className="text-2xl font-bold text-neutral-900">{totalSubmitted} <span className="text-lg text-neutral-400">/ {totalSubmitted + totalMissed}</span></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-success-50 text-success-dark rounded-full flex items-center justify-center text-xl">
            🧠
          </div>
          <div>
            <div className="text-sm text-neutral-500 font-medium">Avg AI Quiz Score</div>
            <div className="text-2xl font-bold text-neutral-900">{avgQuizScore} <span className="text-lg text-neutral-400">/ 5</span></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-violet-50 text-violet-600 rounded-full flex items-center justify-center text-xl">
            ✅
          </div>
          <div>
            <div className="text-sm text-neutral-500 font-medium">Quizzes Passed</div>
            <div className="text-2xl font-bold text-neutral-900">{quizScores.filter(q => q.passed).length} <span className="text-lg text-neutral-400">/ {quizScores.length}</span></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Log Submission Chart */}
        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-900 mb-6">Log Submissions Over Time</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fill: '#737373', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#737373', fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: '#f5f5f5' }}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e5e5', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="submitted" name="Submitted" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="missed" name="Missed" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Quiz History */}
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm flex flex-col">
          <div className="p-6 border-b border-neutral-200 shrink-0">
            <h2 className="text-lg font-semibold text-neutral-900">AI Quiz History</h2>
            <p className="text-sm text-neutral-500 mt-1">Results from your post-log AI knowledge quizzes.</p>
          </div>
          
          <div className="p-6 overflow-y-auto flex-1 space-y-3">
            {quizScores.map((q, i) => (
              <div key={i} className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-neutral-900">{q.period}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">Score: {q.score} / 5</p>
                </div>
                {q.passed
                  ? <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-success-50 text-success-dark">✅ Passed</span>
                  : <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-danger-50 text-danger-dark">❌ Failed</span>
                }
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

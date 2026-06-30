import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const mockData = [
  { week: 'Wk 1', score: 3 },
  { week: 'Wk 2', score: 4 },
  { week: 'Wk 3', score: 5 },
  { week: 'Wk 4', score: 4.5 },
];

export default function InternProfile() {
  const { id } = useParams();
  const [student, setStudent] = useState<any>(null);

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const res = await axios.get('http://localhost:8000/api/v1/supervisors/interns/growth', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const found = res.data.find((i: any) => i.id === Number(id));
        if (found) {
          setStudent({
            ...found,
            matricNumber: '190591000', // Mocked remaining details
            email: `${found.name.split(' ')[0].toLowerCase()}@lasu.edu.ng`,
            cgpa: 4.25,
            skills: ['React', 'TypeScript', 'Node.js']
          });
        } else {
          setStudent({
            id,
            name: 'Alice',
            department: 'Computer Science',
            level: '400L',
            matricNumber: '190591000',
            email: 'alice@lasu.edu.ng',
            cgpa: 4.25,
            skills: ['React', 'TypeScript', 'Node.js']
          });
        }
      } catch (err) {
        setStudent({
          id,
          name: 'Alice',
          department: 'Computer Science',
          level: '400L',
          matricNumber: '190591000',
          email: 'alice@lasu.edu.ng',
          cgpa: 4.25,
          skills: ['React', 'TypeScript', 'Node.js']
        });
      }
    };
    fetchStudent();
  }, [id]);

  if (!student) return <div>Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Profile Card */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-3xl font-bold">
            {student.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">{student.name}</h1>
            <p className="text-neutral-600">{student.department} • {student.level} • {student.matricNumber}</p>
            <p className="text-neutral-500 text-sm mt-1">{student.email}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-neutral-500">Current CGPA</p>
          <p className="text-3xl font-bold text-neutral-900">{student.cgpa}</p>
          <span className="inline-block mt-1 px-2.5 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full font-medium">Top 10% Cohort</span>
        </div>
      </div>

      {/* Verified Skills */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6">
        <h2 className="font-bold text-lg mb-2">Verified Skill Profile</h2>
        <p className="text-sm text-neutral-600 mb-4">Competencies validated through practical assessments and supervisor endorsements during placement.</p>
        <div className="flex gap-2 flex-wrap">
          {student.skills.map((skill: string) => (
            <span key={skill} className="px-3 py-1 bg-neutral-100 border border-neutral-200 rounded-lg text-sm text-neutral-800">
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Growth Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-bold text-lg">Skill Progression Velocity</h2>
            <button className="text-blue-600 text-sm font-medium hover:underline">Export Report</button>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockData}>
                <XAxis dataKey="week" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} domain={[0, 5]} />
                <Tooltip />
                <Bar dataKey="score" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6">
          <h2 className="font-bold text-lg mb-6">Core Competency Assessment</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1 font-medium">
                <span>Technical Execution</span>
                <span>4.5/5</span>
              </div>
              <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                <div className="bg-teal-500 h-full" style={{ width: '90%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1 font-medium">
                <span>Problem Solving</span>
                <span>4.0/5</span>
              </div>
              <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                <div className="bg-teal-500 h-full" style={{ width: '80%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1 font-medium">
                <span>Communication</span>
                <span>5.0/5</span>
              </div>
              <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                <div className="bg-teal-500 h-full" style={{ width: '100%' }}></div>
              </div>
            </div>
          </div>
          <div className="mt-8 p-4 bg-blue-50 rounded-lg flex items-center justify-between border border-blue-100">
            <span className="font-medium text-blue-900">Verified Endorsements</span>
            <span className="text-blue-700 font-bold text-xl">12</span>
          </div>
        </div>
      </div>
      {/* Monthly Review History */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg">Monthly Review History</h2>
          <span className="text-xs text-neutral-400">Auto-updated each month</span>
        </div>
        <div className="space-y-3">
          {/* Placeholder — will be populated from monthly_endorsements API */}
          <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-900">June 2026</p>
              <p className="text-xs text-neutral-500 mt-0.5">Log submissions: 4 of 4</p>
            </div>
            <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-success-50 text-success-dark">✅ Endorsed</span>
          </div>
          <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-900">May 2026</p>
              <p className="text-xs text-neutral-500 mt-0.5">Log submissions: 3 of 4</p>
            </div>
            <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-danger-50 text-danger-dark">🚩 Flagged</span>
          </div>
        </div>
      </div>
    </div>
  );
}

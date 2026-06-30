import os

filepath = "c:/Users/User/lasu-internship-platform/frontend/src/pages/academic-supervisor/PulseDetail.tsx"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

new_content = """import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

export default function AcademicSupervisorPulseDetail() {
  const navigate = useNavigate();
  const { id, weekId } = useParams();
  
  const [pulse, setPulse] = useState<any>(null);
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const headers = { Authorization: `Bearer ${token}` };

        const stuRes = await axios.get('http://localhost:8000/api/v1/academic-supervisors/students', { headers });
        const foundStudent = stuRes.data.find((s: any) => s.id === parseInt(id || '0'));
        setStudent(foundStudent);

        const histRes = await axios.get(`http://localhost:8000/api/v1/pulse/history?student_id=${id}`, { headers });
        if (histRes.data && histRes.data.length > 0) {
          // Just taking the latest pulse for simplicity
          setPulse(histRes.data[0]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <div className="p-6">Loading pulse details...</div>;
  if (!student || !pulse) return <div className="p-6">No pulse data found for this student.</div>;

  const hitCount = (pulse.micro_goals || []).filter((g: any) => g.hit).length;
  const totalGoals = (pulse.micro_goals || []).length || 1;
  const completionPercent = Math.round((hitCount / totalGoals) * 100);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/academic-supervisor/pulse')}
            className="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center text-neutral-500 hover:bg-neutral-50 transition-colors"
          >
            ←
          </button>
          <h1 className="text-xl font-bold text-neutral-900">Weekly Pulse Detail</h1>
        </div>
      </div>

      {/* Identity Card */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-200 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg">
          {student.name.charAt(0)}
        </div>
        <div>
          <h2 className="font-bold text-neutral-900 text-lg">{student.name}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-bold bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full">Week {pulse.week_number}</span>
            <span className="text-sm text-neutral-500">• {student.company}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Completion Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-500 mb-1">Weekly Targets</p>
            <p className="text-2xl font-bold text-neutral-900">{hitCount}/{totalGoals} Goals Met</p>
          </div>
          <div className="relative w-20 h-20 flex items-center justify-center rounded-full bg-teal-50 border-4 border-teal-500">
            <span className="font-bold text-teal-700">{completionPercent}%</span>
          </div>
        </div>
      </div>

      {/* Goals Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-neutral-900">Weekly Goals</h2>
        </div>
        
        <div className="space-y-4">
          {(pulse.micro_goals || []).map((goal: any, index: number) => (
             <div key={index} className={`flex items-start gap-3 p-4 rounded-xl border ${goal.hit ? 'border-green-100 bg-green-50/30' : 'border-red-100 bg-red-50/30'}`}>
               <div className={goal.hit ? 'text-green-600 mt-0.5' : 'text-red-600 mt-0.5'}>{goal.hit ? '✔' : '❌'}</div>
               <div>
                 <p className="font-bold text-neutral-900">{goal.goal_text}</p>
                 <p className="text-xs text-neutral-500 mt-1">Skill: {goal.skill_name}</p>
               </div>
             </div>
          ))}
        </div>
      </div>

      {/* Student Reflection Card */}
      {pulse.reflection && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Student Reflection</h2>
          <div className="bg-neutral-50 rounded-xl p-5 border border-neutral-100 relative">
            <span className="text-4xl text-neutral-300 absolute top-4 left-4 font-serif">"</span>
            <p className="text-neutral-700 relative z-10 pl-8 text-sm leading-relaxed">
              {pulse.reflection}
            </p>
          </div>
        </div>
      )}

      {/* Industry Feedback Section */}
      {(pulse.supervisor_endorsements && pulse.supervisor_endorsements.length > 0) && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-900 mb-6">Industry Supervisor Feedback</h2>
          
          <div className="space-y-6">
             {pulse.supervisor_endorsements.map((e: any, index: number) => (
                <div key={index} className="bg-neutral-50 rounded-xl p-5 border border-neutral-100 relative mb-6">
                  <div className="flex items-center gap-2 mb-2">
                     <span className="text-xl">{e.is_endorsed ? '👍' : '🚩'}</span>
                     <span className={`font-semibold ${e.is_endorsed ? 'text-green-700' : 'text-red-700'}`}>
                       {e.is_endorsed ? 'Endorsed' : 'Flagged'}
                     </span>
                  </div>
                  {e.coaching_tip && (
                    <p className="text-neutral-700 text-sm leading-relaxed mt-2">
                      "{e.coaching_tip}"
                    </p>
                  )}
                  <p className="text-xs text-blue-600 mt-3 truncate">{e.evidence_url}</p>
                </div>
             ))}
          </div>
        </div>
      )}
    </div>
  );
}
"""

with open(filepath, "w", encoding="utf-8") as f:
    f.write(new_content)

print("Rewritten Academic Supervisor PulseDetail.tsx")

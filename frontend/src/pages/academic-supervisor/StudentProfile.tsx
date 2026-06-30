import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function AcadSupStudentProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [studentInfo, setStudentInfo] = useState<any>(null);
  
  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const res = await axios.get('http://localhost:8000/api/v1/academic-supervisors/students', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const student = res.data.find((s: any) => s.id === Number(id));
        if (student) setStudentInfo(student);
      } catch (err) {
        console.error(err);
      }
    };
    fetchStudent();
  }, [id]);

  if (!studentInfo) return <div className="p-8">Loading student profile...</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <button
          onClick={() => navigate('/academic-supervisor/home')}
          className="text-sm text-neutral-500 hover:text-neutral-700 flex items-center gap-1 mb-4"
        >
          ← Back to Dashboard
        </button>
      </div>

      {/* Student Identity Card */}
      <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm flex items-center gap-6">
        <div className="w-20 h-20 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-3xl">
          {studentInfo.name.charAt(0)}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-neutral-900">{studentInfo.name}</h1>
          <p className="text-neutral-500">{studentInfo.company} · {studentInfo.role}</p>
        </div>
      </div>

      {/* Log Submission Status */}
      <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
        <h2 className="text-lg font-bold text-neutral-900 mb-4">Log Submission Status</h2>
        <div className="flex flex-wrap gap-3">
          {studentInfo.log_status === 'submitted'
            ? <span className="inline-flex px-3 py-1.5 rounded-full text-sm font-semibold bg-success-50 text-success-dark">✅ Current Period Submitted</span>
            : studentInfo.log_status === 'pending'
            ? <span className="inline-flex px-3 py-1.5 rounded-full text-sm font-semibold bg-amber-50 text-amber-700">⏳ Pending Submission</span>
            : <span className="inline-flex px-3 py-1.5 rounded-full text-sm font-semibold bg-danger-50 text-danger-dark">⚠️ Overdue — Log Missing</span>
          }
          {studentInfo.consecutiveMissing >= 2 && (
            <span className="inline-flex px-3 py-1.5 rounded-full text-sm font-semibold bg-danger-50 text-danger-dark">
              🚩 {studentInfo.consecutiveMissing} consecutive periods missed
            </span>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
        <h2 className="text-lg font-bold text-neutral-900 mb-4">Actions</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate('/academic-supervisor/log-wall')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors text-sm"
          >
            View in Log Wall
          </button>
          <button
            onClick={() => navigate(`/academic-supervisor/alerts/${id}/log`)}
            className="px-4 py-2 border border-neutral-300 hover:bg-neutral-50 text-neutral-700 font-medium rounded-lg transition-colors text-sm"
          >
            Log Contact
          </button>
        </div>
      </div>

      {/* Growth Notes */}
      <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
        <h2 className="text-lg font-bold text-neutral-900 mb-4">Growth Overview</h2>
        <p className="text-neutral-500 italic text-sm">Student log submission charts and quiz performance will appear here as data accumulates.</p>
      </div>
    </div>
  );
}

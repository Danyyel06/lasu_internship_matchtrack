import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../../lib/axios';

export default function InternProfile() {
  const { id } = useParams();
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const res = await api.get(`/supervisors/interns/${id}`);
        setStudent(res.data);
      } catch (err: any) {
        console.error('Failed to load intern profile', err);
        setError(err.response?.data?.detail || 'Failed to load intern profile.');
      } finally {
        setLoading(false);
      }
    };
    fetchStudent();
  }, [id]);

  if (loading) return <div className="p-6 text-neutral-500">Loading intern profile...</div>;
  if (error) return (
    <div className="p-6 text-center">
      <p className="text-red-600 font-medium">{error}</p>
      <Link to="/supervisor/interns" className="mt-4 inline-block text-sm text-blue-600 hover:underline">← Back to Interns</Link>
    </div>
  );
  if (!student) return null;

  const tierColor = student.current_tier === 'T1' ? 'bg-blue-50 text-blue-700'
    : student.current_tier === 'T2' ? 'bg-purple-50 text-purple-700'
    : student.current_tier === 'T3' ? 'bg-amber-50 text-amber-700'
    : 'bg-neutral-100 text-neutral-600';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back nav */}
      <Link to="/supervisor/interns" className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900 transition-colors">
        ← Back to Interns
      </Link>

      {/* Top Profile Card */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="w-20 h-20 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-3xl font-bold shrink-0">
            {student.name.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-neutral-900">{student.name}</h1>
              {student.current_tier && (
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${tierColor}`}>
                  {student.current_tier}
                </span>
              )}
            </div>
            <p className="text-neutral-600 mt-1">
              {student.department}
              {student.faculty ? ` · ${student.faculty}` : ''}
              {student.level !== '—' ? ` · ${student.level}` : ''}
            </p>
            <p className="text-neutral-500 text-sm mt-0.5">{student.email}</p>
            <p className="text-neutral-400 text-xs mt-1">Matric No: <span className="font-medium text-neutral-700">{student.matric_no}</span></p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">CGPA</p>
            <p className="text-3xl font-bold text-neutral-900">
              {student.cgpa !== null ? student.cgpa?.toFixed(2) : '—'}
            </p>
            <p className="text-xs text-neutral-500 mt-1">Role: <span className="font-medium text-neutral-700">{student.role}</span></p>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">Weekly Logs Submitted</p>
          <p className="text-2xl font-bold text-neutral-900">{student.log_count}</p>
          <p className="text-xs text-neutral-500">of {student.duration_weeks || 24} expected</p>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">Current Week</p>
          <p className="text-2xl font-bold text-neutral-900">Week {student.log_count + 1}</p>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-sm col-span-2 sm:col-span-1">
          <p className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">Progress</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 bg-neutral-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-blue-500 h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, (student.log_count / (student.duration_weeks || 24)) * 100)}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-neutral-600">{Math.round((student.log_count / (student.duration_weeks || 24)) * 100)}%</span>
          </div>
        </div>
      </div>

      {/* Skills */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6">
        <h2 className="font-bold text-lg mb-1">Skill Profile</h2>
        <p className="text-sm text-neutral-500 mb-4">Competencies declared and verified through the LASU skills assessment.</p>
        {student.skills.length === 0 ? (
          <p className="text-neutral-400 text-sm italic">No skills listed yet.</p>
        ) : (
          <div className="space-y-2">
            {student.skills.map((skill: any, i: number) => (
              <div key={i} className="flex items-center justify-between py-2.5 border-b border-neutral-100 last:border-0">
                <span className="text-sm font-medium text-neutral-800">{skill.skill_name}</span>
                <div className="flex items-center gap-2">
                  {skill.level_label && (
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                      skill.verified_level ? 'bg-green-50 text-green-700' : 'bg-neutral-100 text-neutral-600'
                    }`}>
                      {skill.verified_level ? '✓ Verified' : 'Claimed'}: {skill.level_label}
                    </span>
                  )}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                    skill.verification_status === 'verified' ? 'bg-green-50 text-green-600' :
                    skill.verification_status === 'failed' ? 'bg-red-50 text-red-600' :
                    'bg-neutral-100 text-neutral-500'
                  }`}>
                    {skill.verification_status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6">
        <h2 className="font-bold text-lg mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            to={`/supervisor/monthly-review`}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Monthly Review →
          </Link>
          <Link
            to={`/supervisor/interns`}
            className="px-4 py-2.5 border border-neutral-200 text-neutral-700 text-sm font-semibold rounded-lg hover:bg-neutral-50 transition-colors"
          >
            Back to All Interns
          </Link>
        </div>
      </div>
    </div>
  );
}

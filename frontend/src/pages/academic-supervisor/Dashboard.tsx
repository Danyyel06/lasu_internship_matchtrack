import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default function AcadSupDashboard() {
  const [students, setStudents] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const [studentRes, profileRes] = await Promise.all([
          axios.get('http://localhost:8000/api/v1/academic-supervisors/students', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('http://localhost:8000/api/v1/academic-supervisors/profile', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        setStudents(studentRes.data);
        setProfile(profileRes.data);
      } catch (err: any) {
        console.error("Failed to fetch dashboard data", err);
      }
    };
    fetchData();
  }, []);

  const submittedCount = students.filter(s => s.log_status === 'submitted').length;
  const overdueCount = students.filter(s => s.consecutiveMissing && s.consecutiveMissing >= 2).length;
  
  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Academic Supervisor Dashboard</h1>
        <p className="text-neutral-500">Welcome back, {profile ? `${profile.first_name} ${profile.last_name}` : 'Supervisor'}. Here is your students' progress overview.</p>
      </div>

      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 border border-neutral-200 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-500 mb-1">Total Assigned Students</p>
            <p className="text-3xl font-bold text-neutral-900">{students.length}</p>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-xl">👥</div>
        </div>
        <div className="bg-white p-6 border border-neutral-200 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-500 mb-1">Log Submissions (Current Period)</p>
            <p className="text-3xl font-bold text-neutral-900">
              <span className="text-success-dark">{submittedCount}</span>
              <span className="text-neutral-300 text-2xl mx-1">/</span>
              <span className="text-neutral-900 text-2xl">{students.length}</span>
            </p>
          </div>
          <div className="w-12 h-12 bg-success-50 text-success-dark rounded-full flex items-center justify-center text-xl">📋</div>
        </div>
        <div className="bg-white p-6 border border-neutral-200 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-500 mb-1">Overdue Alerts</p>
            <p className={`text-3xl font-bold ${overdueCount > 0 ? 'text-danger-dark' : 'text-neutral-900'}`}>{overdueCount}</p>
          </div>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${overdueCount > 0 ? 'bg-danger-50 text-danger-dark' : 'bg-neutral-100 text-neutral-500'}`}>🚨</div>
        </div>
      </div>

      {/* Student List */}
      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between">
          <h2 className="font-semibold text-neutral-900">Your Students</h2>
          <Link to="/academic-supervisor/log-wall" className="text-sm font-semibold text-blue-600 hover:underline">View Log Wall →</Link>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-white border-b border-neutral-100 text-neutral-500">
            <tr>
              <th className="px-6 py-3 font-medium">Student</th>
              <th className="px-6 py-3 font-medium">Placement</th>
              <th className="px-6 py-3 font-medium">Current Week</th>
              <th className="px-6 py-3 font-medium">Log Status</th>
              <th className="px-6 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {students.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-neutral-500">
                  No students assigned yet.
                </td>
              </tr>
            ) : students.map(student => (
              <tr key={student.id} className={`hover:bg-neutral-50 transition-colors ${student.consecutiveMissing && student.consecutiveMissing >= 2 ? 'border-l-4 border-l-danger bg-danger-50 hover:bg-danger-50' : ''}`}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-xs">
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900">{student.name}</p>
                      {student.consecutiveMissing && student.consecutiveMissing >= 2 && (
                        <p className="text-xs text-danger flex items-center gap-1 mt-0.5">
                          <span>🚩</span> {student.consecutiveMissing} periods missing
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="font-medium text-neutral-900">{student.company}</p>
                  <p className="text-neutral-500 text-xs">{student.role}</p>
                </td>
                <td className="px-6 py-4 text-neutral-600">Week {student.current_week || 4}</td>
                <td className="px-6 py-4">
                  {student.log_status === 'submitted' && <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-success-50 text-success-dark">Submitted</span>}
                  {student.log_status === 'pending' && <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">Pending</span>}
                  {(!student.log_status || student.log_status === 'missing') && <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-danger-50 text-danger">Overdue</span>}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <Link to={`/academic-supervisor/log-wall`} className="text-blue-600 hover:text-blue-800 font-medium">Log Wall</Link>
                    <Link to={`/academic-supervisor/student/${student.id}`} className="text-neutral-500 hover:text-neutral-700 font-medium">Profile</Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

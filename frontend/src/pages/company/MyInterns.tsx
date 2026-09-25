import { useState, useEffect } from 'react';
import api from '../../lib/axios';
import StudentProfileModal from '../../components/shared/StudentProfileModal';

interface StudentProfile {
  student_id: number;
  name: string;
  email: string;
  matric_no: string;
  faculty: string;
  department: string;
  level: number;
  cgpa: number | null;
  gender: string | null;
  current_tier: string | null;
  preliminary_fit_score: number | null;
  skills: {
    skill_name: string;
    claimed_level: number | null;
    verified_level: number | null;
    verification_status: string;
  }[];
}

export default function MyInterns() {
  const [internsByPosting, setInternsByPosting] = useState<Record<string, { title: string; interns: any[] }>>({});
  const [supervisors, setSupervisors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Student profile modal
  const [profileModal, setProfileModal] = useState<{
    open: boolean;
    studentId: number | null;
    data: StudentProfile | null;
    loading: boolean;
    error: string;
  }>({ open: false, studentId: null, data: null, loading: false, error: '' });


  const fetchData = async () => {
    try {
      setLoading(true);
      const [appsRes, supsRes, postingsRes] = await Promise.all([
        api.get('/applications/company'),
        api.get('/companies/supervisors'),
        api.get('/internships/company'),
      ]);

      // Build posting title map
      const postingTitles: Record<number, string> = {};
      const postingsList = Array.isArray(postingsRes.data) ? postingsRes.data : (postingsRes.data?.items || []);
      for (const posting of postingsList) {
        postingTitles[posting.id] = posting.title;
      }

      // Filter accepted only and group by internship_id
      const allApps = Array.isArray(appsRes.data) ? appsRes.data : (appsRes.data?.items || []);
      const accepted = allApps.filter((app: any) => app.status?.toLowerCase() === 'accepted');
      const grouped: Record<string, { title: string; interns: any[] }> = {};
      for (const app of accepted) {
        const key = String(app.internship_id);
        if (!grouped[key]) {
          grouped[key] = {
            title: postingTitles[app.internship_id] || app.role || 'Unknown Posting',
            interns: [],
          };
        }
        grouped[key].interns.push(app);
      }

      setInternsByPosting(grouped);
      setSupervisors(Array.isArray(supsRes.data) ? supsRes.data : (supsRes.data?.items || []));
    } catch (err) {
      console.error('Failed to fetch interns data', err);
      setError('Unable to load interns. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAssign = async (applicationId: number, supervisorUserId: number) => {
    try {
      await api.put(`/applications/${applicationId}/assign_supervisor`, {
        supervisor_user_id: supervisorUserId,
      });
      await fetchData();
    } catch (err: any) {
      console.error('Failed to assign supervisor', err);
      alert('Failed to assign supervisor: ' + (err.response?.data?.detail || 'Unknown error'));
    }
  };

  const handleViewProfile = async (studentId: number) => {
    if (!studentId) {
      alert('Student ID unavailable for this intern.');
      return;
    }
    setProfileModal({ open: true, studentId, data: null, loading: true, error: '' });
    try {
      const res = await api.get(`/companies/students/${studentId}`);
      setProfileModal({ open: true, studentId, data: res.data, loading: false, error: '' });
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to load student profile.';
      setProfileModal(prev => ({ ...prev, loading: false, error: msg }));
    }
  };

  const closeModal = () => {
    setProfileModal({ open: false, studentId: null, data: null, loading: false, error: '' });
  };

  if (loading) return <div className="p-6 text-neutral-500">Loading interns...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  const totalInterns = Object.values(internsByPosting).reduce((sum, g) => sum + g.interns.length, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">My Interns</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Manage accepted students grouped by internship posting. Assign each intern to an Industry Supervisor.
        </p>
      </div>

      {totalInterns === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-xl p-10 text-center shadow-sm">
          <p className="text-neutral-500 text-sm">No accepted interns yet. Go to Applications Received to accept candidates.</p>
        </div>
      ) : (
        Object.entries(internsByPosting).map(([postingId, group]) => (
          <div key={postingId} className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
            {/* Posting Header */}
            <div className="px-6 py-4 bg-neutral-50 border-b border-neutral-200 flex items-center gap-3">
              <span className="text-sm font-bold text-neutral-900">{group.title}</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700">
                {group.interns.length} intern{group.interns.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-neutral-600">
                <thead className="border-b border-neutral-200 text-neutral-500 font-medium text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3">Intern</th>
                    <th className="px-6 py-3">Track</th>
                    <th className="px-6 py-3">Assigned Supervisor</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {group.interns.map(intern => {
                    // Find if this intern has an assigned supervisor
                    // industry_supervisor_id stores the supervisor's user_id
                    const assignedSup = intern.industry_supervisor_id
                      ? supervisors.find(s => s.user_id === intern.industry_supervisor_id)
                      : null;
                    const isAssigned = Boolean(assignedSup);

                    return (
                      <tr key={intern.id} className="hover:bg-neutral-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                              {(intern.applicant_name || '?').charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold text-neutral-900">{intern.applicant_name}</p>
                              {intern.tier && (
                                <span className={`inline-flex mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  intern.tier === 'T1' ? 'bg-blue-50 text-blue-700' :
                                  intern.tier === 'T2' ? 'bg-purple-50 text-purple-700' :
                                  'bg-amber-50 text-amber-700'
                                }`}>
                                  {intern.tier}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            (intern.track === 'competitive' || intern.track === 'Competitive')
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-purple-100 text-purple-700'
                          }`}>
                            {intern.track}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {isAssigned ? (
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-neutral-900">{assignedSup!.name}</span>
                              <span className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded">Assigned</span>
                            </div>
                          ) : (
                            <span className="text-amber-600 font-medium text-xs">Not yet assigned</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            {/* View Profile button */}
                            <button
                              onClick={() => handleViewProfile(intern.student_id)}
                              className="px-3 py-1.5 border border-neutral-200 rounded-lg text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
                            >
                              View Profile
                            </button>

                            {/* Supervisor assignment — locked once assigned */}
                            {isAssigned ? (
                              <div
                                className="px-3 py-1.5 bg-neutral-100 text-neutral-400 rounded-lg text-xs font-semibold cursor-not-allowed"
                                title="Supervisor already assigned. Contact admin to change."
                              >
                                {assignedSup!.name} ✓
                              </div>
                            ) : (
                              <select
                                className="px-3 py-1.5 border border-neutral-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                                defaultValue=""
                                onChange={(e) => {
                                  if (e.target.value) {
                                    handleAssign(intern.id, parseInt(e.target.value));
                                  }
                                }}
                              >
                                <option value="" disabled>Assign Supervisor</option>
                                {supervisors.map(sup => (
                                  <option key={sup.id} value={sup.user_id.toString()}>
                                    {sup.name}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}

      {/* Student Profile Modal */}
      <StudentProfileModal
        open={profileModal.open}
        onClose={closeModal}
        loading={profileModal.loading}
        error={profileModal.error}
        studentId={profileModal.studentId}
        data={profileModal.data}
      />
    </div>
  );
}

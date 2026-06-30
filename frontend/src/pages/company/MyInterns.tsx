import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function MyInterns() {
  const [interns, setInterns] = useState<any[]>([]);
  const [supervisors, setSupervisors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const [appsRes, supsRes] = await Promise.all([
        axios.get(`${API_BASE}/api/v1/applications/company`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_BASE}/api/v1/companies/supervisors`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const acceptedInterns = appsRes.data.filter((app: any) => app.status?.toLowerCase() === 'accepted');
      setInterns(acceptedInterns);
      setSupervisors(supsRes.data);
    } catch (err) {
      console.error("Failed to fetch interns data", err);
      setError("Unable to load interns.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAssign = async (applicationId: number, supervisorUserId: number) => {
    try {
      const token = localStorage.getItem('access_token');
      await axios.put(`${API_BASE}/api/v1/applications/${applicationId}/assign_supervisor`, 
        { supervisor_user_id: supervisorUserId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Refresh the data after assigning
      fetchData();
    } catch (err) {
      console.error("Failed to assign supervisor", err);
      alert("Failed to assign supervisor.");
    }
  };

  if (loading) return <div className="p-6">Loading interns...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">My Interns</h1>
        <p className="text-sm text-neutral-500 mt-1">Manage accepted students and assign them to Industry Supervisors.</p>
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-neutral-600">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-medium">
              <tr>
                <th className="px-6 py-4">Intern Name</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Track</th>
                <th className="px-6 py-4">Supervisor Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {interns.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-neutral-500">
                    No accepted interns yet. Check your Applications Received.
                  </td>
                </tr>
              ) : (
                interns.map(intern => {
                  const assignedSup = supervisors.find(s => s.user_id === intern.industry_supervisor_id);

                  return (
                    <tr key={intern.id} className="hover:bg-neutral-50">
                      <td className="px-6 py-4 font-medium text-neutral-900">{intern.applicant_name}</td>
                      <td className="px-6 py-4">{intern.role}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          intern.track === 'Competitive' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {intern.track}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {assignedSup ? (
                          <span className="text-neutral-900">{assignedSup.name}</span>
                        ) : (
                          <span className="text-warning-dark font-medium">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <select
                          className="px-3 py-1.5 border border-neutral-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                          value={assignedSup ? assignedSup.user_id.toString() : ""}
                          onChange={(e) => {
                            if (e.target.value) {
                              handleAssign(intern.id, parseInt(e.target.value));
                            }
                          }}
                        >
                          <option value="" disabled>Select Supervisor</option>
                          {supervisors.map(sup => (
                            <option key={sup.id} value={sup.user_id.toString()}>
                              {sup.name}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

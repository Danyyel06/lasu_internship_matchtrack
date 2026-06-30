import { useState, useEffect } from 'react';
import axios from 'axios';

export default function ManageSupervisors() {
  const [supervisors, setSupervisors] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ full_name: '', job_title: '', work_email: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSupervisors();
  }, []);

  const fetchSupervisors = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/v1/companies/supervisors', {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
      });
      setSupervisors(response.data);
    } catch (error) {
      console.error("Failed to fetch supervisors", error);
    }
  };

  const handleAddSupervisor = async () => {
    if (!formData.full_name || !formData.job_title || !formData.work_email) return;
    setLoading(true);
    try {
      

      await axios.post('http://localhost:8000/api/v1/companies/supervisors', {
        full_name: formData.full_name,
        job_title: formData.job_title,
        work_email: formData.work_email
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
      });
      setShowAddModal(false);
      setFormData({ full_name: '', job_title: '', work_email: '' });
      fetchSupervisors();
    } catch (error) {
      console.error("Failed to add supervisor", error);
      alert("Error adding supervisor. Email might already exist.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Manage Supervisors</h1>
          <p className="text-neutral-600 text-sm mt-1">View and manage staff members registered as industry supervisors.</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 flex items-center gap-2">
          <span>+</span> Add New Supervisor
        </button>
      </div>

      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-neutral-50 border-b">
            <tr>
              <th className="p-4 font-medium text-neutral-600">Name</th>
              <th className="p-4 font-medium text-neutral-600">Job Title</th>
              <th className="p-4 font-medium text-neutral-600">Email</th>
              <th className="p-4 font-medium text-neutral-600">Interns Assigned</th>
              <th className="p-4 font-medium text-neutral-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {supervisors.length === 0 && (
              <tr><td colSpan={5} className="p-8 text-center text-neutral-500">No supervisors added yet.</td></tr>
            )}
            {supervisors.map(sup => (
              <tr key={sup.id} className="hover:bg-neutral-50">
                <td className="p-4 font-medium flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">{sup.name.charAt(0)}</div>
                  {sup.name}
                  {sup.status === 'Pending' && <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs rounded-full">Pending</span>}
                </td>
                <td className="p-4 text-neutral-600">{sup.title}</td>
                <td className="p-4 text-neutral-600">{sup.email}</td>
                <td className="p-4 text-neutral-600">{sup.interns_assigned}</td>
                <td className="p-4">
                  {sup.status === 'Pending' ? (
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">▷ Resend Invite</button>
                  ) : (
                    <div className="flex gap-3">
                      <button className="text-neutral-600 hover:text-neutral-900">✏</button>
                      <button className="text-red-600 hover:text-red-800">🗑</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-bold mb-4">Add New Supervisor</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <input type="text" className="w-full border p-2 rounded-lg" placeholder="e.g. Jane Doe" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Job Title</label>
                <input type="text" className="w-full border p-2 rounded-lg" placeholder="e.g. Senior Dev" value={formData.job_title} onChange={e => setFormData({...formData, job_title: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Work Email</label>
                <input type="email" className="w-full border p-2 rounded-lg" placeholder="jane@company.com" value={formData.work_email} onChange={e => setFormData({...formData, work_email: e.target.value})} />
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowAddModal(false)} className="flex-1 py-2 border rounded-lg font-medium">Cancel</button>
                <button onClick={handleAddSupervisor} disabled={loading} className="flex-1 py-2 bg-neutral-900 text-white rounded-lg font-medium disabled:opacity-50">{loading ? 'Sending...' : 'Send Invitation'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

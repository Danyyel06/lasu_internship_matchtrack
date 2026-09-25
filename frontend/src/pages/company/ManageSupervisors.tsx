import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/axios';
import { useCompanyTier } from '../../lib/hooks/useCompanyTier';

export default function ManageSupervisors() {
  const [supervisors, setSupervisors] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ full_name: '', job_title: '', work_email: '' });
  const [loading, setLoading] = useState(false);
  const [editingSup, setEditingSup] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({ full_name: '', job_title: '' });
  const [activationLink, setActivationLink] = useState<string | null>(null);

  const { capabilities, isLoading: isTierLoading } = useCompanyTier();

  useEffect(() => { fetchSupervisors(); }, []);

  const fetchSupervisors = async () => {
    try {
      const response = await api.get('/companies/supervisors');
      setSupervisors(response.data);
    } catch (error) {
      console.error("Failed to fetch supervisors", error);
    }
  };

  const handleAddSupervisor = async () => {
    if (!formData.full_name || !formData.job_title || !formData.work_email) return;
    setLoading(true);
    try {
      const res = await api.post('/companies/supervisors', {
        full_name: formData.full_name,
        job_title: formData.job_title,
        work_email: formData.work_email
      });
      setShowAddModal(false);
      setFormData({ full_name: '', job_title: '', work_email: '' });
      fetchSupervisors();
      // Show the activation link (dev mode — no email service needed)
      if (res.data?.activation_url) {
        setActivationLink(res.data.activation_url);
      }
    } catch (error: any) {
      console.error("Failed to add supervisor", error);
      alert("Error adding supervisor: " + (error.response?.data?.detail || "Email might already exist."));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSupervisor = async (userId: number, interns: number) => {
    if (interns > 0) {
      alert(`Cannot delete this supervisor — they currently have ${interns} intern(s) assigned. Reassign interns first.`);
      return;
    }
    if (!window.confirm("Are you sure you want to remove this supervisor?")) return;
    try {
      await api.delete(`/companies/supervisors/${userId}`);
      setSupervisors(prev => prev.filter(s => s.user_id !== userId));
    } catch (error: any) {
      console.error("Failed to delete supervisor", error);
      alert("Failed to remove supervisor: " + (error.response?.data?.detail || "Unknown error"));
    }
  };

  const openEdit = (sup: any) => {
    setEditingSup(sup);
    setEditForm({ full_name: sup.name, job_title: sup.title });
  };

  const handleEditSave = async () => {
    if (!editingSup) return;
    setLoading(true);
    try {
      await api.put(`/companies/supervisors/${editingSup.user_id}`, editForm);
      setEditingSup(null);
      fetchSupervisors();
    } catch (error: any) {
      console.error("Failed to update supervisor", error);
      alert("Failed to update supervisor: " + (error.response?.data?.detail || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const handleResendInvite = async (userId: number) => {
    setLoading(true);
    try {
      const res = await api.post(`/companies/supervisors/${userId}/resend-invite`);
      if (res.data?.activation_url) {
        setActivationLink(res.data.activation_url);
      }
      alert("Invite resent successfully.");
    } catch (error: any) {
      console.error("Failed to resend invite", error);
      alert("Failed to resend invite: " + (error.response?.data?.detail || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const isLocked = !isTierLoading && capabilities !== null && !capabilities.register_supervisors;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {isLocked && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-sm text-blue-800 font-medium">To register supervisors, complete Level 2 verification.</p>
          <Link to="/company/verification" className="flex-shrink-0 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors">
            Start Level 2 verification
          </Link>
        </div>
      )}
      <div className={isLocked ? 'opacity-50 pointer-events-none select-none' : ''}>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Manage Supervisors</h1>
          <p className="text-neutral-600 text-sm mt-1">Staff members registered as Industry Supervisors for your interns.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 flex items-center gap-2"
        >
          <span>+</span> Add Supervisor
        </button>
      </div>

      {/* Dev-mode activation link banner — shown after creating a supervisor */}
      {activationLink && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-blue-800 mb-1">
                📋 Supervisor Invitation Link (Dev Mode)
              </p>
              <p className="text-xs text-blue-700 mb-2">
                Share this link with the supervisor so they can set their password and activate
                their account. In production this would be sent via email automatically.
              </p>
              <input
                type="text"
                readOnly
                value={activationLink}
                onClick={(e) => (e.target as HTMLInputElement).select()}
                className="w-full text-xs font-mono bg-white border border-blue-300 rounded-lg px-3 py-2 text-blue-900 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(activationLink);
                alert('Activation link copied to clipboard!');
              }}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg flex-shrink-0 transition-colors"
            >
              Copy
            </button>
            <button
              onClick={() => setActivationLink(null)}
              className="text-blue-400 hover:text-blue-600 text-lg leading-none flex-shrink-0"
            >
              ×
            </button>
          </div>
        </div>
      )}


      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-neutral-50 border-b">
              <tr>
                <th className="p-4 font-medium text-neutral-600 text-sm">Name</th>
                <th className="p-4 font-medium text-neutral-600 text-sm">Job Title</th>
                <th className="p-4 font-medium text-neutral-600 text-sm">Email</th>
                <th className="p-4 font-medium text-neutral-600 text-sm">Interns Assigned</th>
                <th className="p-4 font-medium text-neutral-600 text-sm">Status</th>
                <th className="p-4 font-medium text-neutral-600 text-sm">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {supervisors.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-neutral-500">No supervisors added yet.</td></tr>
              )}
              {supervisors.map(sup => (
                <tr key={sup.id} className="hover:bg-neutral-50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                        {sup.name.charAt(0)}
                      </div>
                      <span className="font-medium text-neutral-900">{sup.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-neutral-600 text-sm">{sup.title}</td>
                  <td className="p-4 text-neutral-600 text-sm">{sup.email}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                      sup.interns_assigned > 0 ? 'bg-blue-100 text-blue-700' : 'bg-neutral-100 text-neutral-500'
                    }`}>
                      {sup.interns_assigned}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                      sup.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {sup.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {sup.status === 'Pending' && (
                        <button
                          onClick={() => handleResendInvite(sup.user_id)}
                          className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 font-medium transition-colors"
                          title="Resend Invite"
                        >
                          Resend Invite
                        </button>
                      )}
                      <button
                        onClick={() => openEdit(sup)}
                        className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
                        title="Edit supervisor"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                      </button>
                      <button
                        onClick={() => handleDeleteSupervisor(sup.user_id, sup.interns_assigned)}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove supervisor"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Supervisor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAddModal(false)}>
          <div className="bg-white w-full max-w-md p-6 rounded-xl shadow-lg" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Add New Supervisor</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name *</label>
                <input
                  type="text"
                  className="w-full border p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-neutral-900 outline-none"
                  placeholder="e.g. Jane Doe"
                  value={formData.full_name}
                  onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Job Title *</label>
                <input
                  type="text"
                  className="w-full border p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-neutral-900 outline-none"
                  placeholder="e.g. Senior Developer"
                  value={formData.job_title}
                  onChange={e => setFormData({ ...formData, job_title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Work Email *</label>
                <input
                  type="email"
                  className="w-full border p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-neutral-900 outline-none"
                  placeholder="jane@company.com"
                  value={formData.work_email}
                  onChange={e => setFormData({ ...formData, work_email: e.target.value })}
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 border rounded-lg font-medium text-sm">
                  Cancel
                </button>
                <button
                  onClick={handleAddSupervisor}
                  disabled={loading}
                  className="flex-1 py-2.5 bg-neutral-900 text-white rounded-lg font-medium text-sm disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add Supervisor'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Supervisor Modal */}
      {editingSup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setEditingSup(null)}>
          <div className="bg-white w-full max-w-md p-6 rounded-xl shadow-lg" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Edit Supervisor</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  className="w-full border p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-neutral-900 outline-none"
                  value={editForm.full_name}
                  onChange={e => setEditForm({ ...editForm, full_name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Job Title</label>
                <input
                  type="text"
                  className="w-full border p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-neutral-900 outline-none"
                  value={editForm.job_title}
                  onChange={e => setEditForm({ ...editForm, job_title: e.target.value })}
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setEditingSup(null)} className="flex-1 py-2.5 border rounded-lg font-medium text-sm">
                  Cancel
                </button>
                <button
                  onClick={handleEditSave}
                  disabled={loading}
                  className="flex-1 py-2.5 bg-neutral-900 text-white rounded-lg font-medium text-sm disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

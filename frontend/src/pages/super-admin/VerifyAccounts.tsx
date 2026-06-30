import { useState, useEffect } from 'react';
import axios from 'axios';

export default function SuperAdminVerifyAccounts() {
  const [activeTab, setActiveTab] = useState<'companies' | 'hods'>('companies');
  const [selectedEntity, setSelectedEntity] = useState<any | null>(null);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const [compRes, hodRes] = await Promise.all([
          axios.get('http://localhost:8000/api/v1/admin/pending-companies', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://localhost:8000/api/v1/admin/pending-hods', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setCompanies(compRes.data);
        setHods(hodRes.data);
      } catch (error) {
        console.error("Failed to fetch pending accounts", error);
      }
    };
    fetchPending();
  }, []);


  // Dummy data for visual layout
  const [companies, setCompanies] = useState<any[]>([]);

  const [hods, setHods] = useState<any[]>([]);

  const handleVerify = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const endpoint = activeTab === 'companies' 
        ? `http://localhost:8000/api/v1/admin/verify-company/${selectedEntity.id}`
        : `http://localhost:8000/api/v1/admin/verify-hod/${selectedEntity.id}`;
      
      await axios.post(endpoint, {}, { headers: { Authorization: `Bearer ${token}` } });
      
      setIsVerifyModalOpen(false);
      setSelectedEntity(null);
      // Refresh logic would go here
    } catch (error) {
      console.error("Failed to verify", error);
    }
  };

  const handleReject = async () => {
    if (activeTab !== 'companies') return; // Only companies have reject flow in spec
    try {
      const token = localStorage.getItem('access_token');
      await axios.post(`http://localhost:8000/api/v1/admin/reject-company/${selectedEntity.id}`, 
        { reason: rejectReason }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setIsRejectModalOpen(false);
      setRejectReason('');
      setSelectedEntity(null);
      // Refresh logic would go here
    } catch (error) {
      console.error("Failed to reject", error);
    }
  };

  const activeData = activeTab === 'companies' ? companies : hods;

  return (
    <div className="p-6 max-w-7xl mx-auto h-full flex flex-col relative">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Verify Accounts</h1>
        <p className="text-neutral-500 text-sm mt-1">Review and approve platform access requests.</p>
      </div>

      <div className="flex border-b border-neutral-200 mb-6">
        <button
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'companies' ? 'border-blue-600 text-blue-600' : 'border-transparent text-neutral-500 hover:text-neutral-700'
          }`}
          onClick={() => { setActiveTab('companies'); setSelectedEntity(null); }}
        >
          Companies
        </button>
        <button
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'hods' ? 'border-blue-600 text-blue-600' : 'border-transparent text-neutral-500 hover:text-neutral-700'
          }`}
          onClick={() => { setActiveTab('hods'); setSelectedEntity(null); }}
        >
          Heads of Department
        </button>
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* Table Area */}
        <div className={`flex-1 bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden flex flex-col ${selectedEntity ? 'hidden lg:flex' : 'flex'}`}>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm text-neutral-600">
              <thead className="text-xs text-neutral-500 uppercase bg-neutral-50 border-b border-neutral-200 sticky top-0">
                <tr>
                  <th className="px-6 py-4 font-medium">Name</th>
                  <th className="px-6 py-4 font-medium">{activeTab === 'companies' ? 'Email' : 'Department'}</th>
                  <th className="px-6 py-4 font-medium">Submitted</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {activeData.map((item: any) => (
                  <tr key={item.id} className={`hover:bg-neutral-50 transition-colors ${selectedEntity?.id === item.id ? 'bg-blue-50' : ''}`}>
                    <td className="px-6 py-4 font-medium text-neutral-900">{item.name}</td>
                    <td className="px-6 py-4">{activeTab === 'companies' ? item.email : item.department}</td>
                    <td className="px-6 py-4 text-neutral-500">{item.submittedAt}</td>
                    <td className="px-6 py-4">
                      <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-xs font-medium">
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setSelectedEntity(item)}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sliding Side Panel */}
        {selectedEntity && (
          <div className="w-full lg:w-1/3 bg-white rounded-xl shadow-lg border border-neutral-200 flex flex-col h-full animate-in slide-in-from-right-8 duration-300">
            <div className="p-4 border-b border-neutral-200 flex justify-between items-center bg-neutral-50 rounded-t-xl">
              <h2 className="font-bold text-neutral-900">Review Request</h2>
              <button 
                onClick={() => setSelectedEntity(null)}
                className="text-neutral-400 hover:text-neutral-600 text-xl"
              >×</button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto space-y-6">
              <div>
                <h3 className="text-xl font-bold text-neutral-900">{selectedEntity.name}</h3>
                <p className="text-sm text-neutral-500">
                  {activeTab === 'companies' ? selectedEntity.email : selectedEntity.department}
                </p>
              </div>

              {activeTab === 'companies' ? (
                <div className="space-y-4">
                  <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                    <p className="text-xs text-neutral-500 font-medium uppercase mb-1">Company Registration Number</p>
                    <p className="text-sm font-mono text-neutral-900">RC-12345678</p>
                  </div>
                  <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                    <p className="text-xs text-neutral-500 font-medium uppercase mb-1">Tax Identification Number (TIN)</p>
                    <p className="text-sm font-mono text-neutral-900">TIN-987654321</p>
                  </div>
                  <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                    <p className="text-xs text-neutral-500 font-medium uppercase mb-2">Supporting Documents</p>
                    <div className="flex items-center gap-3 p-3 bg-white border border-neutral-200 rounded-lg">
                      <span className="text-red-500 text-xl">📄</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-neutral-900">CAC_Certificate.pdf</p>
                        <p className="text-xs text-neutral-500">2.4 MB</p>
                      </div>
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">View</button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                    <p className="text-xs text-neutral-500 font-medium uppercase mb-1">Faculty</p>
                    <p className="text-sm font-medium text-neutral-900">Science</p>
                  </div>
                  <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                    <p className="text-xs text-neutral-500 font-medium uppercase mb-1">Staff ID</p>
                    <p className="text-sm font-mono text-neutral-900">LASU/STF/1029</p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-neutral-200 bg-neutral-50 rounded-b-xl flex gap-3">
              <button 
                onClick={() => setIsVerifyModalOpen(true)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-lg transition-colors"
              >
                Approve
              </button>
              {activeTab === 'companies' && (
                <button 
                  onClick={() => setIsRejectModalOpen(true)}
                  className="flex-1 bg-white hover:bg-neutral-50 text-red-600 font-medium py-2 rounded-lg border border-neutral-200 transition-colors"
                >
                  Reject
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Verify Modal */}
      {isVerifyModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-neutral-900 mb-2">Confirm Approval</h3>
            <p className="text-neutral-600 text-sm mb-6">
              Are you sure you want to approve <span className="font-bold text-neutral-900">{selectedEntity?.name}</span>? They will gain full access to the platform immediately.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setIsVerifyModalOpen(false)}
                className="flex-1 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={handleVerify}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                Yes, Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-neutral-900 mb-2">Reject Application</h3>
            <p className="text-neutral-600 text-sm mb-4">
              Please provide a reason for rejecting <span className="font-bold text-neutral-900">{selectedEntity?.name}</span>. This will be sent to their email.
            </p>
            <textarea
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none h-24 mb-6"
              placeholder="e.g. CAC Document is illegible..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            ></textarea>
            <div className="flex gap-3">
              <button 
                onClick={() => setIsRejectModalOpen(false)}
                className="flex-1 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={handleReject}
                disabled={!rejectReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50"
              >
                Reject Application
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

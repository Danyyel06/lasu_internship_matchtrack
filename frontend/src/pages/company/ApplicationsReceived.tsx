import { useState, useEffect } from 'react';
import api from '../../lib/axios';

export default function ApplicationsReceived() {
  const [internships, setInternships] = useState<any[]>([]);
  const [selectedInternshipId, setSelectedInternshipId] = useState<string>('');
  const [competitivePool, setCompetitivePool] = useState<any[]>([]);
  const [equityPool, setEquityPool] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'Competitive' | 'Equity'>('Competitive');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        // Fetch all company internships
        const internshipsRes = await api.get('/internships/company');
        setInternships(internshipsRes.data);
        
        if (internshipsRes.data.length > 0) {
          const firstId = internshipsRes.data[0].id.toString();
          setSelectedInternshipId(firstId);
          await fetchMatches(firstId);
        } else {
          setLoading(false);
        }
      } catch (err: any) {
        console.error("Failed to fetch internships", err);
        setErrorMsg('Failed to load internships.');
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  const fetchMatches = async (internshipId: string) => {
    try {
      setLoading(true);
      const res = await api.get(`/internships/${internshipId}/matches`);
      setCompetitivePool(res.data.competitive_pool || []);
      setEquityPool(res.data.equity_pool || []);
    } catch (err: any) {
      console.error("Failed to fetch matches", err);
      setErrorMsg('Failed to load application pools.');
    } finally {
      setLoading(false);
    }
  };

  const handleInternshipChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    setSelectedInternshipId(newId);
    fetchMatches(newId);
  };

  const handleAction = async (id: string, action: 'Accepted' | 'Declined') => {
    try {
      await api.put(`/applications/${id}/status`, { status: action.toLowerCase() });
      fetchMatches(selectedInternshipId);
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const currentPool = activeTab === 'Competitive' ? competitivePool : equityPool;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Applications Received</h1>
          <p className="text-sm text-neutral-500 mt-1">Review candidates and manage your shortlist.</p>
        </div>
        <div className="flex gap-2">
          <select 
            value={selectedInternshipId} 
            onChange={handleInternshipChange}
            className="p-2 border border-neutral-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-green-600 outline-none min-w-[200px]"
          >
            {internships.map(inc => (
              <option key={inc.id} value={inc.id.toString()}>{inc.title}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex border-b border-neutral-200">
        <button
          onClick={() => setActiveTab('Competitive')}
          className={`px-6 py-3 font-semibold text-sm transition-colors ${
            activeTab === 'Competitive' 
              ? 'border-b-2 border-green-600 text-green-700' 
              : 'text-neutral-500 hover:text-neutral-700'
          }`}
        >
          Competitive Pool
        </button>
        <button
          onClick={() => setActiveTab('Equity')}
          className={`px-6 py-3 font-semibold text-sm transition-colors ${
            activeTab === 'Equity' 
              ? 'border-b-2 border-green-600 text-green-700' 
              : 'text-neutral-500 hover:text-neutral-700'
          }`}
        >
          Equity Pool
        </button>
      </div>
      {errorMsg && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          Error: {errorMsg}
        </div>
      )}



      {loading ? (
        <div className="flex justify-center p-12"><div className="animate-spin text-4xl">⏳</div></div>
      ) : (
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 text-neutral-500 text-xs uppercase tracking-wider border-b border-neutral-200">
                <th className="px-5 py-3 font-medium">Applicant</th>
                <th className="px-5 py-3 font-medium">Fit Score</th>
                <th className="px-5 py-3 font-medium">Gap Analysis</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-neutral-200">
              {currentPool.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-neutral-500">
                    No applications found in the {activeTab} pool.
                  </td>
                </tr>
              ) : (
                currentPool.map((app) => (
                  <tr key={app.application_id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold">
                          {(app.applicant_name || 'A').charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-neutral-900">{app.applicant_name}</p>
                          <span className={`inline-flex mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            app.tier === 'T1' ? 'bg-blue-50 text-blue-700' : 
                            app.tier === 'T2' ? 'bg-purple-50 text-purple-700' : 
                            app.tier === 'T3' ? 'bg-amber-50 text-amber-700' : 
                            'bg-neutral-100 text-neutral-600'
                          }`}>
                            {app.tier || 'No Tier'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-neutral-900">{app.fit_score}%</span>
                        <div className="w-16 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${app.fit_score >= 80 ? 'bg-green-500' : app.fit_score >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                            style={{ width: `${app.fit_score}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-xs text-neutral-600 max-w-xs space-y-1">
                        {app.gap_analysis && app.gap_analysis.slice(0, 2).map((gap: any, i: number) => (
                          <div key={i} className="flex items-center gap-1">
                            {gap.meets_requirement ? '✅' : '❌'} {gap.skill_name} 
                            {gap.meets_requirement ? '' : ` (Gap: ${gap.gap})`}
                          </div>
                        ))}
                        {app.gap_analysis && app.gap_analysis.length > 2 && (
                          <span className="text-neutral-400">+{app.gap_analysis.length - 2} more</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                        (app.status === 'pending' || app.status === 'applied') ? 'bg-amber-50 text-amber-700' : 
                        app.status === 'accepted' ? 'bg-green-50 text-green-700' : 
                        'bg-red-50 text-red-700'
                      }`}>
                        {(app.status === 'pending' || app.status === 'applied') ? 'Pending' : 
                         app.status === 'accepted' ? 'Accepted' : 'Declined'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {(app.status === 'pending' || app.status === 'applied') ? (
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleAction(app.application_id, 'Accepted')}
                            className="p-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                            title="Accept"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                          </button>
                          <button 
                            onClick={() => handleAction(app.application_id, 'Declined')}
                            className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                            title="Decline"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                          </button>
                        </div>
                      ) : (
                        <button className="text-sm font-semibold text-green-600 hover:text-green-700">View Profile</button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}
    </div>
  );
}

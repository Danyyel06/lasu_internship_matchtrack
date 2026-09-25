import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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

export default function ApplicationsReceived() {
  const [searchParams] = useSearchParams();
  const [internships, setInternships] = useState<any[]>([]);
  const [selectedInternshipId, setSelectedInternshipId] = useState<string>('');
  const [competitivePool, setCompetitivePool] = useState<any[]>([]);
  const [equityPool, setEquityPool] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'All' | 'Competitive' | 'Equity'>('All');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 20;

  // Student profile modal
  const [profileModal, setProfileModal] = useState<{
    open: boolean;
    studentId: number | null;
    data: StudentProfile | null;
    loading: boolean;
    error: string;
  }>({
    open: false,
    studentId: null,
    data: null,
    loading: false,
    error: ''
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const internshipsRes = await api.get('/internships/company');
        setInternships(internshipsRes.data);

        if (internshipsRes.data.length > 0) {
          // Default to 'all' unless a specific ?posting= param is provided
          const postingParam = searchParams.get('posting');
          const validPosting = postingParam && internshipsRes.data.find((i: any) => i.id.toString() === postingParam);
          const firstId = validPosting ? postingParam! : 'all';
          setSelectedInternshipId(firstId);
          await fetchMatches(firstId, internshipsRes.data);
        } else {
          setLoading(false);
        }
      } catch (err: any) {
        console.error('Failed to fetch internships', err);
        setErrorMsg('Failed to load internships.');
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  const fetchMatches = async (internshipId: string, allInternships?: any[]) => {
    try {
      setLoading(true);
      setErrorMsg('');
      if (internshipId === 'all') {
        // Fetch from all postings in parallel and merge
        const list = allInternships || internships;
        const results = await Promise.all(
          list.map((i: any) => api.get(`/internships/${i.id}/matches`).catch(() => ({ data: { competitive_pool: [], equity_pool: [] } })))
        );
        const mergedComp = results.flatMap(r => r.data.competitive_pool || []);
        const mergedEquity = results.flatMap(r => r.data.equity_pool || []);
        setCompetitivePool(mergedComp);
        setEquityPool(mergedEquity);
      } else {
        const res = await api.get(`/internships/${internshipId}/matches`);
        setCompetitivePool(res.data.competitive_pool || []);
        setEquityPool(res.data.equity_pool || []);
      }
    } catch (err: any) {
      console.error('Failed to fetch matches', err);
      setErrorMsg('Failed to load application pools.');
    } finally {
      setLoading(false);
    }
  };

  const handleInternshipChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    setSelectedInternshipId(newId);
    setCurrentPage(1);
    fetchMatches(newId);
  };

  const handleAction = async (id: string, action: 'Accepted' | 'Declined' | 'Shortlisted') => {
    try {
      await api.put(`/applications/${id}/status`, { status: action.toLowerCase() });
      fetchMatches(selectedInternshipId);
    } catch (err) {
      console.error('Failed to update status', err);
      alert('Failed to update application status.');
    }
  };

  const handleViewProfile = async (studentId: number) => {
    if (!studentId) {
      alert('Student ID is not available for this applicant.');
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

  const allPool = [...competitivePool, ...equityPool];
  const currentPool =
    activeTab === 'All' ? allPool :
    activeTab === 'Competitive' ? competitivePool :
    equityPool;

  const totalPages = Math.ceil(currentPool.length / limit);
  const startIndex = (currentPage - 1) * limit;
  const paginatedPool = currentPool.slice(startIndex, startIndex + limit);

  const selectedPosting = internships.find(i => i.id.toString() === selectedInternshipId);

  return (
    <div className="space-y-6">
      {/* Page header row — title left, posting selector right */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="shrink-0">
          <h1 className="text-2xl font-bold text-neutral-900">Applications Received</h1>
          <p className="text-sm text-neutral-500 mt-1">Review and action candidates for each posting.</p>
        </div>

        {/* Compact posting selector */}
        <div className="sm:min-w-[260px]">
          <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">
            Viewing posting
          </label>
          <select
            value={selectedInternshipId}
            onChange={handleInternshipChange}
            className="w-full px-3 py-2 border-2 border-neutral-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-green-600 focus:border-green-500 outline-none font-semibold text-neutral-900 cursor-pointer"
          >
            {internships.length === 0 && (
              <option value="">No postings available</option>
            )}
            <option value="all">📋 All Postings</option>
            {internships.map(inc => (
              <option key={inc.id} value={inc.id.toString()}>
                {inc.title}
              </option>
            ))}
          </select>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {selectedInternshipId === 'all' ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700">
                {competitivePool.length + equityPool.length} total applicant{competitivePool.length + equityPool.length !== 1 ? 's' : ''} across {internships.length} posting{internships.length !== 1 ? 's' : ''}
              </span>
            ) : selectedPosting ? (
              <>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                  selectedPosting.status === 'open' ? 'bg-green-50 text-green-700' : 'bg-neutral-100 text-neutral-500'
                }`}>
                  {selectedPosting.status === 'open' ? '🟢' : '🔴'} {selectedPosting.status}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-neutral-100 text-neutral-600">
                  {selectedPosting.total_slots} slot{selectedPosting.total_slots !== 1 ? 's' : ''}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700">
                  {competitivePool.length + equityPool.length} applicant{competitivePool.length + equityPool.length !== 1 ? 's' : ''}
                </span>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* Pool Tabs with counts */}
      <div className="flex border-b border-neutral-200">
        <button
          onClick={() => { setActiveTab('All'); setCurrentPage(1); }}
          className={`relative flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-colors ${
            activeTab === 'All'
              ? 'border-b-2 border-neutral-800 text-neutral-900'
              : 'text-neutral-500 hover:text-neutral-700'
          }`}
        >
          All Applications
          <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
            activeTab === 'All' ? 'bg-neutral-800 text-white' : 'bg-neutral-200 text-neutral-600'
          }`}>
            {allPool.length}
          </span>
        </button>
        <button
          onClick={() => { setActiveTab('Competitive'); setCurrentPage(1); }}
          className={`relative flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-colors ${
            activeTab === 'Competitive'
              ? 'border-b-2 border-green-600 text-green-700'
              : 'text-neutral-500 hover:text-neutral-700'
          }`}
        >
          🏆 Competitive
          <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
            activeTab === 'Competitive' ? 'bg-green-600 text-white' : 'bg-neutral-200 text-neutral-600'
          }`}>
            {competitivePool.length}
          </span>
        </button>
        <button
          onClick={() => { setActiveTab('Equity'); setCurrentPage(1); }}
          className={`relative flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-colors ${
            activeTab === 'Equity'
              ? 'border-b-2 border-purple-600 text-purple-700'
              : 'text-neutral-500 hover:text-neutral-700'
          }`}
        >
          🌱 Equity
          <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
            activeTab === 'Equity' ? 'bg-purple-600 text-white' : 'bg-neutral-200 text-neutral-600'
          }`}>
            {equityPool.length}
          </span>
        </button>
      </div>

      {errorMsg && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg text-sm">Error: {errorMsg}</div>
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
                    <td colSpan={5} className="px-5 py-10 text-center">
                      <p className="text-neutral-500 text-sm">No applications in the {activeTab} pool for this posting.</p>
                      {activeTab === 'Competitive' && equityPool.length > 0 && (
                        <p className="text-xs text-neutral-400 mt-1">
                          Check the <button onClick={() => setActiveTab('Equity')} className="text-purple-600 underline">Equity Pool</button> — {equityPool.length} applicant{equityPool.length !== 1 ? 's' : ''} there.
                        </p>
                      )}
                    </td>
                  </tr>
                ) : (
                  paginatedPool.map((app) => (
                    <tr key={app.application_id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold shrink-0">
                            {(app.applicant_name || 'A').charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-neutral-900">{app.applicant_name}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                app.tier === 'T1' ? 'bg-blue-50 text-blue-700' :
                                app.tier === 'T2' ? 'bg-purple-50 text-purple-700' :
                                app.tier === 'T3' ? 'bg-amber-50 text-amber-700' :
                                'bg-neutral-100 text-neutral-600'
                              }`}>
                                {app.tier || 'No Tier'}
                              </span>
                              {activeTab === 'All' && (
                                <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold ${
                                  competitivePool.some(c => c.application_id === app.application_id)
                                    ? 'bg-green-50 text-green-600'
                                    : 'bg-purple-50 text-purple-600'
                                }`}>
                                  {competitivePool.some(c => c.application_id === app.application_id) ? '🏆 Competitive' : '🌱 Equity'}
                                </span>
                              )}
                            </div>
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
                          {(!app.gap_analysis || app.gap_analysis.length === 0) && (
                            <span className="text-neutral-400">No requirements set</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                          (app.status === 'pending' || app.status === 'applied') ? 'bg-amber-50 text-amber-700' :
                          app.status === 'shortlisted' ? 'bg-blue-50 text-blue-700' :
                          app.status === 'accepted' ? 'bg-green-50 text-green-700' :
                          'bg-red-50 text-red-700'
                        }`}>
                          {(app.status === 'pending' || app.status === 'applied') ? 'Pending' :
                           app.status === 'shortlisted' ? 'Shortlisted' :
                           app.status === 'accepted' ? 'Accepted' : 'Declined'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {(app.status === 'pending' || app.status === 'applied' || app.status === 'shortlisted') && (
                            <>
                              {app.status !== 'shortlisted' && (
                                <button
                                  onClick={() => handleAction(app.application_id, 'Shortlisted')}
                                  className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                  title="Shortlist"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>
                                </button>
                              )}
                              <button
                                onClick={() => handleAction(app.application_id, 'Accepted')}
                                className="p-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                                title="Accept"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                              </button>
                              <button
                                onClick={() => handleAction(app.application_id, 'Declined')}
                                className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                title="Decline"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleViewProfile(app.student_id)}
                            className="px-3 py-1.5 text-xs font-semibold text-neutral-700 border border-neutral-200 hover:bg-neutral-50 rounded-lg transition-colors"
                            title="View full student profile"
                          >
                            View Profile
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-neutral-200 bg-neutral-50">
              <p className="text-sm text-neutral-500">
                Showing <span className="font-medium text-neutral-900">{startIndex + 1}</span> to <span className="font-medium text-neutral-900">{Math.min(startIndex + limit, currentPool.length)}</span> of <span className="font-medium text-neutral-900">{currentPool.length}</span> results
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm font-medium border border-neutral-300 rounded-lg bg-white text-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-sm font-medium border border-neutral-300 rounded-lg bg-white text-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
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

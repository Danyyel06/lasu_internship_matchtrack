import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/axios';

// ─── Types ───────────────────────────────────────────────────────────────────

interface QueueItem {
  submission_id: number;
  company_id: number;
  company_name: string;
  rep_email: string;
  rep_name: string;
  tier: number;
  tier_name: string;
  status: string;
  submitted_at: string | null;
  auto_flags: string[];
}

interface SubmissionDetail {
  submission_id: number;
  company_id: number;
  company_name: string;
  tier: number;
  status: string;
  payload: Record<string, any> | null;
  auto_check_result: Record<string, any> | null;
  reviewer_note: string | null;
  submitted_at: string | null;
  rep_name: string;
  rep_email: string;
  rep_phone: string | null;
  rep_job_title: string | null;
  email_verified: boolean;
  phone_verified: boolean;
  industry: string | null;
  company_size: string | null;
  state: string | null;
  lga: string | null;
  internship_description: string | null;
  is_individual_verified: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TIER_FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'L1 Registration', value: '1' },
  { label: 'L2 Business identity', value: '2' },
  { label: 'L3 Documents', value: '3' },
  { label: 'L4 Partner review', value: '4' },
];

const TIER_NAMES: Record<number, string> = {
  1: 'Registration',
  2: 'Business identity',
  3: 'Documents',
  4: 'Partner review',
};

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-400 mb-1">{label}</p>
      <p className="text-sm text-neutral-900 font-medium">{value || '—'}</p>
    </div>
  );
}

function VerifiedBadge({ label, ok }: { label: string; ok: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${ok ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-500'}`}>
      {ok ? '✓' : '○'} {label}
    </span>
  );
}

// ─── Panel: Level 1 ──────────────────────────────────────────────────────────

function L1Panel({ d }: { d: SubmissionDetail }) {
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-800">
        Level 1 review is a light check. Approve unless obvious junk — the platform's trust grows through subsequent tiers.
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Industry" value={d.industry} />
        <Field label="Company size" value={d.company_size} />
        <Field label="State" value={d.state} />
        <Field label="LGA" value={d.lga} />
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-neutral-400 mb-2">Representative</p>
        <div className="grid grid-cols-1 gap-2">
          <Field label="Name" value={d.rep_name} />
          <Field label="Role" value={d.rep_job_title} />
          <Field label="Email" value={d.rep_email} />
          <Field label="Phone" value={d.rep_phone} />
        </div>
        <div className="flex gap-2 mt-2">
          <VerifiedBadge label="Email verified" ok={d.email_verified} />
          <VerifiedBadge label="Phone verified" ok={d.phone_verified} />
        </div>
      </div>
      {d.internship_description && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-neutral-400 mb-1">Internship description</p>
          <p className="text-sm text-neutral-700 bg-neutral-50 rounded-lg p-3 border border-neutral-200">{d.internship_description}</p>
        </div>
      )}
      {d.auto_check_result != null && d.auto_check_result?.flags?.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-amber-600 mb-2">Automated flags</p>
          <div className="flex flex-wrap gap-2">
            {d.auto_check_result.flags.map((flag: string, i: number) => (
              <span key={i} className="bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full text-xs font-medium">{flag}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Panel: Level 2 ──────────────────────────────────────────────────────────

function L2Panel({ d }: { d: SubmissionDetail }) {
  const payload = d.payload || {};
  const lookup = d.auto_check_result || {};
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-neutral-400 mb-2">Verification method</p>
        <Field label="Method" value={payload.verification_method?.replace(/_/g, ' ').toUpperCase()} />
        <Field label="Value" value={payload.method_value} />
      </div>
      {d.is_individual_verified && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
          ⚠️ Individual-verified host — students will see this label on the listing.
        </div>
      )}
      {lookup.registered_name && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-neutral-400 mb-2">Auto-lookup result</p>
          <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 space-y-1 text-sm">
            <p><span className="text-neutral-500">Registered name:</span> <strong>{lookup.registered_name}</strong></p>
            <p><span className="text-neutral-500">Status:</span> {lookup.status}</p>
            <p><span className="text-neutral-500">Registration date:</span> {lookup.registration_date}</p>
            <p className={`font-medium ${lookup.name_match ? 'text-green-700' : 'text-red-600'}`}>
              {lookup.name_match ? '✓ Name matches company' : '✗ Name mismatch — review carefully'}
            </p>
          </div>
        </div>
      )}
      {payload.business_address && (
        <Field label="Business address" value={`${payload.business_address.street}, ${payload.business_address.city}, ${payload.business_address.state}`} />
      )}
      {payload.named_supervisor && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-neutral-400 mb-2">Named supervisor</p>
          <div className="grid grid-cols-1 gap-2">
            <Field label="Name" value={payload.named_supervisor.name} />
            <Field label="Role" value={payload.named_supervisor.role} />
            <Field label="Email" value={payload.named_supervisor.email} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Panel: Level 3 ──────────────────────────────────────────────────────────

function L3Panel({ d }: { d: SubmissionDetail }) {
  const payload = d.payload || {};
  const docs: any[] = payload.documents || [];
  return (
    <div className="space-y-3">
      {docs.length === 0 && <p className="text-sm text-neutral-500">No documents listed in payload.</p>}
      {docs.map((doc: any, i: number) => (
        <div key={i} className="bg-neutral-50 border border-neutral-200 rounded-lg p-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-900">{doc.doc_type?.replace(/_/g, ' ')}</p>
              <p className="text-xs text-neutral-400 mt-0.5">{doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString('en-GB') : ''}</p>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
              doc.review_status === 'approved' ? 'bg-green-100 text-green-700' :
              doc.review_status === 'flagged' ? 'bg-red-100 text-red-700' : 'bg-neutral-100 text-neutral-500'
            }`}>
              {doc.review_status || 'Pending'}
            </span>
          </div>
          {doc.review_note && <p className="text-xs text-neutral-600 mt-2 border-t border-neutral-200 pt-2">{doc.review_note}</p>}
        </div>
      ))}
    </div>
  );
}

// ─── Panel: Level 4 ──────────────────────────────────────────────────────────

function L4Panel({ d }: { d: SubmissionDetail }) {
  const payload = d.payload || {};
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-neutral-900">{payload.completed_cycles ?? '—'}</p>
          <p className="text-xs text-neutral-500 mt-1">Completed cycles</p>
        </div>
        <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-neutral-900">{payload.logbook_rate != null ? `${payload.logbook_rate}%` : '—'}</p>
          <p className="text-xs text-neutral-500 mt-1">Logbook rate</p>
        </div>
        <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-neutral-900">{payload.avg_student_rating ?? '—'}</p>
          <p className="text-xs text-neutral-500 mt-1">Avg student rating</p>
        </div>
        <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-neutral-900">{payload.incident_count ?? '—'}</p>
          <p className="text-xs text-neutral-500 mt-1">Incidents</p>
        </div>
      </div>
    </div>
  );
}

// ─── HOD list (unchanged) ─────────────────────────────────────────────────────

function HodList({ hods, selectedHod, onSelect }: {
  hods: any[];
  selectedHod: any | null;
  onSelect: (h: any) => void;
}) {
  return (
    <div className="overflow-x-auto flex-1">
      <table className="w-full text-left text-sm text-neutral-600">
        <thead className="text-xs text-neutral-500 uppercase bg-neutral-50 border-b border-neutral-200 sticky top-0">
          <tr>
            <th className="px-6 py-4 font-medium">Name</th>
            <th className="px-6 py-4 font-medium">Department</th>
            <th className="px-6 py-4 font-medium">Submitted</th>
            <th className="px-6 py-4 font-medium text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200">
          {hods.map((item: any) => (
            <tr key={item.id} className={`hover:bg-neutral-50 transition-colors ${selectedHod?.id === item.id ? 'bg-blue-50' : ''}`}>
              <td className="px-6 py-4 font-medium text-neutral-900">{item.name}</td>
              <td className="px-6 py-4">{item.department}</td>
              <td className="px-6 py-4 text-neutral-500">{item.submitted_at ? new Date(item.submitted_at).toLocaleDateString('en-GB') : '—'}</td>
              <td className="px-6 py-4 text-right">
                <button onClick={() => onSelect(item)} className="text-blue-600 hover:text-blue-800 font-medium text-sm">Review</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SuperAdminVerifyAccounts() {
  const [activeTab, setActiveTab] = useState<'companies' | 'hods'>('companies');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [companies, setCompanies] = useState<QueueItem[]>([]);
  const [hods, setHods] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<SubmissionDetail | null>(null);
  const [selectedHod, setSelectedHod] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [infoNote, setInfoNote] = useState('');
  const [showInfoInput, setShowInfoInput] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [tierCounts, setTierCounts] = useState<Record<string, number>>({});

  const fetchQueue = useCallback(async () => {
    try {
      const params: Record<string, string> = { status: 'pending' };
      if (tierFilter !== 'all') params.tier = tierFilter;
      const [compRes, hodRes] = await Promise.all([
        api.get('/admin/verification/queue', { params }),
        api.get('/admin/pending-hods'),
      ]);
      // Backend returns a PaginatedResponse — extract the items array
      const compItems: QueueItem[] = Array.isArray(compRes.data)
        ? compRes.data
        : (compRes.data?.items || []);
      const hodItems: any[] = Array.isArray(hodRes.data)
        ? hodRes.data
        : (hodRes.data?.items || []);
      setCompanies(compItems);
      setHods(hodItems);
      // Build tier counts
      const counts: Record<string, number> = {};
      compItems.forEach(c => {
        const k = String(c.tier);
        counts[k] = (counts[k] || 0) + 1;
      });
      setTierCounts(counts);
    } catch (err) {
      console.error('Failed to fetch queue', err);
    }
  }, [tierFilter]);

  useEffect(() => { fetchQueue(); }, [fetchQueue]);

  const openCompanyDetail = async (item: QueueItem) => {
    setLoadingDetail(true);
    setSelectedCompany(null);
    setShowRejectInput(false);
    setShowInfoInput(false);
    setRejectReason('');
    setInfoNote('');
    try {
      const res = await api.get(`/admin/verification/submissions/${item.submission_id}`);
      setSelectedCompany(res.data);
    } catch {
      setSelectedCompany({ ...item, payload: null, auto_check_result: null, reviewer_note: null,
        rep_phone: null, rep_job_title: null, email_verified: false, phone_verified: false,
        industry: null, company_size: null, state: null, lga: null, internship_description: null,
        is_individual_verified: false } as SubmissionDetail);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedCompany) return;
    setActionLoading(true);
    try {
      await api.post(`/admin/verification/submissions/${selectedCompany.submission_id}/approve`);
      setSelectedCompany(null);
      fetchQueue();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to approve');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedCompany || !rejectReason.trim()) return;
    setActionLoading(true);
    try {
      await api.post(`/admin/verification/submissions/${selectedCompany.submission_id}/reject`, { note: rejectReason });
      setSelectedCompany(null);
      setShowRejectInput(false);
      fetchQueue();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to reject');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestInfo = async () => {
    if (!selectedCompany || !infoNote.trim()) return;
    setActionLoading(true);
    try {
      await api.post(`/admin/verification/submissions/${selectedCompany.submission_id}/request-info`, { note: infoNote });
      setSelectedCompany(null);
      setShowInfoInput(false);
      fetchQueue();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to send request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleHodAction = async (action: 'verify' | 'reject') => {
    if (!selectedHod) return;
    setActionLoading(true);
    try {
      if (action === 'verify') {
        await api.post(`/admin/verify-hod/${selectedHod.id}`);
      } else {
        await api.post(`/admin/reject-hod/${selectedHod.id}`, { reason: rejectReason });
      }
      setSelectedHod(null);
      fetchQueue();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const totalPending = companies.length + hods.length;

  return (
    <div className="p-6 max-w-7xl mx-auto h-full flex flex-col relative">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Verify Accounts</h1>
        <p className="text-neutral-500 text-sm mt-1">Review and approve platform access requests. {totalPending > 0 && <span className="font-semibold text-blue-600">{totalPending} pending</span>}</p>
      </div>

      {/* Main tabs */}
      <div className="flex border-b border-neutral-200 mb-4">
        <button
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'companies' ? 'border-blue-600 text-blue-600' : 'border-transparent text-neutral-500 hover:text-neutral-700'}`}
          onClick={() => { setActiveTab('companies'); setSelectedCompany(null); setSelectedHod(null); }}
        >
          Companies {companies.length > 0 && <span className="ml-1.5 bg-blue-100 text-blue-700 text-xs font-bold px-1.5 py-0.5 rounded-full">{companies.length}</span>}
        </button>
        <button
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'hods' ? 'border-blue-600 text-blue-600' : 'border-transparent text-neutral-500 hover:text-neutral-700'}`}
          onClick={() => { setActiveTab('hods'); setSelectedCompany(null); setSelectedHod(null); }}
        >
          Heads of Department {hods.length > 0 && <span className="ml-1.5 bg-blue-100 text-blue-700 text-xs font-bold px-1.5 py-0.5 rounded-full">{hods.length}</span>}
        </button>
      </div>

      {/* Tier filter chips (companies only) */}
      {activeTab === 'companies' && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-none">
          {TIER_FILTERS.map(f => {
            const count = f.value === 'all' ? companies.length : (tierCounts[f.value] || 0);
            return (
              <button
                key={f.value}
                onClick={() => setTierFilter(f.value)}
                className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${tierFilter === f.value ? 'bg-blue-600 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}
              >
                {f.label}
                {count > 0 && <span className={`${tierFilter === f.value ? 'bg-white/20 text-white' : 'bg-neutral-200 text-neutral-600'} rounded-full px-1.5 py-0.5 text-[10px] font-bold`}>{count}</span>}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex flex-1 gap-6 overflow-hidden min-h-0">
        {/* Table */}
        <div className={`flex-1 bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden flex flex-col ${(selectedCompany || selectedHod) ? 'hidden lg:flex' : 'flex'}`}>
          {activeTab === 'companies' ? (
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-sm text-neutral-600">
                <thead className="text-xs text-neutral-500 uppercase bg-neutral-50 border-b border-neutral-200 sticky top-0">
                  <tr>
                    <th className="px-5 py-4 font-medium">Name</th>
                    <th className="px-5 py-4 font-medium">Level</th>
                    <th className="px-5 py-4 font-medium">Email</th>
                    <th className="px-5 py-4 font-medium">Submitted</th>
                    <th className="px-5 py-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {companies.length === 0 && (
                    <tr><td colSpan={5} className="px-5 py-12 text-center text-neutral-400 text-sm">No pending submissions</td></tr>
                  )}
                  {companies.map(item => (
                    <tr key={item.submission_id} className={`hover:bg-neutral-50 transition-colors ${selectedCompany?.submission_id === item.submission_id ? 'bg-blue-50' : ''}`}>
                      <td className="px-5 py-4 font-medium text-neutral-900">{item.company_name}</td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700 text-xs font-medium">
                          L{item.tier} — {TIER_NAMES[item.tier]}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-neutral-500 max-w-[180px] truncate">{item.rep_email}</td>
                      <td className="px-5 py-4 text-neutral-500">{item.submitted_at ? new Date(item.submitted_at).toLocaleDateString('en-GB') : '—'}</td>
                      <td className="px-5 py-4 text-right">
                        <button onClick={() => openCompanyDetail(item)} className="text-blue-600 hover:text-blue-800 font-medium text-sm">Review</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <HodList hods={hods} selectedHod={selectedHod} onSelect={setSelectedHod} />
          )}
        </div>

        {/* Company side panel */}
        {activeTab === 'companies' && (selectedCompany || loadingDetail) && (
          <div className="w-full lg:w-96 flex-shrink-0 bg-white rounded-xl shadow-lg border border-neutral-200 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-neutral-200 flex justify-between items-center bg-neutral-50">
              <h2 className="font-bold text-neutral-900 text-sm">Review request</h2>
              <button onClick={() => setSelectedCompany(null)} className="text-neutral-400 hover:text-neutral-600 text-xl leading-none">×</button>
            </div>

            {loadingDetail ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-neutral-200 border-t-blue-600 rounded-full animate-spin" />
              </div>
            ) : selectedCompany && (
              <>
                <div className="p-5 flex-1 overflow-y-auto space-y-5">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-neutral-900">{selectedCompany.company_name}</h3>
                      <p className="text-xs text-neutral-500 mt-0.5">L{selectedCompany.tier} — {TIER_NAMES[selectedCompany.tier]}</p>
                    </div>
                    <Link
                      to={`/super-admin/companies/${selectedCompany.company_id}`}
                      className="text-xs text-blue-600 hover:underline flex-shrink-0"
                    >
                      View full record →
                    </Link>
                  </div>

                  {/* Tier-specific content */}
                  {selectedCompany.tier === 1 && <L1Panel d={selectedCompany} />}
                  {selectedCompany.tier === 2 && <L2Panel d={selectedCompany} />}
                  {selectedCompany.tier === 3 && <L3Panel d={selectedCompany} />}
                  {selectedCompany.tier === 4 && <L4Panel d={selectedCompany} />}
                </div>

                {/* Actions */}
                <div className="p-4 border-t border-neutral-200 bg-neutral-50 space-y-3">
                  {selectedCompany.tier === 4 ? (
                    <div className="flex gap-2">
                      <button onClick={handleApprove} disabled={actionLoading}
                        className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium py-2 rounded-lg text-sm transition-colors">
                        Award partner status
                      </button>
                      <button disabled={actionLoading}
                        className="flex-1 bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-700 font-medium py-2 rounded-lg text-sm transition-colors">
                        Not yet
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={handleApprove} disabled={actionLoading}
                        className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium py-2 rounded-lg text-sm transition-colors">
                        {actionLoading ? '…' : 'Approve'}
                      </button>
                      <button onClick={() => setShowRejectInput(r => !r)} disabled={actionLoading}
                        className="flex-1 bg-white hover:bg-neutral-50 border border-neutral-200 text-red-600 font-medium py-2 rounded-lg text-sm transition-colors">
                        Reject
                      </button>
                    </div>
                  )}

                  {showRejectInput && (
                    <div className="space-y-2">
                      <textarea
                        className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-red-400"
                        placeholder="Reason for rejection…"
                        value={rejectReason}
                        onChange={e => setRejectReason(e.target.value)}
                      />
                      <button onClick={handleReject} disabled={!rejectReason.trim() || actionLoading}
                        className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-medium py-2 rounded-lg text-sm transition-colors">
                        Confirm rejection
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => setShowInfoInput(r => !r)}
                    className="w-full text-neutral-600 hover:text-neutral-900 border border-neutral-200 hover:bg-neutral-100 font-medium py-2 rounded-lg text-sm transition-colors"
                  >
                    Request more info
                  </button>

                  {showInfoInput && (
                    <div className="space-y-2">
                      <textarea
                        className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="What information is needed from the company?"
                        value={infoNote}
                        onChange={e => setInfoNote(e.target.value)}
                      />
                      <button onClick={handleRequestInfo} disabled={!infoNote.trim() || actionLoading}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2 rounded-lg text-sm transition-colors">
                        Send request
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* HOD side panel (unchanged structure) */}
        {activeTab === 'hods' && selectedHod && (
          <div className="w-full lg:w-96 flex-shrink-0 bg-white rounded-xl shadow-lg border border-neutral-200 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-neutral-200 flex justify-between items-center bg-neutral-50">
              <h2 className="font-bold text-neutral-900 text-sm">Review HOD</h2>
              <button onClick={() => setSelectedHod(null)} className="text-neutral-400 hover:text-neutral-600 text-xl leading-none">×</button>
            </div>
            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              <h3 className="font-bold text-neutral-900">{selectedHod.name}</h3>
              <div className="grid grid-cols-1 gap-2">
                <Field label="Department" value={selectedHod.department} />
                <Field label="Faculty" value={selectedHod.faculty} />
                <Field label="Staff ID" value={selectedHod.staff_id} />
                <Field label="Email" value={selectedHod.email} />
              </div>
            </div>
            <div className="p-4 border-t border-neutral-200 bg-neutral-50 flex gap-2">
              <button onClick={() => handleHodAction('verify')} disabled={actionLoading}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium py-2 rounded-lg text-sm transition-colors">
                Approve
              </button>
              <button onClick={() => { if (window.confirm('Reject this HOD?')) handleHodAction('reject'); }} disabled={actionLoading}
                className="flex-1 bg-white hover:bg-neutral-50 border border-neutral-200 text-red-600 font-medium py-2 rounded-lg text-sm transition-colors">
                Reject
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

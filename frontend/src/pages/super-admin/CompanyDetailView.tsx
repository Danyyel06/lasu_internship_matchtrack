import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../lib/axios';

interface VerificationEvent {
  id: number;
  created_at: string;
  actor_role: string | null;
  from_status: string | null;
  to_status: string | null;
  from_tier: number | null;
  to_tier: number | null;
  reason: string | null;
  tier: number | null;
}

interface Submission {
  tier: number;
  status: string;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewer_note: string | null;
}

interface CompanyDetail {
  id: number;
  company_name: string;
  trust_tier: number;
  tier_1_status: string;
  tier_2_status: string | null;
  tier_3_status: string | null;
  tier_4_status: string | null;
  is_suspended: boolean;
  suspension_reason: string | null;
  is_individual_verified: boolean;
  verification_method: string | null;
  industry: string | null;
  company_size: string | null;
  state: string | null;
  lga: string | null;
  created_at: string;
  submissions: Submission[];
  events: VerificationEvent[];
}

export default function CompanyDetailView() {
  const { id } = useParams<{ id: string }>();
  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showDowngradeModal, setShowDowngradeModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  
  // Forms
  const [downgradeTier, setDowngradeTier] = useState<string>('1');
  const [downgradeReason, setDowngradeReason] = useState('');
  const [suspendReason, setSuspendReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchCompany = async () => {
    try {
      const res = await api.get(`/admin/companies/${id}`);
      setCompany(res.data);
    } catch (err) {
      console.error('Failed to load company', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompany();
  }, [id]);

  const handleDowngrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;
    setActionLoading(true);
    try {
      await api.post(`/admin/companies/${id}/downgrade`, {
        target_tier: parseInt(downgradeTier, 10),
        reason: downgradeReason
      });
      setShowDowngradeModal(false);
      setDowngradeReason('');
      fetchCompany();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Downgrade failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;
    setActionLoading(true);
    try {
      await api.post(`/admin/companies/${id}/suspend`, {
        reason: suspendReason
      });
      setShowSuspendModal(false);
      setSuspendReason('');
      fetchCompany();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Suspend failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading company details...</div>;
  if (!company) return <div className="p-8 text-red-600">Company not found.</div>;

  const TIER_NAMES = ['Unknown', 'Registered', 'Verified', 'Accredited', 'LASU Partner'];

  const getTierHistory = (tierNum: number) => {
    const sub = company.submissions.find(s => s.tier === tierNum);
    const currentStatus = 
      tierNum === 1 ? company.tier_1_status :
      tierNum === 2 ? company.tier_2_status :
      tierNum === 3 ? company.tier_3_status : company.tier_4_status;
      
    return {
      status: currentStatus || 'Not started',
      submitted_at: sub?.submitted_at,
      reviewed_at: sub?.reviewed_at,
      reviewer_note: sub?.reviewer_note
    };
  };

  const statusColor = (status: string) => {
    if (status === 'approved') return 'bg-green-100 text-green-700';
    if (status === 'pending') return 'bg-amber-100 text-amber-700';
    if (status === 'info_requested') return 'bg-red-100 text-red-700';
    if (status === 'rejected') return 'bg-red-100 text-red-700';
    return 'bg-neutral-100 text-neutral-600';
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <Link to="/super-admin/verify" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mb-4">
          ← Back to verification queue
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-neutral-900">{company.company_name}</h1>
          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold">
            Tier {company.trust_tier} • {TIER_NAMES[company.trust_tier] || 'Unknown'}
          </span>
          {company.is_suspended && (
             <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-bold">Suspended</span>
          )}
        </div>
        <p className="text-sm text-neutral-500 mt-2">
          Joined {new Date(company.created_at).toLocaleDateString('en-GB')} • {company.industry || 'Unknown industry'}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left column: History Cards */}
        <div className="flex-1 space-y-4">
          <h2 className="text-xl font-bold text-neutral-900 mb-4">Verification History</h2>
          
          {[4, 3, 2, 1].map(tier => {
            const h = getTierHistory(tier);
            if (h.status === 'Not started' && tier > company.trust_tier + 1) return null; // Hide future locked tiers
            return (
              <div key={tier} className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-lg text-neutral-900">Level {tier} — {TIER_NAMES[tier]}</h3>
                    <p className="text-xs text-neutral-500">
                      Submitted: {h.submitted_at ? new Date(h.submitted_at).toLocaleDateString('en-GB') : 'N/A'}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${statusColor(h.status)}`}>
                    {h.status}
                  </span>
                </div>
                {h.reviewer_note && (
                  <div className="mt-3 bg-neutral-50 p-3 rounded text-sm text-neutral-700 border border-neutral-100">
                    <span className="font-semibold text-neutral-900">Admin note:</span> {h.reviewer_note}
                  </div>
                )}
                {h.reviewed_at && (
                  <p className="text-xs text-neutral-400 mt-2">
                    Decision recorded: {new Date(h.reviewed_at).toLocaleDateString('en-GB')}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Right column: Actions */}
        <div className="w-full lg:w-80 space-y-4">
          <h2 className="text-xl font-bold text-neutral-900 mb-4">Quick Actions</h2>
          
          <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm space-y-3">
            <button
              onClick={() => setShowDowngradeModal(true)}
              className="w-full text-left px-4 py-3 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded-lg text-sm font-semibold transition-colors"
            >
              Downgrade trust tier...
            </button>
            <button
              onClick={() => setShowSuspendModal(true)}
              disabled={company.is_suspended}
              className="w-full text-left px-4 py-3 bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50 border border-red-200 rounded-lg text-sm font-semibold transition-colors"
            >
              {company.is_suspended ? 'Account suspended' : 'Suspend account...'}
            </button>
          </div>

          <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-5 shadow-sm">
            <h3 className="font-bold text-sm text-neutral-900 mb-2">Company Metadata</h3>
            <div className="space-y-2 text-sm">
              <p><span className="text-neutral-500">Individual verified:</span> {company.is_individual_verified ? 'Yes' : 'No'}</p>
              <p><span className="text-neutral-500">Size:</span> {company.company_size || '—'}</p>
              <p><span className="text-neutral-500">Location:</span> {company.state}, {company.lga}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Event Log */}
      <div>
        <h2 className="text-xl font-bold text-neutral-900 mb-4">Audit Log</h2>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-4 py-3 font-medium text-neutral-500">Date</th>
                <th className="px-4 py-3 font-medium text-neutral-500">Actor</th>
                <th className="px-4 py-3 font-medium text-neutral-500">Action</th>
                <th className="px-4 py-3 font-medium text-neutral-500">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {company.events.map(ev => (
                <tr key={ev.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3 text-neutral-600 whitespace-nowrap">
                    {new Date(ev.created_at).toLocaleString('en-GB')}
                  </td>
                  <td className="px-4 py-3 text-neutral-900 font-medium">
                    {ev.actor_role || 'System'}
                  </td>
                  <td className="px-4 py-3">
                    {ev.from_tier !== ev.to_tier ? (
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-semibold">
                        Tier changed: {ev.from_tier} → {ev.to_tier}
                      </span>
                    ) : ev.from_status !== ev.to_status ? (
                      <span className="bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded text-xs font-semibold">
                        Status changed: {ev.from_status} → {ev.to_status} (L{ev.tier})
                      </span>
                    ) : (
                      <span className="bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded text-xs font-semibold">
                        Logged event
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-neutral-600 truncate max-w-xs" title={ev.reason || ''}>
                    {ev.reason || '—'}
                  </td>
                </tr>
              ))}
              {company.events.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-neutral-400">No events recorded.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Downgrade Modal */}
      {showDowngradeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-neutral-900 mb-2">Downgrade Trust Tier</h3>
            <p className="text-sm text-neutral-600 mb-4">
              Current tier: Level {company.trust_tier}. This will immediately restrict the company's capabilities.
            </p>
            <form onSubmit={handleDowngrade} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Target Tier</label>
                <select 
                  className="w-full border border-neutral-300 rounded p-2 text-sm"
                  value={downgradeTier}
                  onChange={e => setDowngradeTier(e.target.value)}
                >
                  {[1, 2, 3].map(t => (
                    t < company.trust_tier && <option key={t} value={t}>Level {t} — {TIER_NAMES[t]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Reason (Required)</label>
                <textarea 
                  required
                  rows={3}
                  className="w-full border border-neutral-300 rounded p-2 text-sm"
                  placeholder="Explain why this downgrade is necessary..."
                  value={downgradeReason}
                  onChange={e => setDowngradeReason(e.target.value)}
                />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowDowngradeModal(false)} className="px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded text-sm font-medium">Cancel</button>
                <button type="submit" disabled={actionLoading || !downgradeReason.trim()} className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded text-sm font-medium disabled:opacity-50">
                  Confirm Downgrade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Suspend Modal */}
      {showSuspendModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-red-600 mb-2">Suspend Account</h3>
            <p className="text-sm text-neutral-600 mb-4">
              This will lock the company out of the platform entirely. Use only for severe violations.
            </p>
            <form onSubmit={handleSuspend} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Suspension Reason (Required)</label>
                <textarea 
                  required
                  rows={3}
                  className="w-full border border-red-200 rounded p-2 text-sm focus:ring-red-500 focus:border-red-500"
                  placeholder="Detailed reason for suspension..."
                  value={suspendReason}
                  onChange={e => setSuspendReason(e.target.value)}
                />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowSuspendModal(false)} className="px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded text-sm font-medium">Cancel</button>
                <button type="submit" disabled={actionLoading || !suspendReason.trim()} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium disabled:opacity-50">
                  Suspend Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

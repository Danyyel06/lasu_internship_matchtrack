import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCompanyTier } from '../../lib/hooks/useCompanyTier';
import type { TierStatus } from '../../lib/hooks/useCompanyTier';
import api from '../../lib/axios';

// ─── Tier config ────────────────────────────────────────────────────────────

const TIER_META = [
  {
    tier: 1,
    name: 'Registered',
    tagline: 'Browse the student pool and access your dashboard',
    requirements: [
      'Organisation name and basic details',
      'Representative contact information',
      'Internship description',
      'Email and phone verified',
    ],
    note: null,
  },
  {
    tier: 2,
    name: 'Verified',
    tagline: 'Post up to 2 internship listings and receive applications',
    requirements: [
      'Business identity proof (one of 6 methods)',
      'Full business address',
      'Named internship supervisor',
    ],
    note: null,
  },
  {
    tier: 3,
    name: 'Accredited',
    tagline: 'Unlimited listings, competitive-track access, bulk intake',
    requirements: [
      'Certificate of Incorporation',
      'Representative government-issued ID',
      'Proof of business address',
      'Letter of authority',
    ],
    note: null,
  },
  {
    tier: 4,
    name: 'LASU Partner',
    tagline: 'Featured placement and priority matching weight',
    requirements: [],
    note: 'Awarded based on cycle performance, not documents',
  },
];

// ─── Status chip ─────────────────────────────────────────────────────────────

function StatusChip({ status, tier }: { status: string | null; tier: number }) {
  if (status === 'approved')
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">✓ Approved</span>;
  if (status === 'pending')
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">In review</span>;
  if (status === 'info_requested')
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">Needs attention</span>;
  if (status === 'available')
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">Available</span>;
  if (tier === 1)
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">Registered</span>;
  return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-500">Locked</span>;
}

// ─── Single tier card ─────────────────────────────────────────────────────────

function TierCard({ meta, tierData, isLocked, trustTier }: {
  meta: typeof TIER_META[0];
  tierData: TierStatus | undefined;
  isLocked: boolean;
  trustTier: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const status: string | null = tierData?.status ?? (meta.tier <= trustTier ? 'approved' : null);
  const canStart = !isLocked && (status === 'available' || status === 'info_requested' || (status === null && !isLocked));
  const showStart = canStart && meta.tier !== 4;

  const badgeRing = status === 'approved' ? 'bg-green-600 text-white'
    : status === 'pending' ? 'bg-amber-500 text-white'
    : status === 'info_requested' ? 'bg-red-600 text-white'
    : isLocked ? 'bg-neutral-200 text-neutral-400'
    : 'bg-blue-600 text-white';

  return (
    <div
      className={`bg-white border rounded-xl overflow-hidden transition-shadow ${isLocked ? 'border-neutral-100 opacity-60' : 'border-neutral-200 shadow-sm hover:shadow-md cursor-pointer'}`}
      onClick={() => !isLocked && setExpanded(e => !e)}
    >
      <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Left: badge + name */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${badgeRing}`}>
            {meta.tier}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-neutral-900">Level {meta.tier} — {meta.name}</h3>
              <StatusChip status={status} tier={meta.tier} />
            </div>
            <p className="text-sm text-neutral-500 mt-0.5">{meta.tagline}</p>
            {status === 'approved' && tierData?.approval_date && (
              <p className="text-xs text-green-600 mt-1">
                Approved {new Date(tierData.approval_date).toLocaleDateString('en-GB')}
              </p>
            )}
            {status === 'pending' && tierData?.submitted_at && (
              <p className="text-xs text-amber-600 mt-1">
                Submitted {new Date(tierData.submitted_at).toLocaleDateString('en-GB')}
              </p>
            )}
          </div>
        </div>

        {/* Right: CTA */}
        <div className="flex-shrink-0" onClick={e => e.stopPropagation()}>
          {showStart && (
            <button
              onClick={() => navigate(`/company/verification/tier-${meta.tier}`)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {status === 'info_requested' ? 'Respond to request' : `Start Level ${meta.tier} verification`}
            </button>
          )}
          {isLocked && (
            <span className="text-xs text-neutral-400">Complete Level {meta.tier - 1} first</span>
          )}
          {meta.tier === 4 && !isLocked && status !== 'approved' && (
            <button
              onClick={async (e) => { e.stopPropagation(); try { await api.post('/companies/verification/4/submit'); } catch {} }}
              className="px-4 py-2 border border-neutral-300 text-neutral-700 text-sm font-semibold rounded-lg hover:bg-neutral-50 transition-colors"
            >
              Request partner review
            </button>
          )}
        </div>
      </div>

      {/* Info requested callout */}
      {status === 'info_requested' && tierData?.reviewer_note && (
        <div className="mx-5 mb-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">Admin note</p>
          <p className="text-sm text-amber-800">{tierData.reviewer_note}</p>
        </div>
      )}

      {/* Expandable requirements */}
      {expanded && !isLocked && (
        <div className="px-5 pb-5 border-t border-neutral-100 pt-4">
          {meta.note && (
            <p className="text-sm text-neutral-500 italic mb-3">{meta.note}</p>
          )}
          {meta.requirements.length > 0 && (
            <ul className="space-y-2">
              {meta.requirements.map((req, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-neutral-600">
                  <span className={`mt-0.5 text-xs flex-shrink-0 ${status === 'approved' ? 'text-green-600' : 'text-neutral-400'}`}>
                    {status === 'approved' ? '✓' : '○'}
                  </span>
                  {req}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main VerificationCentre ─────────────────────────────────────────────────

export function VerificationCentre() {
  const { trustTier, tiers, isLoading, isSuspended } = useCompanyTier();

  if (isLoading) {
    return (
      <div className="p-8 flex items-center gap-3 text-neutral-500">
        <div className="w-5 h-5 border-2 border-neutral-300 border-t-blue-600 rounded-full animate-spin" />
        Loading verification status...
      </div>
    );
  }

  const getTierData = (n: number) => tiers.find(t => t.tier === n);

  // Build effective status for each tier
  const enrichedTiers = TIER_META.map(meta => {
    const td = getTierData(meta.tier);
    // If company is at trust_tier >= this tier, it's approved
    let status = td?.status ?? null;
    if (!status && meta.tier <= trustTier) status = 'approved';
    else if (!status && meta.tier === trustTier + 1) status = 'available';
    return { ...td, tier: meta.tier, status, name: meta.name, reviewer_note: td?.reviewer_note ?? null, approval_date: td?.approval_date ?? null, submission_id: td?.submission_id ?? null, submitted_at: null };
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Verification</h1>
        <p className="text-neutral-500 mt-1">Complete each level to unlock more platform capabilities.</p>
      </div>

      {isSuspended && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4">
          <p className="font-semibold text-red-700">Account suspended</p>
          <p className="text-sm text-red-600 mt-1">Your account has been suspended. Contact the LASU admin team for assistance.</p>
        </div>
      )}

      <div className="space-y-3">
        {TIER_META.map((meta, idx) => {
          const td = enrichedTiers[idx];
          const prevApproved = idx === 0 || enrichedTiers[idx - 1].status === 'approved';
          const isLocked = !prevApproved;
          return (
            <TierCard
              key={meta.tier}
              meta={meta}
              tierData={td as any}
              isLocked={isLocked}
              trustTier={trustTier}
            />
          );
        })}
      </div>
    </div>
  );
}

// ─── Tier 2 form ─────────────────────────────────────────────────────────────

const METHODS = [
  { value: 'cac_rc', label: 'CAC registration number (RC)', sublabel: 'For limited liability companies', icon: '🏢' },
  { value: 'cac_bn', label: 'CAC business name number (BN)', sublabel: 'For sole proprietorships and partnerships', icon: '🤝' },
  { value: 'tin', label: 'Tax Identification Number (TIN)', sublabel: 'Federal Inland Revenue Service', icon: '📋' },
  { value: 'professional_body', label: 'Professional body membership', sublabel: 'e.g. ICAN, NIM, NSE, NIA', icon: '🎓' },
  { value: 'referral', label: 'Referral', sublabel: 'From LASU department, accredited partner, or alumnus', icon: '🔗' },
  { value: 'individual_anchored', label: 'Individual-anchored', sublabel: 'NIN + government ID + address', icon: '👤' },
];

export function VerificationCentreTier2() {
  const navigate = useNavigate();
  const [method, setMethod] = useState('');
  const [methodValue, setMethodValue] = useState('');
  const [address, setAddress] = useState({ street: '', city: '', state: '' });
  const [supervisor, setSupervisor] = useState({ name: '', role: '', email: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const buildPayload = () => ({
    verification_method: method,
    method_value: methodValue,
    business_address: address,
    named_supervisor: supervisor,
  });

  const autosave = () => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    setSaving(true);
    saveTimeout.current = setTimeout(async () => {
      try { await api.post('/companies/verification/2/draft', { payload: buildPayload() }); }
      catch {}
      setSaving(false);
    }, 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!method) { setError('Please select a verification method'); return; }
    setSubmitting(true);
    setError('');
    try {
      await api.post('/companies/verification/2/submit', { payload: buildPayload() });
      navigate('/company/verification');
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <Link to="/company/verification" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mb-4">
          ← Back to verification
        </Link>
        <h1 className="text-2xl font-bold text-neutral-900">Level 2 verification — Business identity</h1>
        <p className="text-neutral-500 text-sm mt-1">
          Tell us how to verify your business. Choose whichever method applies to you.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8" onChange={autosave} noValidate>
        {/* Verification method selector */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-neutral-700 uppercase tracking-wide">How can we verify your business?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {METHODS.map(m => (
              <div
                key={m.value}
                onClick={() => { setMethod(m.value); setMethodValue(''); }}
                className={`cursor-pointer border-2 rounded-xl p-4 transition-all ${method === m.value ? 'border-blue-600 bg-blue-50' : 'border-neutral-200 bg-white hover:border-neutral-300'}`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl">{m.icon}</span>
                  <div>
                    <p className={`font-semibold text-sm ${method === m.value ? 'text-blue-900' : 'text-neutral-800'}`}>{m.label}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">{m.sublabel}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {method === 'individual_anchored' && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> Your profile will display "Individual-verified host" so students know what they're applying to.
              </p>
            </div>
          )}

          {method && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                {method === 'cac_rc' ? 'RC Number' :
                 method === 'cac_bn' ? 'BN Number' :
                 method === 'tin' ? 'TIN Number' :
                 method === 'professional_body' ? 'Body name and membership number' :
                 method === 'referral' ? 'Referrer name, role, and contact' :
                 'NIN and government ID details'}
              </label>
              <input
                className="w-full border border-neutral-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder={method === 'cac_rc' ? 'RC-123456' : method === 'cac_bn' ? 'BN-123456' : ''}
                value={methodValue}
                onChange={e => setMethodValue(e.target.value)}
              />
            </div>
          )}
        </section>

        <hr className="border-neutral-200" />

        {/* Business address */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-neutral-700 uppercase tracking-wide">Business address</h2>
          <input
            className="w-full border border-neutral-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            placeholder="Street address"
            value={address.street}
            onChange={e => setAddress(a => ({ ...a, street: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              className="w-full border border-neutral-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="City / LGA"
              value={address.city}
              onChange={e => setAddress(a => ({ ...a, city: e.target.value }))}
            />
            <input
              className="w-full border border-neutral-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="State"
              value={address.state}
              onChange={e => setAddress(a => ({ ...a, state: e.target.value }))}
            />
          </div>
        </section>

        <hr className="border-neutral-200" />

        {/* Named supervisor */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-neutral-700 uppercase tracking-wide">Named internship supervisor</h2>
          <p className="text-xs text-neutral-500">The person who will oversee interns day-to-day. They don't need to be on the platform yet.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input className="w-full border border-neutral-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="Full name" value={supervisor.name} onChange={e => setSupervisor(s => ({ ...s, name: e.target.value }))} />
            <input className="w-full border border-neutral-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="Job role" value={supervisor.role} onChange={e => setSupervisor(s => ({ ...s, role: e.target.value }))} />
            <input type="email" className="w-full border border-neutral-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="Work email" value={supervisor.email} onChange={e => setSupervisor(s => ({ ...s, email: e.target.value }))} />
            <input type="tel" className="w-full border border-neutral-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="Phone number" value={supervisor.phone} onChange={e => setSupervisor(s => ({ ...s, phone: e.target.value }))} />
          </div>
        </section>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}

        <div className="flex items-center justify-between">
          {saving && <span className="text-xs text-neutral-400">Saving draft…</span>}
          {!saving && <span />}
          <button type="submit" disabled={submitting}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors text-sm">
            {submitting ? 'Submitting…' : 'Submit for review'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Tier 3 form ─────────────────────────────────────────────────────────────

type DocType = 'incorporation_cert' | 'gov_id' | 'proof_of_address' | 'letter_of_authority' | 'tin_cert';

const DOC_SLOTS: { type: DocType; label: string; required: boolean }[] = [
  { type: 'incorporation_cert', label: 'Certificate of Incorporation', required: true },
  { type: 'gov_id', label: 'Representative government-issued ID', required: true },
  { type: 'proof_of_address', label: 'Proof of business address', required: true },
  { type: 'letter_of_authority', label: 'Letter of authority', required: true },
  { type: 'tin_cert', label: 'TIN certificate', required: false },
];

function DropZone({ label, required, docType, onUploaded }: {
  label: string; required: boolean; docType: string;
  onUploaded: (type: string, filename: string) => void;
}) {
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
  const [filename, setFilename] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    setStatus('uploading');
    const form = new FormData();
    form.append('file', file);
    form.append('doc_type', docType);
    try {
      await api.post('/companies/verification/3/documents', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setFilename(file.name);
      setStatus('done');
      onUploaded(docType, file.name);
    } catch {
      setStatus('error');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) upload(file);
  };

  return (
    <div
      className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${status === 'done' ? 'border-green-400 bg-green-50' : status === 'error' ? 'border-red-400 bg-red-50' : 'border-neutral-300 bg-neutral-50 hover:border-blue-400 hover:bg-blue-50'}`}
      onDragOver={e => e.preventDefault()}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input ref={inputRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png"
        onChange={e => { if (e.target.files?.[0]) upload(e.target.files[0]); }} />
      {status === 'done' ? (
        <div className="flex items-center justify-center gap-2 text-green-700">
          <span className="text-lg">✓</span>
          <span className="text-sm font-medium">{filename}</span>
        </div>
      ) : status === 'uploading' ? (
        <div className="flex items-center justify-center gap-2 text-blue-600">
          <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
          <span className="text-sm">Uploading…</span>
        </div>
      ) : (
        <div>
          <p className="text-sm font-medium text-neutral-700">
            {label} {required && <span className="text-red-500">*</span>}
          </p>
          <p className="text-xs text-neutral-400 mt-1">Drag & drop or click to browse — PDF, JPG, PNG</p>
        </div>
      )}
    </div>
  );
}

export function VerificationCentreTier3() {
  const navigate = useNavigate();
  const [uploaded, setUploaded] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const requiredDocs = DOC_SLOTS.filter(d => d.required).map(d => d.type);
  const allRequired = requiredDocs.every(t => uploaded[t]);

  const handleSubmit = async () => {
    if (!allRequired) { setError('Please upload all required documents before submitting.'); return; }
    setSubmitting(true);
    setError('');
    try {
      await api.post('/companies/verification/3/submit');
      navigate('/company/verification');
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <Link to="/company/verification" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mb-4">
          ← Back to verification
        </Link>
        <h1 className="text-2xl font-bold text-neutral-900">Level 3 verification — Documents</h1>
        <p className="text-neutral-500 text-sm mt-1">
          Upload your company documents. Files are stored securely and reviewed by LASU admin staff.
        </p>
      </div>

      <div className="space-y-3">
        {DOC_SLOTS.map(slot => (
          <DropZone
            key={slot.type}
            label={slot.label}
            required={slot.required}
            docType={slot.type}
            onUploaded={(type, name) => setUploaded(u => ({ ...u, [type]: name }))}
          />
        ))}
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}

      <div className="flex items-center justify-between">
        <p className="text-xs text-neutral-400">
          {Object.keys(uploaded).length}/{DOC_SLOTS.length} documents uploaded
        </p>
        <button
          onClick={handleSubmit}
          disabled={!allRequired || submitting}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors text-sm"
        >
          {submitting ? 'Submitting…' : 'Submit for review'}
        </button>
      </div>
    </div>
  );
}

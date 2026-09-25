import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../lib/axios';

const NIGERIAN_STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
  'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT – Abuja','Gombe',
  'Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos',
  'Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto',
  'Taraba','Yobe','Zamfara',
];

const INDUSTRIES = [
  'Software and Technology','Engineering and Manufacturing','Business and Management',
  'Finance and Accounting','Health and Life Sciences','Media and Communications',
  'Education and Social Services','Architecture and Built Environment',
  'Science and Research','Legal and Compliance','Other',
];

function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const chars = Array.from({ length: 6 }, (_, i) => (value && value[i]) || '');

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      const next = [...chars];
      if (next[i]) {
        next[i] = '';
      } else if (i > 0) {
        next[i - 1] = '';
        inputRefs.current[i - 1]?.focus();
      }
      onChange(next.join('').trimEnd());
    }
  };

  const handleChange = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    if (!val) {
      const next = [...chars];
      next[i] = '';
      onChange(next.join('').trimEnd());
      return;
    }
    const char = val.slice(-1);
    const next = [...chars];
    next[i] = char;
    onChange(next.join('').trimEnd());
    if (char && i < 5) {
      inputRefs.current[i + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pasted);
    const last = Math.min(pasted.length, 5);
    inputRefs.current[last]?.focus();
    e.preventDefault();
  };

  return (
    <div className="flex gap-2 justify-center" onPaste={handlePaste}>
      {Array.from({ length: 6 }, (_, i) => (
        <input
          key={i}
          ref={el => { inputRefs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={chars[i]}
          onChange={e => handleChange(i, e)}
          onKeyDown={e => handleKey(i, e)}
          className="w-11 h-14 text-center text-xl font-bold border-2 border-neutral-300 rounded-lg focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-colors"
          autoFocus={i === 0}
        />
      ))}
    </div>
  );
}

export default function CompanyOnboarding() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    company_name: '',
    industry: '',
    company_size: '',
    state: '',
    lga: '',
    first_name: '',
    last_name: '',
    rep_job_title: '',
    email: '',
    rep_phone: '',
    internship_description: '',
    password: '',
    confirm_password: '',
    agree_terms: false,
    agree_authorised: false,
    agree_consent: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpModal, setOtpModal] = useState<'hidden' | 'email' | 'phone'>('hidden');
  const [session, setSession] = useState<{ id: string; devEmail?: string; devPhone?: string } | null>(null);
  const [otp, setOtp] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');

  const set = (field: string, value: string | boolean) =>
    setFormData(prev => ({ ...prev, [field]: value }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!formData.company_name.trim()) e.company_name = 'Required';
    if (!formData.industry) e.industry = 'Required';
    if (!formData.company_size) e.company_size = 'Required';
    if (!formData.state) e.state = 'Required';
    if (!formData.lga.trim()) e.lga = 'Required';
    if (!formData.first_name.trim()) e.first_name = 'Required';
    if (!formData.last_name.trim()) e.last_name = 'Required';
    if (!formData.rep_job_title.trim()) e.rep_job_title = 'Required';
    if (!formData.email.trim()) e.email = 'Required';
    if (!formData.rep_phone.trim()) e.rep_phone = 'Required';
    if (formData.internship_description.length < 80) e.internship_description = 'Minimum 80 characters';
    if (formData.password.length < 8) e.password = 'Minimum 8 characters';
    if (formData.password !== formData.confirm_password) e.confirm_password = 'Passwords do not match';
    if (!formData.agree_terms) e.agree_terms = 'Required';
    if (!formData.agree_authorised) e.agree_authorised = 'Required';
    if (!formData.agree_consent) e.agree_consent = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setGeneralError('');
    try {
      const payload = {
        company_name: formData.company_name,
        industry: formData.industry,
        company_size: formData.company_size,
        state: formData.state,
        lga: formData.lga,
        first_name: formData.first_name,
        last_name: formData.last_name,
        rep_job_title: formData.rep_job_title,
        email: formData.email,
        rep_phone: formData.rep_phone,
        internship_description: formData.internship_description,
        password: formData.password,
        confirm_password: formData.confirm_password,
        agree_terms: formData.agree_terms,
        agree_authorised: formData.agree_authorised,
        agree_consent: formData.agree_consent,
      };
      const res = await api.post('/companies/onboarding/start', payload);
      setSession({ id: res.data.session_id, devEmail: res.data.dev_otp_email, devPhone: res.data.dev_otp_phone });
      setOtp(res.data.dev_otp_email || '');
      setOtpModal('email');
    } catch (err: any) {
      setGeneralError(err?.response?.data?.detail || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const verifyEmail = async () => {
    setOtpLoading(true);
    setOtpError('');
    try {
      await api.post('/companies/onboarding/verify-email', { session_id: session?.id, otp });
      setOtp(session?.devPhone || '');
      setOtpModal('phone');
    } catch (err: any) {
      setOtpError(err?.response?.data?.detail || 'Incorrect code. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const verifyPhone = async () => {
    setOtpLoading(true);
    setOtpError('');
    try {
      const res = await api.post('/companies/onboarding/verify-phone', { session_id: session?.id, otp });
      if (res.data.access_token) localStorage.setItem('access_token', res.data.access_token);
      if (res.data.refresh_token) localStorage.setItem('refresh_token', res.data.refresh_token);
      navigate('/company/dashboard');
    } catch (err: any) {
      setOtpError(err?.response?.data?.detail || 'Incorrect code. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const inputCls = (field: string) =>
    `w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors ${errors[field] ? 'border-red-400 bg-red-50' : 'border-neutral-300 bg-white'}`;

  return (
    <div className="min-h-screen bg-neutral-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <header className="flex justify-between items-center mb-10">
          <Link to="/" className="font-bold text-xl text-neutral-900 flex items-center gap-2">
            <img src="/lasu-logo.png" alt="LASU" className="w-8 h-8 object-contain" />
            LASU
          </Link>
          <Link to="/login" className="text-sm text-blue-600 hover:underline">Already have an account? Sign in</Link>
        </header>

        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-8 md:p-10">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Join as an internship host</h1>
          <p className="text-neutral-500 mb-8 leading-relaxed">
            Takes about three minutes. No documents needed to start — you'll add those later as you unlock more of the platform.
          </p>

          <form onSubmit={handleStart} className="space-y-8" noValidate>

            {/* Section: Organisation */}
            <section className="space-y-4">
              <h2 className="text-base font-semibold text-neutral-900">About your organisation</h2>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Organisation name</label>
                <input className={inputCls('company_name')} placeholder="e.g. Acme Digital Ltd" value={formData.company_name}
                  onChange={e => set('company_name', e.target.value)} />
                {errors.company_name && <p className="text-red-500 text-xs mt-1">{errors.company_name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Industry sector</label>
                <select className={inputCls('industry')} value={formData.industry} onChange={e => set('industry', e.target.value)}>
                  <option value="">Select industry...</option>
                  {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
                {errors.industry && <p className="text-red-500 text-xs mt-1">{errors.industry}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Company size</label>
                <select className={inputCls('company_size')} value={formData.company_size} onChange={e => set('company_size', e.target.value)}>
                  <option value="">Select size...</option>
                  <option value="1-4">1–4 employees</option>
                  <option value="5-10">5–10 employees</option>
                  <option value="11-50">11–50 employees</option>
                  <option value="51-200">51–200 employees</option>
                  <option value="201-500">201–500 employees</option>
                  <option value="500+">500+ employees</option>
                </select>
                {errors.company_size && <p className="text-red-500 text-xs mt-1">{errors.company_size}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">State</label>
                  <select className={inputCls('state')} value={formData.state} onChange={e => set('state', e.target.value)}>
                    <option value="">Select state...</option>
                    {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Local government area</label>
                  <input className={inputCls('lga')} placeholder="e.g. Ikeja" value={formData.lga}
                    onChange={e => set('lga', e.target.value)} />
                  {errors.lga && <p className="text-red-500 text-xs mt-1">{errors.lga}</p>}
                </div>
              </div>
            </section>

            <hr className="border-neutral-200" />

            {/* Section: You */}
            <section className="space-y-4">
              <h2 className="text-base font-semibold text-neutral-900">About you</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">First name</label>
                  <input className={inputCls('first_name')} value={formData.first_name} onChange={e => set('first_name', e.target.value)} />
                  {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Last name</label>
                  <input className={inputCls('last_name')} value={formData.last_name} onChange={e => set('last_name', e.target.value)} />
                  {errors.last_name && <p className="text-red-500 text-xs mt-1">{errors.last_name}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Job title / role</label>
                <input className={inputCls('rep_job_title')} placeholder="e.g. HR Manager, CEO, Operations Lead" value={formData.rep_job_title}
                  onChange={e => set('rep_job_title', e.target.value)} />
                {errors.rep_job_title && <p className="text-red-500 text-xs mt-1">{errors.rep_job_title}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Work email</label>
                <input type="email" className={inputCls('email')} placeholder="you@company.com" value={formData.email}
                  onChange={e => set('email', e.target.value)} />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Phone number</label>
                <input type="tel" className={inputCls('rep_phone')} placeholder="+234 800 000 0000" value={formData.rep_phone}
                  onChange={e => set('rep_phone', e.target.value)} />
                {errors.rep_phone && <p className="text-red-500 text-xs mt-1">{errors.rep_phone}</p>}
              </div>
            </section>

            <hr className="border-neutral-200" />

            {/* Section: Internship description — visually prominent */}
            <section className="bg-blue-50 border border-blue-100 rounded-xl p-6 space-y-3">
              <h2 className="text-base font-semibold text-neutral-900">What would an intern actually do here?</h2>
              <textarea
                className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors resize-none bg-white ${errors.internship_description ? 'border-red-400' : 'border-blue-200'}`}
                rows={4}
                placeholder="Describe the real day-to-day work. What projects would they join? What skills would they use? Who would they work with?"
                value={formData.internship_description}
                onChange={e => set('internship_description', e.target.value)}
              />
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs text-blue-700">
                  2–3 sentences describing the real work. This is what students read when deciding to apply — be specific.
                </p>
                <span className={`text-xs font-medium flex-shrink-0 ${formData.internship_description.length < 80 ? 'text-red-500' : 'text-green-600'}`}>
                  {formData.internship_description.length} / 80 min
                </span>
              </div>
              {errors.internship_description && <p className="text-red-500 text-xs">{errors.internship_description}</p>}
            </section>

            <hr className="border-neutral-200" />

            {/* Section: Account */}
            <section className="space-y-4">
              <h2 className="text-base font-semibold text-neutral-900">Your account</h2>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className={inputCls('password') + ' pr-10'}
                    placeholder="Minimum 8 characters"
                    value={formData.password}
                    onChange={e => set('password', e.target.value)}
                  />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                    onClick={() => setShowPassword(p => !p)}>
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Confirm password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    className={inputCls('confirm_password') + ' pr-10'}
                    placeholder="Re-enter your password"
                    value={formData.confirm_password}
                    onChange={e => set('confirm_password', e.target.value)}
                  />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                    onClick={() => setShowConfirmPassword(p => !p)}>
                    {showConfirmPassword ? '🙈' : '👁️'}
                  </button>
                </div>
                {errors.confirm_password && <p className="text-red-500 text-xs mt-1">{errors.confirm_password}</p>}
              </div>
            </section>

            <hr className="border-neutral-200" />

            {/* Section: Agreements */}
            <section className="space-y-3">
              <h2 className="text-base font-semibold text-neutral-900">Agreements</h2>

              {[
                { field: 'agree_terms', label: 'I agree to the LASU SIWES Partner Terms of Service and confirm all information provided is accurate.' },
                { field: 'agree_authorised', label: 'My organisation is legally authorised to host interns in Nigeria and will comply with Nigerian labour law and SIWES guidelines.' },
                { field: 'agree_consent', label: 'I consent to LASU using my information for verification, matching, and platform administration (NDPR compliance).' },
              ].map(({ field, label }) => (
                <div key={field}>
                  <label className={`flex items-start gap-3 cursor-pointer ${errors[field] ? 'text-red-600' : 'text-neutral-700'}`}>
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-600 flex-shrink-0"
                      checked={formData[field as keyof typeof formData] as boolean}
                      onChange={e => set(field, e.target.checked)}
                    />
                    <span className="text-sm leading-relaxed">{label}</span>
                  </label>
                  {errors[field] && <p className="text-red-500 text-xs mt-1 ml-7">{errors[field]}</p>}
                </div>
              ))}
            </section>

            {generalError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{generalError}</div>
            )}

            <div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors text-sm"
              >
                {submitting ? 'Creating account...' : 'Create account'}
              </button>
              <p className="text-xs text-center text-neutral-400 mt-3">
                We'll verify your email and phone, then you can set up your company profile.
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* OTP Modal */}
      {otpModal !== 'hidden' && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">{otpModal === 'email' ? '📧' : '📱'}</div>
              <h3 className="text-xl font-bold text-neutral-900">Verify your {otpModal}</h3>
              <p className="text-sm text-neutral-500 mt-1">
                We sent a 6-digit code to{' '}
                <span className="font-medium text-neutral-800">
                  {otpModal === 'email' ? formData.email : formData.rep_phone}
                </span>
              </p>
            </div>

            <div className="mb-4">
              <OtpInput value={otp} onChange={setOtp} />
            </div>

            {session && (session.devEmail || session.devPhone) && (
              <div 
                className="mb-4 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-center cursor-pointer hover:bg-amber-100 transition-colors"
                onClick={() => {
                  const code = otpModal === 'email' ? session.devEmail : session.devPhone;
                  if (code) {
                    setOtp(code);
                    setOtpError('');
                  }
                }}
              >
                <p className="text-xs text-amber-700 font-medium">
                  Dev mode — OTP:{' '}
                  <span className="font-mono text-base tracking-widest font-bold">
                    {otpModal === 'email' ? session.devEmail : session.devPhone}
                  </span>
                  <span className="block text-[10px] text-amber-600 mt-0.5">(click to auto-fill)</span>
                </p>
              </div>
            )}

            {otpError && <p className="text-red-500 text-sm text-center mb-3">{otpError}</p>}

            <button
              onClick={otpModal === 'email' ? verifyEmail : verifyPhone}
              disabled={otp.length < 6 || otpLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors text-sm"
            >
              {otpLoading ? 'Verifying...' : `Verify ${otpModal}`}
            </button>

            <button
              type="button"
              className="w-full text-neutral-500 hover:text-neutral-700 text-sm mt-3 py-1"
              onClick={() => { setOtp(''); setOtpError(''); }}
            >
              Resend code
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

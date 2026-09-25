import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api/v1` : '/api/v1';

interface UserInfo {
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

type PageState = 'loading' | 'ready' | 'invalid_token' | 'already_activated' | 'success';

export default function AccountActivation() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [pageState, setPageState] = useState<PageState>('loading');
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const hasLength = password.length >= 8;
  const hasSymbol = /[0-9!@#$%^&*]/.test(password);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  // On mount: validate the token and fetch real user data
  useEffect(() => {
    if (!token) {
      setPageState('invalid_token');
      return;
    }

    axios
      .get(`${API_BASE}/auth/activate/verify`, { params: { token } })
      .then((res) => {
        setUserInfo(res.data);
        setPageState('ready');
      })
      .catch((err) => {
        const detail = err.response?.data?.detail ?? '';
        if (detail.includes('already been activated')) {
          setPageState('already_activated');
        } else {
          setPageState('invalid_token');
        }
      });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!hasLength || !hasSymbol) {
      setErrorMsg('Password does not meet the requirements below.');
      return;
    }
    if (!passwordsMatch) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await axios.post(`${API_BASE}/auth/activate`, {
        token,
        password,
      });

      // Store the real JWT tokens
      localStorage.setItem('access_token', res.data.access_token);
      localStorage.setItem('refresh_token', res.data.refresh_token);

      setPageState('success');
      setTimeout(() => navigate('/academic-supervisor/home'), 1500);
    } catch (err: any) {
      const detail = err.response?.data?.detail ?? 'Activation failed. Please try again.';
      setErrorMsg(detail);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (pageState === 'loading') {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col justify-center items-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-neutral-500 text-sm">Verifying your invitation link…</p>
      </div>
    );
  }

  // ── Invalid / expired token ───────────────────────────────────────────────
  if (pageState === 'invalid_token') {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow-sm border border-neutral-200 sm:rounded-2xl sm:px-10 text-center">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="text-xl font-bold text-neutral-900 mb-2">Invalid Activation Link</h2>
            <p className="text-neutral-500 text-sm mb-6">
              This link is invalid or has already been used. Please ask your Head of Department to
              resend the invitation.
            </p>
            <a href="/login" className="text-blue-600 text-sm font-medium hover:underline">
              Go to Login →
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ── Already activated ────────────────────────────────────────────────────
  if (pageState === 'already_activated') {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow-sm border border-neutral-200 sm:rounded-2xl sm:px-10 text-center">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">✅</span>
            </div>
            <h2 className="text-xl font-bold text-neutral-900 mb-2">Account Already Active</h2>
            <p className="text-neutral-500 text-sm mb-6">
              Your account has already been activated. Please log in using your email and password.
            </p>
            <a
              href="/login"
              className="inline-block bg-neutral-900 hover:bg-black text-white font-medium py-2 px-6 rounded-xl transition-colors text-sm"
            >
              Go to Login
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ── Success screen ───────────────────────────────────────────────────────
  if (pageState === 'success') {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow-sm border border-neutral-200 sm:rounded-2xl sm:px-10 text-center">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🎉</span>
            </div>
            <h2 className="text-xl font-bold text-neutral-900 mb-2">Account Activated!</h2>
            <p className="text-neutral-500 text-sm">Redirecting you to your dashboard…</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Main activation form ─────────────────────────────────────────────────
  const initials = userInfo
    ? `${userInfo.first_name[0]}${userInfo.last_name[0]}`.toUpperCase()
    : '??';

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">InternLink</h1>
        </div>

        <div className="bg-white py-8 px-4 shadow-sm border border-neutral-200 sm:rounded-2xl sm:px-10">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-neutral-900">Activate Your Account</h2>
            <p className="text-sm text-neutral-500 mt-2">
              Welcome to the Academic Supervisor Portal. Please verify your details and set a secure
              password to activate your access.
            </p>
          </div>

          {/* User info card */}
          {userInfo && (
            <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-100 flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold flex-shrink-0">
                {initials}
              </div>
              <div>
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-0.5">
                  NAME
                </p>
                <p className="font-bold text-neutral-900 mb-2">
                  {userInfo.first_name} {userInfo.last_name}
                </p>
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-0.5">
                  EMAIL
                </p>
                <p className="text-sm font-medium text-neutral-900">{userInfo.email}</p>
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Create Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border border-neutral-300 rounded-xl shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 text-neutral-500 hover:text-neutral-700"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`appearance-none block w-full px-4 py-3 border rounded-xl shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    confirmPassword.length > 0 && !passwordsMatch
                      ? 'border-red-400 bg-red-50'
                      : 'border-neutral-300'
                  }`}
                  required
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 text-neutral-500 hover:text-neutral-700"
                >
                  {showConfirm ? 'Hide' : 'Show'}
                </button>
              </div>
              {confirmPassword.length > 0 && !passwordsMatch && (
                <p className="text-red-500 text-xs mt-1">Passwords do not match.</p>
              )}
            </div>

            {/* Password requirements */}
            <div className="bg-neutral-50 rounded-lg p-4 text-sm border border-neutral-100">
              <p className="font-medium text-neutral-700 mb-2">Password must contain:</p>
              <ul className="space-y-1">
                <li
                  className={`flex items-center gap-2 ${hasLength ? 'text-green-600' : 'text-neutral-500'}`}
                >
                  <span>{hasLength ? '✓' : '○'}</span> Minimum 8 characters
                </li>
                <li
                  className={`flex items-center gap-2 ${hasSymbol ? 'text-green-600' : 'text-neutral-500'}`}
                >
                  <span>{hasSymbol ? '✓' : '○'}</span> Include at least one number or symbol
                </li>
              </ul>
            </div>

            {/* Error message */}
            {errorMsg && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                {errorMsg}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isSubmitting || !hasLength || !hasSymbol || !passwordsMatch}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-neutral-900 hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Activating…
                  </>
                ) : (
                  'Activate Account →'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-neutral-500">
              By activating, you agree to the Portal Terms of Service.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

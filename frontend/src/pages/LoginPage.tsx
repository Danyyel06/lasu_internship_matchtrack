import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function LoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await axios.post(`${API_BASE}/api/v1/auth/login`, {
        email: formData.email,
        password: formData.password,
      });

      // Store tokens
      localStorage.setItem('access_token', res.data.access_token);
      localStorage.setItem('refresh_token', res.data.refresh_token);

      // Decode JWT to get role and onboarded status
      const payload = JSON.parse(atob(res.data.access_token.split('.')[1]));
      const role = payload.role || 'student';
      const isOnboarded = payload.is_onboarded === true || payload.is_onboarded === 'true';

      // Navigate based on role and onboarding status
      switch (role) {
        case 'student':
          navigate(isOnboarded ? '/student/dashboard' : '/student/onboarding');
          break;
        case 'company_rep':
          navigate(isOnboarded ? '/company/dashboard' : '/company/onboarding');
          break;
        case 'industry_supervisor':
          navigate('/supervisor/dashboard');
          break;
        case 'head_of_department':
          navigate('/hod/home');
          break;
        case 'academic_supervisor':
          navigate('/academic-supervisor/home');
          break;
        case 'super_admin':
          navigate('/admin/dashboard');
          break;
        default:
          navigate('/');
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (typeof detail === 'string') {
          setError(detail);
        } else if (Array.isArray(detail)) {
          // Handle FastAPI 422 validation errors array
          setError(`Validation error: ${detail[0].msg}`);
        } else {
          setError('An unexpected error occurred.');
        }
      } else {
        setError('Unable to sign in. Please check your credentials and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 font-sans flex flex-col">
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-12">
        {/* Card */}
        <div className="w-full max-w-md">
          {/* Back link */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700 transition-colors mb-8"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Sign in to LIMDP
          </Link>

          {/* Heading */}
          <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-2">
            Welcome back.
          </h1>
          <p className="text-neutral-500 text-sm mb-8 leading-relaxed">
            Enter your credentials — the system will recognise your role automatically.
          </p>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-danger-50 border border-danger-light/30 text-danger rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email / Username Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-900 mb-2">
                Username or email
              </label>
              <input
                type="text"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="e.g. john.doe or john@student.lasu.edu.ng"
                className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-shadow bg-white"
                required
              />
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-sm font-medium text-neutral-900">
                  Password
                </label>
                <button type="button" className="text-xs text-neutral-500 hover:text-neutral-700 transition-colors">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 pr-12 border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-shadow bg-white"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-violet-600 to-violet-800 hover:from-violet-700 hover:to-violet-900 text-white font-semibold py-3.5 rounded-xl text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-violet-900/20"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-neutral-50 px-4 text-neutral-400 font-semibold uppercase tracking-wider">
                New here?
              </span>
            </div>
          </div>

          {/* Create Account */}
          <Link
            to="/signup"
            className="flex items-center justify-center w-full border-2 border-neutral-200 hover:border-neutral-300 text-neutral-700 font-semibold py-3.5 rounded-xl text-sm transition-colors gap-2"
          >
            Create an account
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>

          {/* Footer Note */}
          <div className="mt-8 text-center space-y-2">
            <p className="text-xs text-neutral-400">
              Your role is detected automatically after sign in.
            </p>
            <p className="text-xs text-neutral-400">
              Need help?{' '}
              <a href="mailto:siwes@lasu.edu.ng" className="text-neutral-600 hover:text-neutral-800 underline transition-colors">
                Contact SIWES support
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

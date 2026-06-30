import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function CompanySignUp() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const [formData, setFormData] = useState({
    company_name: '',
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirm_password: '',
    agreed_to_terms: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.company_name || !formData.first_name || !formData.last_name || !formData.email || !formData.password || !formData.confirm_password) {
      setError('Please fill in all required fields.');
      return;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match.');
      return;
    }
    if (!formData.agreed_to_terms) {
      setError('You must agree to the terms to continue.');
      return;
    }

    setLoading(true);
    try {
      // Create company account via the new endpoint that backend is building
      await axios.post(`${API_BASE}/api/v1/companies/register`, {
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        company_name: formData.company_name,
      });

      setIsSuccess(true);
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('An error occurred during registration. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-neutral-50 font-sans flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center border border-neutral-200 shadow-sm">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">Account Created!</h2>
          <p className="text-neutral-500 text-sm mb-6 leading-relaxed">
            Your company account has been created. Log in to complete your organization's profile.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 font-sans flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Back link */}
        <div className="mb-8">
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back
          </Link>
        </div>

        {/* Badge */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 text-green-700 text-xs font-semibold uppercase tracking-wider mb-6 border border-green-100">
            <span>🏢</span> Company Registration
          </div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Create an Account</h1>
          <p className="text-neutral-500 text-sm">Join the platform to recruit top pre-verified talent.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-danger-50 border border-danger-light/30 text-danger-dark rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Form wrapper */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-900">Company / Organization Name *</label>
              <input
                type="text"
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                placeholder="e.g. Acme Corp"
                className="w-full p-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-green-600 focus:border-transparent outline-none text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-neutral-900">Rep First Name *</label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="e.g. John"
                  className="w-full p-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-green-600 focus:border-transparent outline-none text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-neutral-900">Rep Last Name *</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="e.g. Doe"
                  className="w-full p-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-green-600 focus:border-transparent outline-none text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-900">Work Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="john.doe@company.com"
                className="w-full p-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-green-600 focus:border-transparent outline-none text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-neutral-900">Password *</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min 8 characters"
                  className="w-full p-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-green-600 focus:border-transparent outline-none text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-neutral-900">Confirm Password *</label>
                <input
                  type="password"
                  name="confirm_password"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  placeholder="Re-type password"
                  className="w-full p-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-green-600 focus:border-transparent outline-none text-sm"
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative flex items-center justify-center mt-0.5">
                  <input
                    type="checkbox"
                    name="agreed_to_terms"
                    checked={formData.agreed_to_terms}
                    onChange={handleChange}
                    className="w-5 h-5 appearance-none border-2 border-neutral-300 rounded bg-white checked:bg-green-600 checked:border-green-600 transition-colors peer cursor-pointer"
                  />
                  <svg
                    className="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm text-neutral-500 leading-relaxed select-none">
                  I agree to the platform's <a href="#" className="text-green-600 hover:text-green-700 font-medium hover:underline">Terms of Service</a> and <a href="#" className="text-green-600 hover:text-green-700 font-medium hover:underline">Privacy Policy</a>.
                </span>
              </label>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? 'Creating Account...' : 'Create Company Account'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function SuperAdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await axios.post('http://localhost:8000/api/v1/auth/login', {
        email: email,
        password: password
      });

      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('refresh_token', response.data.refresh_token);
      
      // If super admin, go to super admin dashboard
      navigate('/super-admin/dashboard');
    } catch (err: any) {
      let errorMsg = 'Invalid credentials';
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') {
        errorMsg = detail;
      } else if (Array.isArray(detail) && detail.length > 0) {
        errorMsg = detail[0].msg;
      }
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="p-8">
          <div className="flex justify-center mb-8">
            <div className="flex items-center gap-2">
              <img src="/lasu-logo.png" alt="LASU Logo" className="w-12 h-12 object-contain" />
              <span className="text-2xl font-bold text-neutral-900 tracking-tight">LASU<span className="text-blue-600">Admin</span></span>
            </div>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-neutral-900 mb-2">Super Admin Login</h2>
            <p className="text-neutral-600">Secure access to platform administration.</p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Official Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                placeholder="admin@lasu.edu.ng"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all pr-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 font-medium text-sm"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-colors disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? 'Authenticating...' : 'Log In'}
            </button>
          </form>
          
          <div className="mt-8 pt-6 border-t border-neutral-100 text-center">
            <p className="text-xs text-neutral-500">
              Restricted access. This area is strictly for designated system administrators.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

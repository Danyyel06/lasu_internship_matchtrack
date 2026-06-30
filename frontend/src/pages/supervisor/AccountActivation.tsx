import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function AccountActivation() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleActivate = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    // Mock activation process
    localStorage.setItem('access_token', 'mock_token');
    navigate('/supervisor/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-neutral-200 p-8">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <img src="/lasu-logo.png" alt="LASU Logo" className="w-10 h-10 object-contain" />
            <span className="text-2xl font-bold tracking-tight text-neutral-900">
              LASU<span className="text-blue-600">Supervisor</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-neutral-900">Activate Your Account</h1>
          <p className="text-neutral-600 mt-2">Welcome to the LASU Internship Platform</p>
        </div>

        <form onSubmit={handleActivate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Full Name</label>
            <input
              type="text"
              value="Dr. Adebayo Ojo"
              readOnly
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg bg-neutral-100 text-neutral-600 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Email Address</label>
            <input
              type="email"
              value="adebayo.ojo@example.com"
              readOnly
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg bg-neutral-100 text-neutral-600 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Create Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-shadow"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Confirm Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-shadow"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors mt-6"
          >
            Activate Account
          </button>
        </form>
      </div>
    </div>
  );
}

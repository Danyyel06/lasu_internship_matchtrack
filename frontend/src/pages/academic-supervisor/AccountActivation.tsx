import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AccountActivation() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const hasLength = password.length >= 8;
  const hasSymbol = /[0-9!@#$%^&*]/.test(password);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === confirmPassword && hasLength && hasSymbol) {
      alert('Account activated successfully!');
      navigate('/academic-supervisor/home');
    }
  };

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
              Welcome to the Academic Supervisor Portal. Please verify your details below and set a secure password to activate your access.
            </p>
          </div>

          <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-100 flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
              AB
            </div>
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-0.5">NAME</p>
              <p className="font-bold text-neutral-900 mb-2">Dr. Amina Balogun</p>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-0.5">EMAIL</p>
              <p className="text-sm font-medium text-neutral-900">a.balogun@lasu.edu.ng</p>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Create Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border border-neutral-300 rounded-xl shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 text-neutral-500 hover:text-neutral-700"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border border-neutral-300 rounded-xl shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 text-neutral-500 hover:text-neutral-700"
                >
                  {showConfirm ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="bg-neutral-50 rounded-lg p-4 text-sm border border-neutral-100">
              <p className="font-medium text-neutral-700 mb-2">Password must contain:</p>
              <ul className="space-y-1">
                <li className={`flex items-center gap-2 ${hasLength ? 'text-green-600' : 'text-neutral-500'}`}>
                  <span>{hasLength ? '✓' : '○'}</span> Minimum 8 characters
                </li>
                <li className={`flex items-center gap-2 ${hasSymbol ? 'text-green-600' : 'text-neutral-500'}`}>
                  <span>{hasSymbol ? '✓' : '○'}</span> Include at least one number or symbol
                </li>
              </ul>
            </div>

            <div>
              <button
                type="submit"
                disabled={!hasLength || !hasSymbol || password !== confirmPassword}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-neutral-900 hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Activate Account →
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

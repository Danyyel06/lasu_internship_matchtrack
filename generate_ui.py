import os

def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

write_file('frontend/src/pages/register/CompanySignUp.tsx', """import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function CompanySignUp() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Navigate to post-login wizard
    navigate('/company/onboarding');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">Company Registration</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input type="text" required className="w-full px-3 py-2 border rounded-lg" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Work Email</label>
            <input type="email" required className="w-full px-3 py-2 border rounded-lg" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" required className="w-full px-3 py-2 border rounded-lg" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
          </div>
          <button type="submit" className="w-full py-2 bg-green-700 text-white rounded-lg font-medium hover:bg-green-800">Sign Up</button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account? <Link to="/login" className="text-green-700 font-medium">Log in</Link>
        </p>
      </div>
    </div>
  );
}
""")

print("Done")

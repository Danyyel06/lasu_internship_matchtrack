import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function HodRegistration() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    title: '',
    faculty: '',
    department: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate API call
    setTimeout(() => {
      setSubmitted(true);
    }, 1000);
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto mt-12 bg-white p-8 rounded-xl shadow-sm border border-neutral-200 text-center">
        <div className="w-16 h-16 bg-success-50 text-success-dark rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
          ✓
        </div>
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">Registration Submitted</h1>
        <p className="text-neutral-600 mb-6">
          Your account is currently under review by the University Super Admin. It will be activated within 48 hours once verified.
        </p>
        <button
          onClick={() => navigate('/hod/home')}
          className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-8 bg-white p-8 rounded-xl shadow-sm border border-neutral-200">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">Head of Department Registration</h1>
        <p className="text-neutral-500 mt-1">Register to manage internship placements for your department.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Prof. Olatunde"
              className="w-full p-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Official Title</label>
            <input
              type="text"
              required
              placeholder="e.g. HOD Computer Science"
              className="w-full p-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Faculty</label>
            <select
              required
              className="w-full p-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.faculty}
              onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
            >
              <option value="">Select Faculty</option>
              <option value="Science">Science</option>
              <option value="Engineering">Engineering</option>
              <option value="Management">Management Sciences</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Department</label>
            <input
              type="text"
              required
              placeholder="e.g. Computer Science"
              className="w-full p-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Official University Email</label>
            <input
              type="email"
              required
              placeholder="e.g. name@lasu.edu.ng"
              className="w-full p-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Phone Number</label>
            <input
              type="tel"
              required
              placeholder="+234"
              className="w-full p-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Upload Staff ID or Confirmation Letter</label>
          <input
            type="file"
            className="w-full p-2 border border-neutral-300 rounded-lg bg-neutral-50 text-sm"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Password</label>
            <input
              type="password"
              required
              className="w-full p-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Confirm Password</label>
            <input
              type="password"
              required
              className="w-full p-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors mt-4"
        >
          Submit Registration
        </button>
      </form>
    </div>
  );
}

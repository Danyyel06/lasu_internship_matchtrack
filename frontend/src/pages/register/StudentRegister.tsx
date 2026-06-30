import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function StudentRegister() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    matric_no: '',
    faculty: '',
    department: '',
    year_of_study: '',
    cgpa: '',
    username: '',
    password: '',
    confirm_password: '',
    agreed_to_terms: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    });
    setError('');
  };

  const nextStep = () => {
    setError('');
    // Validation for Step 1
    if (currentStep === 1) {
      if (!formData.first_name || !formData.last_name || !formData.email || !formData.matric_no) {
        setError('Please fill in all required fields.');
        return;
      }
      if (!formData.email.endsWith('@student.lasu.edu.ng')) {
        setError('Please use a valid LASU student email (@student.lasu.edu.ng)');
        return;
      }
    }
    // Validation for Step 2
    if (currentStep === 2) {
      if (!formData.faculty || !formData.department || !formData.year_of_study) {
        setError('Please fill in all required fields.');
        return;
      }
    }
    
    setCurrentStep((prev) => prev + 1);
  };

  const prevStep = () => setCurrentStep((prev) => prev - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep !== 3) return;
    
    setError('');
    if (!formData.username || !formData.password || !formData.confirm_password) {
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
      // Create account
      await axios.post(`${API_BASE}/api/v1/auth/register`, {
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        role: 'student',
        matric_no: formData.matric_no,
        faculty: formData.faculty,
        department: formData.department,
        year_of_study: formData.year_of_study,
        cgpa: formData.cgpa || null,
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
          <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4 text-violet-600">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">Congratulations!</h2>
          <p className="text-neutral-500 text-sm mb-6 leading-relaxed">
            Registration Complete. You're ready to begin your journey.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 font-sans flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <Link to="/signup" className="text-neutral-500 hover:text-neutral-700 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </Link>
            <div className="text-sm font-semibold text-neutral-400">Step {currentStep} of 3</div>
          </div>
          {/* Progress Bar */}
          <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-violet-600 transition-all duration-300 ease-out"
              style={{ width: `${(currentStep / 3) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-4 py-8">
        <div className="max-w-xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-50 text-violet-700 text-xs font-semibold uppercase tracking-wider mb-6 border border-violet-100">
            <span>🎓</span> Student Registration
          </div>

          {error && (
            <div className="mb-6 p-4 bg-danger-50 border border-danger-light/30 text-danger-dark rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Form wrapper */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8 shadow-sm">
            {currentStep === 1 && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h1 className="text-2xl font-bold text-neutral-900">Let's get you started.</h1>
                  <p className="text-sm text-neutral-500 mt-1">Start with the basics.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-neutral-900">First name *</label>
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      placeholder="e.g. Adaeze"
                      className="w-full p-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-violet-600 focus:border-transparent outline-none text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-neutral-900">Last name *</label>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      placeholder="e.g. Okonkwo"
                      className="w-full p-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-violet-600 focus:border-transparent outline-none text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-neutral-900">LASU student email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="e.g. 190402001@student.lasu.edu.ng"
                    className="w-full p-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-violet-600 focus:border-transparent outline-none text-sm"
                  />
                  <p className="text-xs text-neutral-500">Must end in @student.lasu.edu.ng</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-neutral-900">Matriculation number *</label>
                  <input
                    type="text"
                    name="matric_no"
                    value={formData.matric_no}
                    onChange={handleChange}
                    placeholder="e.g. 190402001"
                    className="w-full p-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-violet-600 focus:border-transparent outline-none text-sm"
                  />
                </div>

                <div className="pt-4 flex flex-col gap-4">
                  <button
                    onClick={nextStep}
                    className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    Continue
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </button>
                  <Link to="/login" className="text-center text-sm text-neutral-500 hover:text-violet-600 transition-colors">
                    Already have an account? Sign in instead
                  </Link>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h1 className="text-2xl font-bold text-neutral-900">Your academic details.</h1>
                  <p className="text-sm text-neutral-500 mt-1">Tell us where you are in your studies.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-neutral-900">Faculty *</label>
                  <select
                    name="faculty"
                    value={formData.faculty}
                    onChange={handleChange}
                    className="w-full p-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-violet-600 focus:border-transparent outline-none text-sm bg-white"
                  >
                    <option value="">Select your faculty</option>
                    <option value="Science">Science</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Management Sciences">Management Sciences</option>
                    <option value="Arts">Arts</option>
                    <option value="Law">Law</option>
                    <option value="Social Sciences">Social Sciences</option>
                    <option value="Education">Education</option>
                    <option value="Communication">Communication & Media Studies</option>
                    <option value="Clinical Sciences">Clinical Sciences</option>
                    <option value="Basic Medical Sciences">Basic Medical Sciences</option>
                    <option value="Basic Clinical Sciences">Basic Clinical Sciences</option>
                    <option value="Dentistry">Dentistry</option>
                    <option value="Agriculture">Agriculture</option>
                    <option value="Environmental Sciences">Environmental Sciences</option>
                    <option value="Transport">School of Transport & Logistics</option>
                    <option value="Computing">School of Computing</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-neutral-900">Department *</label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="w-full p-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-violet-600 focus:border-transparent outline-none text-sm bg-white"
                  >
                    <option value="">Select your department</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Biological Sciences">Biological Sciences</option>
                    <option value="Business Administration">Business Administration</option>
                    <option value="Accounting">Accounting</option>
                    <option value="Mass Communication">Mass Communication</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-neutral-900">Year of study *</label>
                    <select
                      name="year_of_study"
                      value={formData.year_of_study}
                      onChange={handleChange}
                      className="w-full p-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-violet-600 focus:border-transparent outline-none text-sm bg-white"
                    >
                      <option value="">Select level</option>
                      <option value="100L">100 Level</option>
                      <option value="200L">200 Level</option>
                      <option value="300L">300 Level</option>
                      <option value="400L">400 Level</option>
                      <option value="500L">500 Level</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-neutral-900">Current CGPA (approx.)</label>
                    <input
                      type="text"
                      name="cgpa"
                      value={formData.cgpa}
                      onChange={handleChange}
                      placeholder="e.g. 3.50"
                      className="w-full p-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-violet-600 focus:border-transparent outline-none text-sm"
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    onClick={prevStep}
                    className="px-6 py-3.5 rounded-xl border border-neutral-200 text-neutral-700 font-semibold hover:bg-neutral-50 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={nextStep}
                    className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    Continue
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h1 className="text-2xl font-bold text-neutral-900">Create your password.</h1>
                  <p className="text-sm text-neutral-500 mt-1">Set up your credentials to access the platform.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-neutral-900">Username *</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="e.g. adaeze.o"
                    className="w-full p-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-violet-600 focus:border-transparent outline-none text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-neutral-900">Password *</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min 8 characters"
                    className="w-full p-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-violet-600 focus:border-transparent outline-none text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-neutral-900">Confirm password *</label>
                  <input
                    type="password"
                    name="confirm_password"
                    value={formData.confirm_password}
                    onChange={handleChange}
                    placeholder="Repeat password"
                    className="w-full p-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-violet-600 focus:border-transparent outline-none text-sm"
                  />
                </div>

                <div className="flex items-start gap-3 p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                  <input
                    type="checkbox"
                    name="agreed_to_terms"
                    checked={formData.agreed_to_terms}
                    onChange={handleChange}
                    className="mt-1 w-4 h-4 text-violet-600 border-neutral-300 rounded focus:ring-violet-600"
                  />
                  <label className="text-sm text-neutral-600 leading-relaxed">
                    I agree to the LASU SIWES platform terms of service and confirm that the information provided is accurate.
                  </label>
                </div>

                <div className="border-l-4 border-violet-500 bg-violet-50 p-4 rounded-r-xl">
                  <p className="text-sm text-violet-900 font-semibold mb-1">Next: 8-Step Onboarding Wizard</p>
                  <p className="text-sm text-violet-700">After registration you'll complete your Job Family selection, skill profile, and get your first Fit Score.</p>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    onClick={prevStep}
                    disabled={loading}
                    className="px-6 py-3.5 rounded-xl border border-neutral-200 text-neutral-700 font-semibold hover:bg-neutral-50 transition-colors disabled:opacity-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3.5 rounded-xl transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Creating...
                      </span>
                    ) : (
                      'Create student account'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

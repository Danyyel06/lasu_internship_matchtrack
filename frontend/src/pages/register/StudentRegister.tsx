import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/$/, '') : '';

export default function StudentRegister() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // CGPA extraction state
  const [cgpaExtracting, setCgpaExtracting] = useState(false);
  const [cgpaVerified, setCgpaVerified] = useState(false);
  const [cgpaFileName, setCgpaFileName] = useState('');
  const [cgpaError, setCgpaError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [faculties, setFaculties] = useState<any[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);

  useEffect(() => {
    const fetchFaculties = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/v1/auth/faculties`);
        setFaculties(res.data);
      } catch (err) {
        console.error("Failed to fetch faculties", err);
      }
    };
    fetchFaculties();
  }, []);

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
    setFormData((prev) => {
      const newData = {
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
      };

      if (name === 'faculty') {
        newData.department = '';
        const selectedFaculty = faculties.find(f => f.name === value);
        if (selectedFaculty) {
          setDepartments(selectedFaculty.departments);
        } else {
          setDepartments([]);
        }
      }

      return newData;
    });

    // If the user manually edits the CGPA field, clear the verified badge
    if (name === 'cgpa') {
      setCgpaVerified(false);
    }
    setError('');
  };

  const handleCgpaFileUpload = async (file: File) => {
    if (file.type !== 'application/pdf') {
      setCgpaError('Please upload a PDF file.');
      return;
    }
    setCgpaError('');
    setCgpaExtracting(true);
    setCgpaFileName(file.name);
    setCgpaVerified(false);

    const fd = new FormData();
    fd.append('file', file);

    try {
      const res = await axios.post(`${API_BASE}/api/v1/transcript/extract-cgpa/`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.success) {
        setFormData((prev) => ({ ...prev, cgpa: res.data.cgpa }));
        setCgpaVerified(true);
      } else {
        setCgpaError(res.data.error || 'Could not extract CGPA from this PDF.');
      }
    } catch {
      setCgpaError('Could not extract CGPA from this PDF. Please verify its format or enter your CGPA manually.');
    } finally {
      setCgpaExtracting(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleCgpaFileUpload(file);
    // Reset the input so the same file can be re-selected
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) handleCgpaFileUpload(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
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
                    {faculties.map((f, i) => (
                      <option key={i} value={f.name}>{f.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-neutral-900">Department *</label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    disabled={!formData.faculty}
                    className="w-full p-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-violet-600 focus:border-transparent outline-none text-sm bg-white disabled:bg-neutral-50 disabled:text-neutral-400"
                  >
                    <option value="">Select your department</option>
                    {departments.map((d, i) => (
                      <option key={i} value={d}>{d}</option>
                    ))}
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
                    <div className="relative">
                      <input
                        type="text"
                        name="cgpa"
                        value={formData.cgpa}
                        onChange={handleChange}
                        placeholder="e.g. 3.50"
                        className={`w-full p-3 rounded-xl border focus:ring-2 focus:ring-violet-600 focus:border-transparent outline-none text-sm ${
                          cgpaVerified
                            ? 'border-emerald-300 bg-emerald-50/40 text-violet-700 font-medium'
                            : 'border-neutral-200'
                        }`}
                      />
                      {cgpaVerified && (
                        <div className="flex items-center gap-1 mt-1.5">
                          <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                          <span className="text-xs font-medium text-emerald-600">Verified from PDF</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* CGPA Transcript Upload Zone */}
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-200 ${
                    cgpaExtracting
                      ? 'border-violet-300 bg-violet-50/60'
                      : cgpaVerified
                        ? 'border-emerald-300 bg-emerald-50/40 hover:border-emerald-400'
                        : 'border-neutral-200 bg-neutral-50/50 hover:border-violet-400 hover:bg-violet-50/30'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />

                  {cgpaExtracting ? (
                    <div className="flex flex-col items-center gap-2 py-1">
                      <svg className="animate-spin w-6 h-6 text-violet-500" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span className="text-sm font-medium text-violet-600">Extracting CGPA…</span>
                      <span className="text-xs text-neutral-400 truncate max-w-[200px]">{cgpaFileName}</span>
                    </div>
                  ) : cgpaVerified ? (
                    <div className="flex flex-col items-center gap-1.5 py-1">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                        <svg className="w-4.5 h-4.5 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-emerald-600">CGPA extracted successfully</span>
                      <span className="text-xs text-neutral-400 truncate max-w-[200px]">{cgpaFileName}</span>
                      <span className="text-xs text-neutral-400">Click to upload a different transcript</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 py-1">
                      <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center">
                        <svg className="w-4.5 h-4.5 text-violet-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.338-2.32 3.75 3.75 0 013.826 4.597A4.499 4.499 0 0118 19.5H6.75z" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-neutral-700">Validate your CGPA with your transcript (PDF)</span>
                      <span className="text-xs text-neutral-400">Drag & drop or click to browse</span>
                    </div>
                  )}
                </div>

                {cgpaError && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
                    <svg className="w-4 h-4 text-red-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                    <p className="text-xs text-red-600">{cgpaError}</p>
                  </div>
                )}

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

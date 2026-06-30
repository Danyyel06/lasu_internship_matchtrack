import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const totalSteps = 8;
  const [firstName, setFirstName] = useState('');
  const [dbJobFamilies, setDbJobFamilies] = useState<any[]>([]);
  const [jobFamilyLoading, setJobFamilyLoading] = useState(true);

  const JOB_FAMILY_ICONS: Record<string, string> = {
    "Software and Technology": "💻",
    "Engineering and Manufacturing": "⚙️",
    "Business and Management": "📊",
    "Finance and Accounting": "💰",
    "Health and Life Sciences": "🏥",
    "Media and Communications": "🎨",
    "Education and Social Services": "📚",
    "Architecture and Built Environment": "🏗️",
    "Science and Research": "🔬",
    "Legal and Compliance": "⚖️"
  };

  const JOB_FAMILY_COURSES: Record<string, string[]> = {
    "Software and Technology": [
      'Introduction to Programming / Computer Science 101',
      'Data Structures and Algorithms',
      'Database Management Systems',
      'Computer Networks and Communication',
      'Software Engineering / System Analysis'
    ],
    "Engineering and Manufacturing": [
      'Engineering Mathematics / Calculus',
      'Mechanics of Materials / Thermodynamics',
      'Engineering Drawing / CAD',
      'Fluid Mechanics',
      'Manufacturing Processes'
    ],
    "Business and Management": [
      'Principles of Management',
      'Business Economics / Microeconomics',
      'Organizational Behavior',
      'Business Communication',
      'Marketing Principles'
    ],
    "Finance and Accounting": [
      'Financial Accounting / Reporting',
      'Managerial Accounting',
      'Corporate Finance',
      'Taxation Principles',
      'Auditing and Assurance'
    ],
    "Health and Life Sciences": [
      'Human Anatomy / Physiology',
      'Biochemistry / Cell Biology',
      'Public Health / Epidemiology',
      'Pharmacology / Pathology',
      'Biostatistics'
    ],
    "Media and Communications": [
      'Introduction to Mass Communication',
      'Journalism and News Writing',
      'Public Relations / Advertising',
      'Digital Media Production',
      'Media Ethics and Law'
    ],
    "Education and Social Services": [
      'Foundations of Education',
      'Educational Psychology',
      'Curriculum Development',
      'Sociology / Social Problems',
      'Counseling Principles'
    ],
    "Architecture and Built Environment": [
      'Architectural Design / Drafting',
      'Building Construction / Materials',
      'History of Architecture',
      'Structural Mechanics',
      'Urban Planning Basics'
    ],
    "Science and Research": [
      'General Chemistry / Physics',
      'Laboratory Techniques and Safety',
      'Research Methodology',
      'Quantitative Analysis',
      'Advanced Mathematics'
    ],
    "Legal and Compliance": [
      'Introduction to Legal Systems',
      'Contract Law / Tort Law',
      'Constitutional Law',
      'Commercial / Corporate Law',
      'Ethics and Professional Conduct'
    ]
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.first_name) {
          setFirstName(payload.first_name);
        }
      } catch (e) {
        console.error("Invalid token");
      }
    }
    
    // Fetch Job Families
    const fetchJobFamilies = async () => {
      try {
        const response = await axios.get(`${API_BASE}/api/v1/job-families/`);
        setDbJobFamilies(response.data);
      } catch (err) {
        console.error('Failed to fetch job families', err);
      } finally {
        setJobFamilyLoading(false);
      }
    };
    fetchJobFamilies();
  }, []);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1
    first_name: '',
    last_name: '',
    matric_no: '',
    faculty: '',
    department: '',
    level: '',
    cgpa: '',
    // Step 2
    job_family: null as number | null,
    // Step 3
    sub_role: null as number | null,
    // Step 4
    coursework: [] as string[],
    other_course: '',
    best_performing_area: '',
    // Step 5
    technical_skills: {} as Record<string, number>,
    soft_skills: {} as Record<string, number>,
    // Step 6
    project_description: '',
    experience_types: [] as string[],
    link_url: '',
    projects: [] as { name: string; description: string; url: string }[],
    // Step 7
    primary_goal: '',
    preferred_location: '',
    duration_available: '',
    org_type_preference: [] as string[],
    concerns: '',
  });

  const updateFormData = (data: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      
      const payload = {
        matric_no: "NOT_USED_IN_UI",
        faculty: "NOT_USED",
        department: "NOT_USED",
        level: 100,
        cgpa: 0.0,
        job_family_id: formData.job_family,
        selected_sub_role_id: formData.sub_role,
        skills: [
          ...Object.entries(formData.technical_skills).map(([name, lvl]) => ({ skill_name: name, claimed_level: lvl })),
          ...Object.entries(formData.soft_skills).map(([name, lvl]) => ({ skill_name: name, claimed_level: lvl }))
        ],
        projects: formData.projects,
        coursework: formData.coursework,
        preferences: {
          primary_goal: formData.primary_goal,
          preferred_location: formData.preferred_location,
          duration_available: formData.duration_available,
          org_type_preference: formData.org_type_preference,
          concerns: formData.concerns
        }
      };

      await axios.post(`${API_BASE}/api/v1/students/onboarding`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setIsSuccess(true);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.detail || 'Failed to submit onboarding');
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-white font-sans flex flex-col">
        <header className="border-b border-neutral-100 py-4 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900">LASU InternConnect</h1>
              <p className="text-xs text-neutral-500">Lagos State University</p>
            </div>
          </div>
          <div className="text-sm font-medium text-neutral-400">Complete!</div>
        </header>

        <div className="flex-1 flex flex-col items-center py-12 px-4">
          <div className="max-w-md w-full text-center">
            <div className="w-20 h-20 border border-neutral-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-slate-900" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>

            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              You're in the system, {firstName || 'Student'}!
            </h2>
            <p className="text-neutral-500 mb-10 leading-relaxed text-sm">
              Your profile has been submitted. Your initial Fit Score is <span className="font-bold text-slate-900">68/100</span> — placing you in the <span className="font-bold text-slate-900">Tier 1-2 range</span>. Check your LASU email for your diagnostic task within 48 hours.
            </p>

            <div className="space-y-4 mb-10 text-left">
              <div className="p-5 border border-neutral-200 rounded-2xl bg-white shadow-sm">
                <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Next Step 1</div>
                <h3 className="font-bold text-slate-900 mb-1">Check your email</h3>
                <p className="text-sm text-neutral-500">Diagnostic task arrives within 48 hours. Takes 15-20 minutes.</p>
              </div>

              <div className="p-5 border border-neutral-200 rounded-2xl bg-white shadow-sm">
                <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Next Step 2</div>
                <h3 className="font-bold text-slate-900 mb-1">Upload more evidence</h3>
                <p className="text-sm text-neutral-500">Log in to your dashboard to add certificates, links, or references anytime.</p>
              </div>

              <div className="p-5 border border-neutral-200 rounded-2xl bg-white shadow-sm">
                <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Next Step 3</div>
                <h3 className="font-bold text-slate-900 mb-1">Track your matches</h3>
                <p className="text-sm text-neutral-500">Your top matched organisations will appear in your dashboard within 2 weeks.</p>
              </div>
            </div>

            <button className="w-full bg-slate-900 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2">
              How does my Fit Score get calculated?
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col">
      {/* Header */}
      <header className="border-b border-neutral-200 py-4 px-4 sm:px-6 sticky top-0 bg-white z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <div>
              <h1 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">LASU InternConnect</h1>
              <p className="text-xs text-neutral-500">Lagos State University</p>
            </div>
          </div>
          <div className="text-sm font-medium text-neutral-500">
            Step {currentStep} of 8
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="w-full bg-neutral-100 h-1">
        <div 
          className="bg-slate-900 h-full transition-all duration-300"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 sm:py-12">
        {currentStep === 1 && (
          <div className="space-y-8 animate-fadeIn">
            <div>
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Getting Started</p>
              <h2 className="text-3xl font-bold text-slate-900 mb-3">Welcome to your career journey</h2>
              <p className="text-neutral-500 leading-relaxed text-sm">
                This takes about 10–14 minutes. Everything you share helps us find the internship that actually fits you — not just a random placement. There are no wrong answers here.
              </p>
            </div>

            <div className="border-l-4 border-slate-900 bg-neutral-50 p-5 rounded-r-xl">
              <p className="text-sm text-neutral-700 leading-relaxed">
                <span className="font-bold text-slate-900">You're in control.</span> You can save and return any time. Nothing is submitted until you hit "Submit Profile" on the last step.
              </p>
            </div>

            <div className="bg-white border border-neutral-200 p-8 rounded-2xl shadow-sm text-center">
              <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-900" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Hello, {firstName}!</h3>
              <p className="text-neutral-500 text-sm mb-6 max-w-md mx-auto">
                We already have your basic details securely stored from your registration. 
                Let's move on to the interesting part — understanding what you want out of your internship so we can match you properly.
              </p>
            </div>

            <div className="pt-6 border-t border-neutral-100">
              <button onClick={nextStep} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors">
                Continue
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-8 animate-fadeIn">
            <div>
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Step 2 of 8 — Career Direction</p>
              <h2 className="text-3xl font-bold text-slate-900 mb-3">What kind of work excites you most?</h2>
              <p className="text-neutral-500 leading-relaxed text-sm">
                Choose the field that feels most like you — even if you've never worked in it. You can always update this later. This unlocks your personalised path.
              </p>
            </div>

            <div className="space-y-3">
              {jobFamilyLoading ? (
                <div className="flex justify-center p-8"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div></div>
              ) : dbJobFamilies.map((family: any) => (
                <div 
                  key={family.id}
                  onClick={() => updateFormData({job_family: family.id, sub_role: null, technical_skills: {}})}
                  className={`flex items-center gap-4 p-4 border rounded-2xl cursor-pointer transition-all ${formData.job_family === family.id ? 'border-slate-900 shadow-sm bg-slate-50' : 'border-neutral-200 hover:border-neutral-300'}`}
                >
                  <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center text-xl flex-shrink-0">
                    {JOB_FAMILY_ICONS[family.name] || '💼'}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{family.name}</h3>
                    <p className="text-sm text-neutral-500">{family.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-6 border-t border-neutral-100 flex gap-4">
              <button onClick={prevStep} className="px-6 py-4 rounded-xl border border-neutral-200 text-slate-900 font-semibold hover:bg-neutral-50 transition-colors">
                ← Back
              </button>
              <button onClick={nextStep} disabled={!formData.job_family} className={`flex-1 font-semibold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors ${formData.job_family ? 'bg-slate-900 hover:bg-slate-800 text-white' : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'}`}>
                Continue →
              </button>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-8 animate-fadeIn">
            <div>
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Step 3 of 8 — Your Specialisation</p>
              <h2 className="text-3xl font-bold text-slate-900 mb-3">What's your specific interest?</h2>
              <p className="text-neutral-500 leading-relaxed text-sm">
                These are the roles available within your chosen field. Pick the one that fits best — or the one you're most curious about.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              {(() => {
                const selectedFamily = dbJobFamilies.find(f => f.id === formData.job_family);
                if (!selectedFamily) return <p className="text-neutral-500 italic p-4">Please select a Career Direction first.</p>;
                return selectedFamily.sub_roles.map((role: any) => (
                  <div 
                    key={role.id}
                    onClick={() => updateFormData({sub_role: role.id, technical_skills: {}})}
                    className={`flex items-center gap-4 p-5 border rounded-2xl cursor-pointer transition-all ${formData.sub_role === role.id ? 'border-slate-900 bg-slate-50' : 'border-neutral-200 hover:border-neutral-300'}`}
                  >
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${formData.sub_role === role.id ? 'border-slate-900' : 'border-neutral-300'}`}>
                      {formData.sub_role === role.id && <div className="w-2.5 h-2.5 bg-slate-900 rounded-full" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{role.name}</h3>
                      <p className="text-sm text-neutral-500 mt-0.5">{role.description}</p>
                    </div>
                  </div>
                ));
              })()}
            </div>

            <div className="pt-6 border-t border-neutral-100 flex gap-4">
              <button onClick={prevStep} className="px-6 py-4 rounded-xl border border-neutral-200 text-slate-900 font-semibold hover:bg-neutral-50 transition-colors">
                ← Back
              </button>
              <button onClick={nextStep} disabled={!formData.sub_role} className={`flex-1 font-semibold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors ${formData.sub_role ? 'bg-slate-900 hover:bg-slate-800 text-white' : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'}`}>
                Continue →
              </button>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-8 animate-fadeIn">
            <div>
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Step 4 of 8 — Academic Background</p>
              <h2 className="text-3xl font-bold text-slate-900 mb-3">Tell us about your coursework</h2>
              <p className="text-neutral-500 leading-relaxed text-sm">
                Courses you've taken are strong signals of what you can do. Don't worry if you haven't taken many yet — just be honest about where you are.
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl">
              <p className="text-sm text-amber-900">
                <span className="font-bold">Tip: Even courses you found difficult count.</span> They show you've been exposed to those topics — and learning from struggle is real experience.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 mb-1">Which relevant courses have you completed? (tick all that apply)</h3>
              <p className="text-sm text-neutral-500 mb-6">These are the most common relevant courses for your selected field. Add your own below if needed.</p>
              
              <div className="flex border-b border-neutral-200 gap-6 mb-6">
                <button className="pb-3 border-b-2 border-slate-900 text-slate-900 font-bold text-sm">
                  {(() => {
                    const family = dbJobFamilies.find(f => f.id === formData.job_family);
                    return family ? `${family.name} courses` : 'Relevant courses';
                  })()}
                </button>
              </div>

              <div className="space-y-4">
                {(() => {
                  const family = dbJobFamilies.find(f => f.id === formData.job_family);
                  const courses = family && JOB_FAMILY_COURSES[family.name] 
                    ? JOB_FAMILY_COURSES[family.name] 
                    : ['Introduction to Programming / Computer Science 101', 'Data Structures and Algorithms', 'Database Management Systems', 'Computer Networks and Communication', 'Software Engineering / System Analysis'];
                  
                  return courses.map(course => (
                    <label key={course} className="flex items-start gap-4 cursor-pointer group">
                      <div className="relative flex items-center justify-center w-5 h-5 mt-0.5 border border-neutral-300 rounded focus-within:ring-2 focus-within:ring-slate-900">
                        <input 
                          type="checkbox" 
                          className="opacity-0 absolute inset-0 cursor-pointer"
                          checked={formData.coursework.includes(course)}
                          onChange={(e) => {
                            const newCourses = e.target.checked 
                              ? [...formData.coursework, course]
                              : formData.coursework.filter(c => c !== course);
                            updateFormData({ coursework: newCourses });
                          }}
                        />
                        {formData.coursework.includes(course) && (
                          <svg className="w-3.5 h-3.5 text-slate-900" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                        )}
                      </div>
                      <span className="text-slate-900 text-sm">{course}</span>
                    </label>
                  ));
                })()}
              </div>
            </div>

            <div className="space-y-5 border-t border-neutral-100 pt-6">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1.5">Any other relevant course not listed? (optional)</label>
                <textarea 
                  value={formData.other_course}
                  onChange={e => updateFormData({other_course: e.target.value})}
                  placeholder="e.g. GIS and Remote Sensing, Entrepreneurship 101" 
                  className="w-full p-4 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none min-h-[100px] resize-y text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1.5">Best performing area in school (optional)</label>
                <textarea 
                  value={formData.best_performing_area}
                  onChange={e => updateFormData({best_performing_area: e.target.value})}
                  placeholder="e.g. I always do well in lab practicals / I enjoy mather" 
                  className="w-full p-4 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none min-h-[100px] resize-y text-sm"
                />
                <p className="text-xs text-neutral-500 mt-2">This helps us spot your hidden strengths even when grades don't show everything.</p>
              </div>
            </div>

            <div className="pt-6 border-t border-neutral-100 flex gap-4">
              <button onClick={prevStep} className="px-6 py-4 rounded-xl border border-neutral-200 text-slate-900 font-semibold hover:bg-neutral-50 transition-colors">
                ← Back
              </button>
              <button onClick={nextStep} className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors">
                Continue →
              </button>
            </div>
          </div>
        )}

        {currentStep === 5 && (
          <div className="space-y-8 animate-fadeIn">
            <div>
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Step 5 of 8 — Your Skills</p>
              <h2 className="text-3xl font-bold text-slate-900 mb-3">Rate your skills honestly</h2>
              <p className="text-neutral-500 leading-relaxed text-sm">
                Use the 5-dot scale to show where you are today. Starting at Level 1 is completely normal — this is how we find the right starting point for you.
              </p>
            </div>

            <div className="border-l-4 border-slate-900 bg-neutral-50 p-5 rounded-r-xl">
              <p className="text-sm text-neutral-700 leading-relaxed">
                <span className="font-bold text-slate-900">No guessing needed.</span> Your self-ratings are the starting point. After you complete your profile, the system will run short diagnostic tasks to confirm and refine these ratings. Being honest now gives you better matches.
              </p>
            </div>

            {/* Technical Skills */}
            <div>
              <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-4 border-b border-neutral-200 pb-2">Technical Skills (Field-Specific)</h3>
              
              <div className="space-y-4">
                {(() => {
                  const family = dbJobFamilies.find(f => f.id === formData.job_family);
                  if (!family) return null;
                  const role = family.sub_roles.find((r: any) => r.id === formData.sub_role);
                  if (!role || !role.skills || role.skills.length === 0) return <p className="text-neutral-500 italic p-4">No specific technical skills defined for this role.</p>;
                  return role.skills.map((skillName: string) => (
                    <div key={skillName} className="p-5 border border-neutral-200 rounded-2xl">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="font-bold text-slate-900">{skillName}</span>
                        <span className="px-2 py-0.5 rounded-full border border-neutral-200 text-[10px] uppercase font-semibold text-neutral-500">Technical</span>
                      </div>
                      
                      <div className="flex items-center justify-between gap-1 sm:gap-2">
                        {[
                          { level: 1, label: 'No exposure' },
                          { level: 2, label: 'Familiar' },
                          { level: 3, label: 'Practiced' },
                          { level: 4, label: 'Proficient' },
                          { level: 5, label: 'Expert' }
                        ].map((item) => {
                          const currentLvl = formData.technical_skills[skillName] || 0;
                          const isFilled = item.level <= currentLvl;
                          return (
                            <div key={item.level} className="flex-1 flex flex-col items-center gap-2 cursor-pointer" onClick={() => updateFormData({ technical_skills: { ...formData.technical_skills, [skillName]: item.level } })}>
                              <div className={`w-full h-2 rounded-full ${isFilled ? 'bg-slate-900' : 'bg-neutral-100'}`} />
                              <span className={`text-[10px] sm:text-xs text-center ${currentLvl === item.level ? 'font-bold text-slate-900' : 'text-neutral-400'}`}>{item.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>

            {/* Soft Skills */}
            <div className="pt-4">
              <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-4 border-b border-neutral-200 pb-2">Soft Skills (Universal — All Fields)</h3>
              
              <div className="space-y-4">
                {[
                  { id: 'written', name: 'Written communication' },
                  { id: 'teamwork', name: 'Teamwork & collaboration' }
                ].map(skill => (
                  <div key={skill.id} className="p-5 border border-neutral-200 rounded-2xl">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="font-bold text-slate-900">{skill.name}</span>
                      <span className="px-2 py-0.5 rounded-full border border-neutral-200 text-[10px] uppercase font-semibold text-neutral-500">Soft skill</span>
                    </div>
                    
                    <div className="flex items-center justify-between gap-1 sm:gap-2">
                      {[
                        { level: 1, label: 'No exposure' },
                        { level: 2, label: 'Familiar' },
                        { level: 3, label: 'Practiced' },
                        { level: 4, label: 'Proficient' },
                        { level: 5, label: 'Expert' }
                      ].map((item) => {
                        const currentLvl = formData.soft_skills[skill.id] || 0;
                        const isFilled = item.level <= currentLvl;
                        return (
                          <div key={item.level} className="flex-1 flex flex-col items-center gap-2 cursor-pointer" onClick={() => updateFormData({ soft_skills: { ...formData.soft_skills, [skill.id]: item.level } })}>
                            <div className={`w-full h-2 rounded-full ${isFilled ? 'bg-slate-900' : 'bg-neutral-100'}`} />
                            <span className={`text-[10px] sm:text-xs text-center ${currentLvl === item.level ? 'font-bold text-slate-900' : 'text-neutral-400'}`}>{item.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-neutral-100 flex gap-4">
              <button onClick={prevStep} className="px-6 py-4 rounded-xl border border-neutral-200 text-slate-900 font-semibold hover:bg-neutral-50 transition-colors">
                ← Back
              </button>
              <button onClick={nextStep} className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors">
                Continue →
              </button>
            </div>
          </div>
        )}

        {currentStep === 6 && (
          <div className="space-y-8 animate-fadeIn">
            <div>
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Step 6 of 8 — Your Experience</p>
              <h2 className="text-3xl font-bold text-slate-900 mb-3">What have you already done?</h2>
              <p className="text-neutral-500 leading-relaxed text-sm">
                Projects, side hustles, clubs, volunteer work, church activities, family businesses — all of it counts. You don't need a formal job title to have real experience.
              </p>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-900 mb-1.5">Describe a project or activity you're proud of (in any area)</label>
              <textarea 
                value={formData.project_description}
                onChange={e => updateFormData({project_description: e.target.value})}
                placeholder="e.g. I built a simple attendance app for my department using Google Sheets. It tracked 200+ students and saved the lecturer hours each week. I learned to use formulas and scripts." 
                className="w-full p-4 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none min-h-[120px] resize-y text-sm mb-2"
              />
              <p className="text-xs text-neutral-500">Doesn't need to be technical. A project could be organising an event, helping a family farm, running a social media page, or doing research for a class assignment.</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-900 mb-3">Have you done any of these? (tick all that apply)</label>
              <div className="space-y-3">
                {[
                  'SIWES / IT placement (formal)',
                  'Informal work experience / apprenticeship',
                  'Freelance or paid gig work',
                  'Student society / departmental leadership role',
                  'Volunteer or community service work',
                  'Online course certificate (Coursera, Udemy, etc.)',
                  'Personal project / portfolio item',
                  'None of the above — and that\'s okay!'
                ].map(exp => (
                  <label key={exp} className="flex items-start gap-4 cursor-pointer group">
                    <div className="relative flex items-center justify-center w-5 h-5 mt-0.5 border border-neutral-300 rounded focus-within:ring-2 focus-within:ring-slate-900">
                      <input 
                        type="checkbox" 
                        className="opacity-0 absolute inset-0 cursor-pointer"
                        checked={formData.experience_types.includes(exp)}
                        onChange={(e) => {
                          const newTypes = e.target.checked 
                            ? [...formData.experience_types, exp]
                            : formData.experience_types.filter(c => c !== exp);
                          updateFormData({ experience_types: newTypes });
                        }}
                      />
                      {formData.experience_types.includes(exp) && (
                        <svg className="w-3.5 h-3.5 text-slate-900" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                      )}
                    </div>
                    <span className="text-slate-900 text-sm">{exp}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-900 mb-1.5">Upload evidence (optional but highly recommended)</label>
              <p className="text-xs text-neutral-500 mb-3">Certificate, transcript, GitHub link, portfolio, SIWES letter — anything that shows your work. Increases your Fit Score by up to 25 points.</p>
              
              <div className="border-2 border-dashed border-neutral-200 rounded-2xl p-8 flex flex-col items-center justify-center bg-neutral-50 text-center hover:bg-neutral-100 transition-colors cursor-pointer mb-4 relative">
                <input type="file" multiple className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    alert(`Added ${e.target.files.length} file(s) for upload.`);
                  }
                }} />
                <svg className="w-6 h-6 text-neutral-400 mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                </svg>
                <p className="text-sm font-bold text-slate-900 mb-1">Click to upload or drag & drop here</p>
                <p className="text-xs text-neutral-400">PDF, DOCX, JPEG, PNG — max 5MB each</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-900 mb-1.5">Link to online work (optional)</label>
                <input type="text" value={formData.link_url} onChange={e => updateFormData({link_url: e.target.value})} placeholder="https://github.com/yourname or linkedin.com/in/" className="w-full p-3.5 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none text-sm" />
              </div>
            </div>

            <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-slate-900" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                </svg>
                <h3 className="text-lg font-bold text-slate-900">Key Projects</h3>
              </div>

              {formData.projects.map((project, idx) => (
                <div key={idx} className="bg-white border border-neutral-200 rounded-xl p-5 mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-semibold text-neutral-400 uppercase">Project {idx + 1}</span>
                    <button onClick={() => {
                      const newProjects = [...formData.projects];
                      newProjects.splice(idx, 1);
                      updateFormData({ projects: newProjects });
                    }} className="text-red-500 hover:text-red-700">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-900 mb-1">Project Name</label>
                      <input type="text" value={project.name} onChange={e => {
                        const newProjects = [...formData.projects];
                        newProjects[idx].name = e.target.value;
                        updateFormData({ projects: newProjects });
                      }} placeholder="E-commerce Analytics Dashboard" className="w-full p-2.5 border border-neutral-200 rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-900 mb-1">Brief Description</label>
                      <textarea value={project.description} onChange={e => {
                        const newProjects = [...formData.projects];
                        newProjects[idx].description = e.target.value;
                        updateFormData({ projects: newProjects });
                      }} placeholder="Built a full-stack dashboard..." className="w-full p-2.5 border border-neutral-200 rounded-lg text-sm min-h-[80px]" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-900 mb-1">Project URL (Optional)</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="h-4 w-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                        </div>
                        <input type="text" value={project.url} onChange={e => {
                          const newProjects = [...formData.projects];
                          newProjects[idx].url = e.target.value;
                          updateFormData({ projects: newProjects });
                        }} placeholder="https://github.com/..." className="w-full pl-9 p-2.5 border border-neutral-200 rounded-lg text-sm" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <button 
                onClick={() => updateFormData({ projects: [...formData.projects, { name: '', description: '', url: '' }] })}
                className="w-full py-3.5 border border-dashed border-slate-900 rounded-xl text-slate-900 font-bold text-sm flex items-center justify-center gap-2 hover:bg-neutral-100 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                Add Another Project
              </button>
            </div>

            <div className="pt-6 border-t border-neutral-100 flex gap-4">
              <button onClick={prevStep} className="px-6 py-4 rounded-xl border border-neutral-200 text-slate-900 font-semibold hover:bg-neutral-50 transition-colors">
                ← Back
              </button>
              <button onClick={nextStep} className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors">
                Continue →
              </button>
            </div>
          </div>
        )}

        {currentStep === 7 && (
          <div className="space-y-8 animate-fadeIn">
            <div>
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Step 7 of 8 — Your Goals</p>
              <h2 className="text-3xl font-bold text-slate-900 mb-3">What are you hoping to gain?</h2>
              <p className="text-neutral-500 leading-relaxed text-sm">
                Help us find the right match — not just a placement. Your goals shape which organisations and tiers we recommend for you.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 mb-4">What's your primary goal for this internship?</h3>
              <div className="space-y-3">
                {[
                  { id: 'explore', num: '1', title: 'Explore the field', desc: 'I\'m not sure yet — I want to see what the real work environment feels like' },
                  { id: 'build', num: '2', title: 'Build foundational skills', desc: 'I have some knowledge and want structured practice and mentorship' },
                  { id: 'apply', num: '3', title: 'Apply what I know', desc: 'I feel ready to do real work and contribute meaningfully to a team' },
                  { id: 'accelerate', num: '4', title: 'Accelerate toward a career', desc: 'I want a challenging placement that could lead to a job offer or references' }
                ].map(goal => (
                  <div 
                    key={goal.id} 
                    onClick={() => updateFormData({primary_goal: goal.id})}
                    className={`flex items-center gap-4 p-5 border rounded-2xl cursor-pointer transition-all ${formData.primary_goal === goal.id ? 'border-slate-900 bg-slate-50' : 'border-neutral-200 hover:border-neutral-300'}`}
                  >
                    <div className="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center text-sm font-semibold text-neutral-500 flex-shrink-0">
                      {goal.num}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{goal.title}</h4>
                      <p className="text-sm text-neutral-500 mt-0.5">{goal.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-neutral-100">
              <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-4">Placement Preferences</h3>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-1.5">Preferred location</label>
                  <select className="w-full p-3.5 border border-neutral-200 rounded-xl bg-white focus:ring-2 focus:ring-slate-900 outline-none text-sm">
                    <option>Lagos (any area)</option>
                    <option>Lagos Island</option>
                    <option>Remote only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-1.5">Duration available</label>
                  <select className="w-full p-3.5 border border-neutral-200 rounded-xl bg-white focus:ring-2 focus:ring-slate-900 outline-none text-sm">
                    <option>4-6 weeks</option>
                    <option>3 months</option>
                    <option>6 months</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-3">Organisation type preference (pick up to 2)</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      'Government / MDAs', 'Private company (large)', 'Startup', 
                      'NGO / nonprofit', 'Research institution', 'Hospital / clinic',
                      'Bank / financial firm', 'No preference'
                    ].map(type => (
                      <button 
                        key={type}
                        onClick={() => {
                          const currentPrefs = formData.org_type_preference;
                          if (currentPrefs.includes(type)) {
                            updateFormData({ org_type_preference: currentPrefs.filter(t => t !== type) });
                          } else if (currentPrefs.length < 2) {
                            updateFormData({ org_type_preference: [...currentPrefs, type] });
                          }
                        }}
                        className={`px-4 py-2 border rounded-full text-sm transition-colors ${
                          formData.org_type_preference.includes(type)
                            ? 'border-slate-900 bg-slate-900 text-white'
                            : 'border-neutral-200 text-neutral-600 hover:border-slate-900 hover:text-slate-900'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-900 mb-1.5">Is there anything you're worried about? (optional)</label>
              <textarea 
                placeholder="e.g. I'm concerned I don't have enough experience. / I've never worked in a professional setting before. / I'm not sure if my skills are good..." 
                className="w-full p-4 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none min-h-[100px] resize-y text-sm mb-2"
              />
              <p className="text-xs text-neutral-500">This is private and just helps us write a better learning pathway for you. It's okay to be honest here.</p>
            </div>

            <div className="pt-6 border-t border-neutral-100 flex gap-4">
              <button onClick={prevStep} className="px-6 py-4 rounded-xl border border-neutral-200 text-slate-900 font-semibold hover:bg-neutral-50 transition-colors">
                ← Back
              </button>
              <button onClick={nextStep} className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors">
                Continue →
              </button>
            </div>
          </div>
        )}

        {currentStep === 8 && (
          <div className="space-y-8 animate-fadeIn">
            <div>
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Step 8 of 8 — Almost There!</p>
              <h2 className="text-3xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                Your profile is ready to submit <span className="text-4xl">🎉</span>
              </h2>
              <p className="text-neutral-500 leading-relaxed text-sm">
                Here's a preview of your initial Fit Score and what happens after you submit. Everything gets refined once the verification stage begins.
              </p>
            </div>

            <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-6">
              <h3 className="font-bold text-slate-900 mb-6 text-sm">Profile Summary</h3>
              
              <div className="space-y-4">
                {(() => {
                  const family = dbJobFamilies.find(f => f.id === formData.job_family);
                  const role = family?.sub_roles.find((r: any) => r.id === formData.sub_role);
                  return (
                    <>
                      <div className="flex items-center justify-between gap-4 border-b border-neutral-200 pb-3">
                        <span className="text-sm text-neutral-600 flex-1">Job Family</span>
                        <span className="text-sm font-bold text-slate-900 text-right">{family?.name || 'Not selected'}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 border-b border-neutral-200 pb-3">
                        <span className="text-sm text-neutral-600 flex-1">Sub-Role</span>
                        <span className="text-sm font-bold text-slate-900 text-right">{role?.name || 'Not selected'}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 border-b border-neutral-200 pb-3">
                        <span className="text-sm text-neutral-600 flex-1">Coursework</span>
                        <span className="text-sm font-bold text-slate-900 text-right">{formData.coursework.length} courses</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 border-b border-neutral-200 pb-3">
                        <span className="text-sm text-neutral-600 flex-1">Skills Rated</span>
                        <span className="text-sm font-bold text-slate-900 text-right">{Object.keys(formData.technical_skills).length + Object.keys(formData.soft_skills).length} skills</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 border-b border-neutral-200 pb-3">
                        <span className="text-sm text-neutral-600 flex-1">Projects</span>
                        <span className="text-sm font-bold text-slate-900 text-right">{formData.projects.length} projects</span>
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className="mt-8 pt-6 border-t border-neutral-200 flex items-center justify-between">
                <span className="text-sm text-neutral-600">Estimated starting tier</span>
                <span className="bg-neutral-200 text-slate-900 text-xs font-bold px-3 py-1.5 rounded-full">
                  Tier 1-3 (pending verification)
                </span>
              </div>
            </div>

            <div className="pt-6 border-t border-neutral-100">
              <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-6">What Happens Next</h3>
              
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px before:h-full before:w-0.5 before:bg-neutral-200 pl-10">
                
                <div className="relative flex items-start">
                  <div className="absolute left-[-40px] flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 text-white flex-shrink-0 z-10">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  </div>
                  <div className="text-left pb-6">
                    <span className="inline-block px-2 py-0.5 bg-slate-900 text-white text-[10px] font-bold rounded uppercase tracking-wider mb-2">Now</span>
                    <h4 className="font-bold text-slate-900 text-sm mb-1">Profile submitted</h4>
                    <p className="text-xs text-neutral-500 leading-relaxed max-w-md">Your self-reported data is stored. Initial Fit Score calculated using the Weighted Sum Model. You receive a preliminary tier estimate.</p>
                  </div>
                </div>

                <div className="relative flex items-start">
                  <div className="absolute left-[-40px] flex items-center justify-center w-8 h-8 rounded-full bg-white border-2 border-neutral-200 text-neutral-500 font-bold text-xs flex-shrink-0 z-10">
                    2
                  </div>
                  <div className="text-left pb-6">
                    <span className="inline-block px-2 py-0.5 border border-neutral-200 text-neutral-500 text-[10px] font-bold rounded uppercase tracking-wider mb-2">Within 48 hrs</span>
                    <h4 className="font-bold text-slate-900 text-sm mb-1">Automated diagnostic tasks</h4>
                    <p className="text-xs text-neutral-500 leading-relaxed max-w-md">Short field-specific tasks arrive by email. 15-20 minutes. Not a high-stakes exam — just brief real-world scenarios that confirm your skill claims.</p>
                  </div>
                </div>

                <div className="relative flex items-start">
                  <div className="absolute left-[-40px] flex items-center justify-center w-8 h-8 rounded-full bg-white border-2 border-neutral-200 text-neutral-500 font-bold text-xs flex-shrink-0 z-10">
                    3
                  </div>
                  <div className="text-left pb-6">
                    <span className="inline-block px-2 py-0.5 border border-neutral-200 text-neutral-500 text-[10px] font-bold rounded uppercase tracking-wider mb-2">Week 1-2</span>
                    <h4 className="font-bold text-slate-900 text-sm mb-1">Evidence review & matric verification</h4>
                    <p className="text-xs text-neutral-500 leading-relaxed max-w-md">LASU registry confirms your enrollment. Any uploaded certificates or GitHub portfolios are automatically cross-checked.</p>
                  </div>
                </div>

                <div className="relative flex items-start">
                  <div className="absolute left-[-40px] flex items-center justify-center w-8 h-8 rounded-full bg-white border-2 border-neutral-200 text-neutral-500 font-bold text-xs flex-shrink-0 z-10">
                    4
                  </div>
                  <div className="text-left pb-6">
                    <span className="inline-block px-2 py-0.5 border border-neutral-200 text-neutral-500 text-[10px] font-bold rounded uppercase tracking-wider mb-2">Week 2-3</span>
                    <h4 className="font-bold text-slate-900 text-sm mb-1">Final tier assignment & matching</h4>
                    <p className="text-xs text-neutral-500 leading-relaxed max-w-md">Your verified Fit Score determines your final tier. The system surfaces top 3-5 matched organisations. You review, rank preferences, and receive an offer.</p>
                  </div>
                </div>

                <div className="relative flex items-start">
                  <div className="absolute left-[-40px] flex items-center justify-center w-8 h-8 rounded-full bg-white border-2 border-neutral-200 text-neutral-500 font-bold text-xs flex-shrink-0 z-10">
                    5
                  </div>
                  <div className="text-left">
                    <span className="inline-block px-2 py-0.5 border border-neutral-200 text-neutral-500 text-[10px] font-bold rounded uppercase tracking-wider mb-2">Ongoing</span>
                    <h4 className="font-bold text-slate-900 text-sm mb-1">Internship + supervisor sign-off</h4>
                    <p className="text-xs text-neutral-500 leading-relaxed max-w-md">During placement, your supervisor provides mid- and end-of-internship assessments. Your competency rubric updates in real time. Your profile becomes a verified career record.</p>
                  </div>
                </div>

              </div>
            </div>

            <div className="pt-8 border-t border-neutral-100 flex gap-4">
              <button onClick={prevStep} disabled={loading} className="px-6 py-4 rounded-xl border border-neutral-200 text-slate-900 font-semibold hover:bg-neutral-50 transition-colors disabled:opacity-50">
                ← Back
              </button>
              <button onClick={handleSubmit} disabled={loading} className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-70">
                {loading ? 'Submitting...' : 'Submit my profile →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

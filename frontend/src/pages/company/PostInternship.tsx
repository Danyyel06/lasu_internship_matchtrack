import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../lib/axios';
import { useCompanyTier } from '../../lib/hooks/useCompanyTier';

export default function PostInternship() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(isEditMode);
  const { capabilities, isLoading: isTierLoading, trustTier } = useCompanyTier();
  const [activePostingsCount, setActivePostingsCount] = useState(0);
  const [formData, setFormData] = useState({
    title: '',
    jobFamily: '',
    trackType: 'Competitive',
    location: '',
    duration: '6 Months',
    stipendMin: '',
    stipendMax: '',
    description: '',
    requirements: '',
    totalSlots: '1',
    deadline: '',
  });

  const [skillRequirements, setSkillRequirements] = useState<{skill_name: string; required_level: number}[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleTrackChange = (track: string) => {
    setFormData({ ...formData, trackType: track });
  };

  const [errorMsg, setErrorMsg] = useState('');
  const [jobFamilies, setJobFamilies] = useState<{id: number, name: string}[]>([]);

  useEffect(() => {
    // Fetch job families
    const fetchJobFamilies = async () => {
      try {
        const res = await api.get('/job-families/');
        if (Array.isArray(res.data)) {
          setJobFamilies(res.data);
        } else {
          console.error('Job families API returned non-array:', res.data);
          setJobFamilies([]);
        }
      } catch (err) {
        console.error('Failed to load job families', err);
        setJobFamilies([]);
      }
    };
    fetchJobFamilies();

    // Fetch existing postings to check limit
    const fetchCompanyPostings = async () => {
      try {
        const res = await api.get('/internships/company');
        if (Array.isArray(res.data)) {
          const active = res.data.filter((p: any) => p.status !== 'closed').length;
          setActivePostingsCount(active);
        }
      } catch (err) {
        console.error('Failed to load company postings count', err);
      }
    };
    fetchCompanyPostings();

    if (isEditMode) {
      const fetchInternship = async () => {
        try {
          const res = await api.get(`/internships/${id}`);
          const data = res.data;
          setFormData({
            title: data.title || '',
            jobFamily: data.job_family_id?.toString() || '',
            trackType: data.track_type || 'Competitive',
            location: data.location || '',
            duration: `${(data.duration_weeks || 24) / 4} Months`,
            stipendMin: data.stipend?.toString() || '',
            stipendMax: data.stipend?.toString() || '',
            description: data.description || '',
            requirements: '',
            totalSlots: data.total_slots?.toString() || '1',
            deadline: data.application_deadline || '',
          });
          if (data.requirements && data.requirements.length > 0) {
            setSkillRequirements(data.requirements.map((r: any) => ({
              skill_name: r.skill_name,
              required_level: r.required_level || 3
            })));
          }
        } catch (err) {
          console.error("Failed to load internship", err);
          setErrorMsg("Failed to load internship details.");
        } finally {
          setInitialLoad(false);
        }
      };
      fetchInternship();
    }
  }, [id, isEditMode]);

  const handleSubmit = async (e: React.FormEvent, submitStatus: 'open' | 'draft' = 'open') => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      // Set baseline requirement level to 1 (met if student possesses the skill)
      const formattedRequirements = skillRequirements
        .filter(s => s.skill_name.trim())
        .map(s => ({ skill_name: s.skill_name.trim(), required_level: 1, is_mandatory: true }));

      if (formattedRequirements.length === 0) {
        throw new Error('Please add at least one skill requirement.');
      }

      const payload = {
        title: formData.title,
        job_family_id: parseInt(formData.jobFamily) || 1,
        track_type: formData.trackType,
        location: formData.location,
        duration_weeks: parseInt(formData.duration.split(' ')[0]) * 4,
        stipend: parseFloat(formData.stipendMin) || 0,
        description: formData.description,
        status: submitStatus,
        total_slots: parseInt(formData.totalSlots) || 1,
        application_deadline: formData.deadline || null,
        accepted_tiers: formData.trackType === 'Competitive' ? ['T1'] : ['T1', 'T2', 'T3'],
        requirements: formattedRequirements
      };
      
      if (isEditMode) {
        await api.put(`/internships/${id}`, payload);
      } else {
        await api.post('/internships/', payload);
      }
      
      setLoading(false);
      navigate('/company/postings');
    } catch (err: any) {
      console.error(err);
      if (err instanceof Error && err.message.includes('Requirements should be')) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg(`Failed to ${isEditMode ? 'update' : 'post'} internship. Please try again.`);
      }
      setLoading(false);
    }
  };

  if (initialLoad) {
    return <div className="flex justify-center py-12"><div className="animate-spin text-4xl">⏳</div></div>;
  }

  const isTierLocked = !isTierLoading && capabilities !== null && !capabilities.post_internship;
  const isMaxReached = !isEditMode && !isTierLoading && capabilities !== null && capabilities.post_internship_max !== null && activePostingsCount >= capabilities.post_internship_max;
  const isLocked = isTierLocked || isMaxReached;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">{isEditMode ? 'Edit Internship' : 'Post an Internship'}</h1>
        <p className="text-sm text-neutral-500 mt-1">{isEditMode ? 'Update the details of your internship opportunity.' : 'Publish a new opportunity and start receiving verified applicants.'}</p>
      </div>

      {isTierLocked && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-sm text-blue-800 font-medium">To post internships, complete Level 2 verification.</p>
          <Link to="/company/verification" className="flex-shrink-0 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors">
            Start Level 2 verification
          </Link>
        </div>
      )}

      {isMaxReached && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm text-amber-900 font-bold">Active Posting Limit Reached ({activePostingsCount}/{capabilities?.post_internship_max})</p>
            <p className="text-xs text-amber-700 mt-0.5">Level {trustTier} verification allows up to {capabilities?.post_internship_max} active internship postings. To post more, upgrade to Level 3 for unlimited postings or close an existing posting.</p>
          </div>
          <Link to="/company/verification" className="flex-shrink-0 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-lg transition-colors">
            Upgrade to Level 3
          </Link>
        </div>
      )}

      <div className={isLocked ? 'opacity-50 pointer-events-none select-none' : ''}>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        
        {/* Track Type Selection */}
        <div className="p-6 border-b border-neutral-200 bg-neutral-50/50">
          <label className="text-sm font-bold text-neutral-900 mb-3 block">Placement Track *</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Competitive Track Card */}
            <div
              onClick={() => handleTrackChange('Competitive')}
              className={`cursor-pointer rounded-xl border-2 p-4 transition-all duration-200 ${
                formData.trackType === 'Competitive'
                  ? 'border-blue-500 bg-blue-50/30 shadow-sm'
                  : 'border-neutral-200 bg-white hover:border-neutral-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${formData.trackType === 'Competitive' ? 'border-blue-500 bg-blue-500' : 'border-neutral-300'}`}>
                    {formData.trackType === 'Competitive' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                  </div>
                  <span className={`font-bold ${formData.trackType === 'Competitive' ? 'text-blue-900' : 'text-neutral-700'}`}>Competitive Track</span>
                </div>
                <span className="text-lg">🏆</span>
              </div>
              <p className="text-xs text-neutral-500 leading-relaxed pl-6">
                Strict skill filtering. Only students who meet your exact technical requirements will be shown.
              </p>
            </div>

            {/* Equity Track Card */}
            <div
              onClick={() => handleTrackChange('Equity')}
              className={`cursor-pointer rounded-xl border-2 p-4 transition-all duration-200 ${
                formData.trackType === 'Equity'
                  ? 'border-purple-500 bg-purple-50/30 shadow-sm'
                  : 'border-neutral-200 bg-white hover:border-neutral-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${formData.trackType === 'Equity' ? 'border-purple-500 bg-purple-500' : 'border-neutral-300'}`}>
                    {formData.trackType === 'Equity' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                  </div>
                  <span className={`font-bold ${formData.trackType === 'Equity' ? 'text-purple-900' : 'text-neutral-700'}`}>Equity & Developmental</span>
                </div>
                <span className="text-lg">🌱</span>
              </div>
              <p className="text-xs text-neutral-500 leading-relaxed pl-6">
                Broad talent pool. Students interleaved from all tiers. Boosts your Fair Participation Score.
              </p>
            </div>

          </div>
        </div>

        {/* Basic Information */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-sm font-medium text-neutral-900">Internship Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Frontend Developer Intern"
                className="w-full p-2.5 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-green-600 focus:border-transparent outline-none text-sm"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-900">Job Family *</label>
              <select
                name="jobFamily"
                value={formData.jobFamily}
                onChange={handleChange}
                className="w-full p-2.5 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-green-600 focus:border-transparent outline-none text-sm bg-white"
                required
              >
                <option value="">Select category...</option>
                {Array.isArray(jobFamilies) && jobFamilies.map(jf => (
                  <option key={jf?.id} value={jf?.id}>{jf?.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-900">Location *</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g. Lagos, Yaba (Hybrid)"
                className="w-full p-2.5 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-green-600 focus:border-transparent outline-none text-sm"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-900">Stipend Range (NGN) *</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  name="stipendMin"
                  value={formData.stipendMin}
                  onChange={handleChange}
                  placeholder="Min"
                  className="w-full p-2.5 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-green-600 focus:border-transparent outline-none text-sm"
                  required
                />
                <span className="text-neutral-400">-</span>
                <input
                  type="number"
                  name="stipendMax"
                  value={formData.stipendMax}
                  onChange={handleChange}
                  placeholder="Max"
                  className="w-full p-2.5 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-green-600 focus:border-transparent outline-none text-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-900">Duration *</label>
              <select
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                className="w-full p-2.5 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-green-600 focus:border-transparent outline-none text-sm bg-white"
                required
              >
                <option value="3 Months">3 Months</option>
                <option value="6 Months">6 Months</option>
                <option value="12 Months">12 Months</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-900">Total Slots *</label>
              <input
                type="number"
                name="totalSlots"
                value={formData.totalSlots}
                onChange={handleChange}
                min="1"
                max="100"
                placeholder="e.g. 5"
                className="w-full p-2.5 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-green-600 focus:border-transparent outline-none text-sm"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-900">Application Deadline</label>
              <input
                type="date"
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
                className="w-full p-2.5 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-green-600 focus:border-transparent outline-none text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-900">Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              placeholder="Describe the responsibilities and day-to-day tasks..."
              className="w-full p-2.5 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-green-600 focus:border-transparent outline-none text-sm resize-y"
              required
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-neutral-900">Required Skills *</label>
            <p className="text-xs text-neutral-500 mb-2">Add the core skills students should have for this role (e.g. React, Figma, Python). These are checked during candidate matching.</p>
            
            {skillRequirements.map((req, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2 bg-neutral-50 rounded-lg border border-neutral-200">
                <span className="w-2 h-2 rounded-full bg-blue-500 ml-2 shrink-0"></span>
                <input
                  type="text"
                  value={req.skill_name}
                  onChange={(e) => {
                    const updated = [...skillRequirements];
                    updated[idx] = { ...updated[idx], skill_name: e.target.value };
                    setSkillRequirements(updated);
                  }}
                  placeholder="e.g. React, Python, Figma..."
                  className="flex-1 px-3 py-2 bg-white rounded-md border border-neutral-300 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-sm"
                />
                <button
                  type="button"
                  onClick={() => setSkillRequirements(skillRequirements.filter((_, i) => i !== idx))}
                  className="text-neutral-400 hover:text-red-600 p-2 shrink-0 transition-colors"
                  title="Remove skill"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() => setSkillRequirements([...skillRequirements, { skill_name: '', required_level: 1 }])}
              className="w-full py-2.5 border-2 border-dashed border-neutral-300 rounded-lg text-sm font-medium text-neutral-500 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add Required Skill
            </button>
          </div>
        </div>

        {/* Footer actions */}
        {errorMsg && <div className="p-4 bg-red-50 text-red-700 text-sm">{errorMsg}</div>}
        <div className="p-6 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/company/postings')}
            className="px-6 py-2.5 text-sm font-bold text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            Cancel
          </button>
          <div className="flex items-center gap-3">
            {!isEditMode && (
              <button
                type="button"
                disabled={loading}
                onClick={(e) => handleSubmit(e as any, 'draft')}
                className="px-5 py-2.5 border border-neutral-300 text-neutral-700 text-sm font-bold rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50"
              >
                Save as Draft
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-neutral-900 text-white text-sm font-bold rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-50"
            >
              {loading ? (isEditMode ? 'Updating...' : 'Publishing...') : (isEditMode ? 'Save Changes' : 'Publish Internship')}
            </button>
          </div>
        </div>
      </form>
      </div>
    </div>
  );
}

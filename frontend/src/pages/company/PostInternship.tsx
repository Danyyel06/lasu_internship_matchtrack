import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../lib/axios';

export default function PostInternship() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(isEditMode);
  const [formData, setFormData] = useState({
    title: '',
    jobFamily: '',
    trackType: 'Competitive', // Competitive or Equity
    location: '',
    duration: '6 Months',
    stipendMin: '',
    stipendMax: '',
    description: '',
    requirements: '',
  });

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
            requirements: data.requirements?.map((r: any) => r.skill_name).join(', ') || ''
          });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const formattedRequirements = formData.requirements
        .split(',')
        .map(s => s.trim())
        .filter(s => s)
        .map(s => ({ skill_name: s, required_level: 3, is_mandatory: true }));

      const payload = {
        title: formData.title,
        job_family_id: parseInt(formData.jobFamily) || 1, // Fallback to 1 if not set correctly
        track_type: formData.trackType,
        location: formData.location,
        duration_weeks: parseInt(formData.duration.split(' ')[0]) * 4, // roughly 4 weeks per month
        stipend: parseFloat(formData.stipendMin) || 0, // Simplified to min stipend
        description: formData.description,
        status: "open",
        total_slots: 1, // Defaulting to 1 for now
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
    } catch (err) {
      console.error(err);
      setErrorMsg(`Failed to ${isEditMode ? 'update' : 'post'} internship. Please try again.`);
      setLoading(false);
    }
  };

  if (initialLoad) {
    return <div className="flex justify-center py-12"><div className="animate-spin text-4xl">⏳</div></div>;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">{isEditMode ? 'Edit Internship' : 'Post an Internship'}</h1>
        <p className="text-sm text-neutral-500 mt-1">{isEditMode ? 'Update the details of your internship opportunity.' : 'Publish a new opportunity and start receiving verified applicants.'}</p>
      </div>

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

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-900">Requirements *</label>
            <textarea
              name="requirements"
              value={formData.requirements}
              onChange={handleChange}
              rows={3}
              placeholder="List specific skills or coursework expected..."
              className="w-full p-2.5 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-green-600 focus:border-transparent outline-none text-sm resize-y"
              required
            />
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
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-neutral-900 text-white text-sm font-bold rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-50"
          >
            {loading ? (isEditMode ? 'Updating...' : 'Publishing...') : (isEditMode ? 'Save Changes' : 'Publish Internship')}
          </button>
        </div>
      </form>
    </div>
  );
}

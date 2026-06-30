import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../lib/axios';

export default function InternshipDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [applying, setApplying] = useState(false);

  const [internship, setInternship] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  useEffect(() => {
    const fetchInternship = async () => {
      try {
        const res = await api.get(`/internships/${id}`);
        setInternship({
          ...res.data,
          matchPercentage: res.data.match_percentage,
          postedDaysAgo: 0,
          requirementsList: res.data.requirements?.map((req: any) => `${req.skill_name} (Level ${req.required_level})`) || [],
          gapAnalysis: res.data.gap_analysis || []
        });
      } catch (err) {
        console.error('Failed to load internship', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInternship();
  }, [id]);

  const handleApply = async () => {
    setApplying(true);
    setErrorMsg('');
    try {
      await api.post('/applications/', { internship_id: Number(id) });
      setApplying(false);
      navigate('/student/applications');
    } catch (err: any) {
      console.error('Failed to apply', err);
      setErrorMsg(err.response?.data?.detail || 'Failed to apply.');
      setApplying(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><div className="animate-spin text-4xl">⏳</div></div>;
  }
  
  if (!internship) {
    return <div className="text-center p-12">Internship not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <div>
        <Link to="/student/browse" className="inline-flex items-center gap-2 text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"></path></svg>
          Back to Browse
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Card */}
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6 sm:p-8">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-neutral-100 flex items-center justify-center font-bold text-2xl text-neutral-500">
                  {internship.company_name ? internship.company_name.charAt(0).toUpperCase() : 'C'}
                </div>
                <div>
                  <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight mt-1 mb-2">{internship.title}</h1>
                  <p className="text-neutral-500 font-medium flex items-center gap-2">
                    <span className="text-lg">📍</span> {internship.location || 'Location TBD'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 text-sm text-neutral-600 border-t border-neutral-100 pt-6">
              <div className="flex items-center justify-between">
                <span className="text-neutral-500 font-medium flex items-center gap-2"><span className="text-xl">💰</span> Stipend</span>
                <span className="font-bold text-neutral-900">{internship.stipend ? `NGN ${internship.stipend}` : 'Unpaid / TBD'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500 font-medium flex items-center gap-2"><span className="text-xl">⏳</span> Duration</span>
                <span className="font-bold text-neutral-900">{internship.duration_weeks ? `${internship.duration_weeks / 4} Months` : 'TBD'}</span>
              </div>
            </div>
          </div>

          {/* Description & Requirements */}
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6 sm:p-8 space-y-8">
            <section>
              <h2 className="text-lg font-bold text-neutral-900 mb-3">About the Role</h2>
              <p className="text-neutral-600 leading-relaxed">{internship.description}</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-neutral-900 mb-3">Requirements</h2>
              <ul className="space-y-2">
                {internship.requirementsList.map((req: string, i: number) => (
                  <li key={i} className="flex items-start gap-3 text-neutral-600">
                    <span className="text-violet-500 mt-1">•</span>
                    <span className="leading-relaxed">{req}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Fit Score & Analysis Card */}
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden sticky top-24">
            <div className="p-6 border-b border-neutral-100">
              <div className="flex items-center justify-between mb-4">
                <span className="font-bold text-neutral-900">Your Fit Score</span>
                <span className={`text-2xl font-black ${internship.matchPercentage >= 80 ? 'text-green-600' : internship.matchPercentage >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                  {internship.matchPercentage}%
                </span>
              </div>
              <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden mb-6">
                <div 
                  className={`h-full rounded-full ${internship.matchPercentage >= 80 ? 'bg-green-500' : internship.matchPercentage >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                  style={{ width: `${internship.matchPercentage}%` }}
                />
              </div>

              <div className="space-y-4">
                <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">Gap Analysis</p>
                {internship.gapAnalysis && internship.gapAnalysis.map((gap: any, i: number) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-neutral-900">{gap.skill_name}</span>
                      {gap.meets_requirement ? (
                        <span className="text-green-600 font-medium flex items-center gap-1">✅ Met</span>
                      ) : (
                        <span className="text-red-600 font-medium flex items-center gap-1">❌ Missing</span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-500 leading-relaxed">
                      {gap.meets_requirement ? `Student Level ${gap.student_level} / Required ${gap.required_level}` : `Gap: ${gap.gap} levels (Required ${gap.required_level}, Student has ${gap.student_level})`}
                    </p>
                  </div>
                ))}
                {!internship.gapAnalysis || internship.gapAnalysis.length === 0 && (
                  <p className="text-xs text-neutral-500">No skill requirements specified or gap analysis unavailable.</p>
                )}
              </div>
            </div>

            <div className="p-6 bg-neutral-50 flex flex-col gap-3">
              <div className="flex items-center gap-2 mb-2">
                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  internship.track_type === 'Competitive' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                }`}>
                  {internship.track_type} Track
                </span>
              </div>
              <p className="text-xs text-neutral-500 leading-relaxed">
                {internship.track_type === 'Competitive' 
                  ? 'Only top-tier candidates matching specific skills will be considered.' 
                  : 'Open to a diverse talent pool across all tiers to foster development.'}
              </p>

              <button 
                onClick={handleApply}
                disabled={applying}
                className="mt-2 w-full py-3.5 bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white font-semibold rounded-xl transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {applying ? (
                  <>Submitting...</>
                ) : (
                  <>
                    Apply Now
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                  </>
                )}
              </button>
              {errorMsg && <p className="text-sm text-red-600 mt-2">{errorMsg}</p>}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

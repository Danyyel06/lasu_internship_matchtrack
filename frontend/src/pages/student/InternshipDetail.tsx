import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../lib/axios';

export default function InternshipDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [applying, setApplying] = useState(false);

  const [internship, setInternship] = useState<any>(null);
  const [hasAcceptedPlacement, setHasAcceptedPlacement] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [res, applicationsRes] = await Promise.all([
          api.get(`/internships/${id}`),
          api.get('/applications/mine')
        ]);
        
        setInternship({
          ...res.data,
          matchPercentage: res.data.match_percentage,
          postedDaysAgo: 0,
          requirementsList: res.data.requirements?.map((req: any) => req.skill_name) || [],
          gapAnalysis: res.data.gap_analysis || []
        });

        const isPlaced = applicationsRes.data.some((app: any) => app.status === 'accepted' || app.status === 'Accepted');
        setHasAcceptedPlacement(isPlaced);
      } catch (err) {
        console.error('Failed to load data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
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
                <div className="w-16 h-16 rounded-xl bg-neutral-100 flex items-center justify-center font-bold text-2xl text-neutral-500 shrink-0">
                  {internship.company_name ? internship.company_name.charAt(0).toUpperCase() : 'C'}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-bold text-neutral-600">{internship.company_name}</span>
                    {internship.is_individual_verified ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                        👤 Individual Host
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-neutral-100 text-neutral-700 border border-neutral-200">
                        🏢 Verified Company
                      </span>
                    )}
                  </div>
                  <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight mb-2">{internship.title}</h1>
                  <p className="text-neutral-500 font-medium flex items-center gap-2">
                    <span className="text-lg">📍</span> {internship.location || 'Location TBD'}
                  </p>
                </div>
              </div>
            </div>

            {internship.is_individual_verified && (
              <div className="mb-6 p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
                <span className="text-base mt-0.5 shrink-0">👤</span>
                <div>
                  <span className="font-bold">Individual / Solo Host Placement:</span>
                  <span className="text-amber-800 ml-1">
                    This internship opportunity is hosted directly by an individual professional rather than an incorporated company team. You will be reporting to and working directly under their mentorship.
                  </span>
                </div>
              </div>
            )}

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

              <div className="mt-6">
                <p className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3">Gap Analysis</p>
                {internship.gapAnalysis && internship.gapAnalysis.length > 0 ? (
                  <ul className="divide-y divide-neutral-100 border-t border-neutral-100">
                    {internship.gapAnalysis.map((gap: any, i: number) => (
                      <li key={i} className="py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-neutral-900 leading-tight">{gap.skill_name}</p>
                            <p className="text-xs text-neutral-500 mt-1">
                              {gap.meets_requirement ? 'Required skill met' : 'Skill missing — not yet added to profile'}
                            </p>
                          </div>
                          <div className="shrink-0 mt-0.5">
                            {gap.meets_requirement ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-50 text-green-700 text-[10px] font-bold uppercase tracking-wider border border-green-100">
                                ✅ Met
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-50 text-red-700 text-[10px] font-bold uppercase tracking-wider border border-red-100">
                                ❌ Missing
                              </span>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
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

              {hasAcceptedPlacement ? (
                <div className="mt-2 w-full py-3.5 bg-green-50 text-green-700 font-semibold rounded-xl border border-green-200 text-center">
                  You have already accepted a placement.
                </div>
              ) : (
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
              )}
              {errorMsg && <p className="text-sm text-red-600 mt-2">{errorMsg}</p>}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

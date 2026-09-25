import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/axios';


interface Internship {
  id: string;
  company_name: string;
  title: string;
  location: string;
  track_type: 'Competitive' | 'Equity';
  stipend: string;
  duration_weeks: number;
  match_percentage: number;
  created_at: string;
  is_individual_verified?: boolean;
  verification_method?: string;
  trust_tier?: number;
  gap_analysis?: {
    skill_name: string;
    required_level: number;
    student_level: number;
    meets_requirement: boolean;
  }[];
}

export default function BrowseInternships() {
  const [internships, setInternships] = useState<Internship[]>([]);
  const [hasAcceptedPlacement, setHasAcceptedPlacement] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTrack, setFilterTrack] = useState('All');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        
        const [internshipsRes, applicationsRes] = await Promise.all([
          api.get('/internships/', { headers }),
          api.get('/applications/mine', { headers })
        ]);
        
        setInternships(internshipsRes.data);
        
        const isPlaced = applicationsRes.data.some((app: any) => app.status === 'accepted' || app.status === 'Accepted');
        setHasAcceptedPlacement(isPlaced);
      } catch (error) {
        console.error("Failed to load data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredInternships = internships.filter(internship => 
    (filterTrack === 'All' || internship.track_type === filterTrack) &&
    (internship.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
     (internship.company_name && internship.company_name.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Browse Internships</h1>
          <p className="text-sm text-neutral-500 mt-1">Discover opportunities matched to your skills.</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-neutral-400">🔍</span>
          </div>
          <input
            type="text"
            placeholder="Search roles or companies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 p-2.5 border border-neutral-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-violet-600 outline-none"
          />
        </div>
        <select 
          value={filterTrack} 
          onChange={(e) => setFilterTrack(e.target.value)}
          className="p-2.5 border border-neutral-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-violet-600 outline-none md:w-48"
        >
          <option value="All">All Tracks</option>
          <option value="Competitive">Competitive</option>
          <option value="Equity">Equity</option>
        </select>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center p-12"><div className="animate-spin text-4xl">⏳</div></div>
      ) : hasAcceptedPlacement ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center mt-6">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
            🎉
          </div>
          <h2 className="text-xl font-bold text-green-900 mb-2">You've been placed!</h2>
          <p className="text-green-800 mb-6 max-w-md mx-auto">
            Congratulations! Since you have already accepted an internship placement, you can no longer apply for other roles. 
            It's time to focus on your new role.
          </p>
          <Link to="/student/log" className="inline-flex items-center justify-center px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors">
            Go to Evidence Log
          </Link>
        </div>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredInternships.map((internship) => (
          <div key={internship.id} className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden flex flex-col hover:border-violet-300 transition-colors">
            <div className="p-5 border-b border-neutral-100">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center font-bold text-neutral-500">
                    {internship.company_name ? internship.company_name.charAt(0).toUpperCase() : 'C'}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h2 className="font-bold text-neutral-900">{internship.company_name || 'Unknown'}</h2>
                      {internship.is_individual_verified ? (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200" title="This internship is hosted by an individual practitioner/sole host">
                          👤 Individual Host
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-neutral-100 text-neutral-600 border border-neutral-200" title="Incorporated company / organisation">
                          🏢 Company
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-neutral-500">{new Date(internship.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <span className={`inline-flex px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                  internship.track_type === 'Competitive' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                }`}>
                  {internship.track_type}
                </span>
              </div>
              <h3 className="text-lg font-bold text-neutral-900 leading-tight mb-1">{internship.title}</h3>
              <p className="text-sm text-neutral-500 flex items-center gap-1.5">
                <span>📍</span> {internship.location || 'Location TBD'}
              </p>
            </div>
            
            <div className="p-5 flex-1 space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-500 flex items-center gap-1.5"><span className="text-neutral-400">💰</span> Stipend</span>
                <span className="font-medium text-neutral-900">{internship.stipend ? `NGN ${internship.stipend}` : 'Unpaid / TBD'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-500 flex items-center gap-1.5"><span className="text-neutral-400">⏳</span> Duration</span>
                <span className="font-medium text-neutral-900">{internship.duration_weeks ? `${internship.duration_weeks / 4} Months` : 'TBD'}</span>
              </div>

              {/* Match Score & Gap Analysis */}
              <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-neutral-900">Your Fit Score</span>
                  <span className={`font-bold ${internship.match_percentage >= 80 ? 'text-green-600' : internship.match_percentage >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                    {internship.match_percentage}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-neutral-200 rounded-full overflow-hidden mb-3">
                  <div 
                    className={`h-full rounded-full ${internship.match_percentage >= 80 ? 'bg-green-500' : internship.match_percentage >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${internship.match_percentage}%` }}
                  />
                </div>
                {internship.gap_analysis && internship.gap_analysis.length > 0 && (
                  <div className="space-y-1.5 mt-3 pt-3 border-t border-neutral-200/60">
                    <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 block">Skill Gap Analysis</span>
                    <div className="flex flex-col gap-1.5">
                      {internship.gap_analysis.map((gap, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <span className="font-medium text-neutral-700">{gap.skill_name}</span>
                          {gap.meets_requirement ? (
                            <span className="text-green-600 font-bold flex items-center gap-1">
                              ✅ Met
                            </span>
                          ) : (
                            <span className="text-red-600 font-bold flex items-center gap-1">
                              ❌ Missing
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-neutral-100 bg-neutral-50 flex items-center justify-between">
              <Link to={`/student/browse/${internship.id}`} className="text-sm font-semibold text-violet-600 hover:text-violet-700 transition-colors">
                View Details
              </Link>
              <Link to={`/student/browse/${internship.id}`} className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm">
                Apply Now
              </Link>
            </div>
          </div>
        ))}
      </div>
      )}

      {filteredInternships.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-neutral-200 shadow-sm">
          <span className="text-4xl">🔍</span>
          <h3 className="mt-4 text-lg font-medium text-neutral-900">No internships found</h3>
          <p className="mt-1 text-neutral-500">Try adjusting your search or filters.</p>
        </div>
      )}
    </div>
  );
}

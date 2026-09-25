import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../../lib/axios';
import { useCompanyTier } from '../../lib/hooks/useCompanyTier';

export default function DashboardHome() {
  const [companyName, setCompanyName] = useState('Company');
  const [activePostings, setActivePostings] = useState<any[]>([]);
  const [totalApplications, setTotalApplications] = useState(0);
  const { trustTier, tiers, isLoading } = useCompanyTier();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.company_name) {
          setCompanyName(payload.company_name);
        }
      } catch (e) {
        console.error('Error decoding token', e);
      }
    }

    const fetchDashboardData = async () => {
      try {
        const [postingsRes, appsRes, profileRes] = await Promise.all([
          api.get('/internships/company'),
          api.get('/applications/company'),
          api.get('/companies/profile'),
        ]);
        setActivePostings(Array.isArray(postingsRes.data) ? postingsRes.data : (postingsRes.data?.items || []));
        const totalApps = appsRes.data?.total ?? (Array.isArray(appsRes.data) ? appsRes.data.length : (appsRes.data?.items?.length || 0));
        setTotalApplications(totalApps);
        if (profileRes.data?.company_name) {
          setCompanyName(profileRes.data.company_name);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      }
    };
    fetchDashboardData();
  }, []);

  const getTierChip = () => {
    if (isLoading) return null;
    const tierConfig: Record<number, { text: string, classes: string }> = {
      1: { text: "Level 1 · Registered", classes: "bg-blue-100 text-blue-700" },
      2: { text: "Level 2 · Verified", classes: "bg-teal-100 text-teal-700" },
      3: { text: "Level 3 · Accredited", classes: "bg-blue-600 text-white" },
      4: { text: "Level 4 · LASU Partner", classes: "bg-amber-100 text-amber-700" },
    };
    const isPending = tiers.some(t => t.status === 'pending');
    const conf = tierConfig[trustTier] || tierConfig[1];
    
    return (
      <Link to="/company/verification" className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold gap-1 h-fit mt-1 ${conf.classes}`}>
        {conf.text} {isPending && <span className="opacity-75 font-normal ml-1">· review in progress</span>}
      </Link>
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 leading-tight">Welcome,<br />{companyName}</h1>
            <div>{getTierChip()}</div>
          </div>
        </div>
        <Link
          to="/company/post-internship"
          className="inline-flex items-center justify-center px-5 py-2.5 bg-neutral-900 text-white text-sm font-semibold rounded-lg hover:bg-neutral-800 transition-colors w-full sm:w-auto"
        >
          New Posting
        </Link>
      </div>

      <div className="space-y-6">
        
        {/* Metrics Row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-sm flex flex-col justify-center">
            <h3 className="text-xs font-bold tracking-wider text-neutral-500 uppercase mb-2">Active Postings</h3>
            <p className="text-4xl font-bold text-neutral-900">{activePostings.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-sm flex flex-col justify-center">
            <h3 className="text-xs font-bold tracking-wider text-neutral-500 uppercase mb-2">Total Applications</h3>
            <p className="text-4xl font-bold text-neutral-900">{totalApplications}</p>
          </div>
        </div>

        {/* Active Postings List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">💼</span>
              <h2 className="text-lg font-bold text-neutral-900">Active Postings</h2>
            </div>
            <Link to="/company/postings" className="text-sm font-semibold text-neutral-900 hover:underline">View All</Link>
          </div>

          <div className="space-y-4">
            {activePostings.length === 0 ? (
              <div className="bg-white border border-neutral-200 rounded-xl p-8 shadow-sm text-center">
                <p className="text-sm text-neutral-500 font-medium">You have no active postings. Create one to get started.</p>
              </div>
            ) : (
              activePostings.map((posting) => (
                <div key={posting.id} className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-bold text-neutral-900">{posting.title}</h3>
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${posting.status === 'open' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-neutral-50 text-neutral-700 border-neutral-200'}`}>
                      {posting.status}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-neutral-100 text-neutral-600 gap-1">
                      <span>🚩</span> Track: {posting.track_type}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-neutral-100 text-neutral-600 gap-1">
                      <span>🪑</span> {posting.total_slots} Slots
                    </span>
                  </div>

                  {posting.application_deadline && (
                    <div className="flex items-center text-neutral-500 text-sm mb-5 gap-2">
                      <span>📅</span>
                      <span>Deadline: {posting.application_deadline}</span>
                    </div>
                  )}
                  
                  <div className="border-t border-neutral-100 mt-4 pt-4 flex gap-3">
                    <Link 
                      to={`/company/edit-internship/${posting.id}`}
                      className="flex-1 py-2 text-center border border-neutral-300 rounded-lg text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors block"
                    >
                      Edit
                    </Link>
                    <Link 
                      to={`/company/applications?posting=${posting.id}`}
                      className="flex-1 py-2 text-center bg-neutral-900 text-white rounded-lg text-sm font-semibold hover:bg-neutral-800 transition-colors block"
                    >
                      View Applicants
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

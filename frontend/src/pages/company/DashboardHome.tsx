import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../../lib/axios';

export default function DashboardHome() {
  const [companyName, setCompanyName] = useState('Company');
  const [activePostings, setActivePostings] = useState<any[]>([]);
  const [totalApplications, setTotalApplications] = useState(0);

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
        const postingsRes = await api.get('/internships/company');
        setActivePostings(postingsRes.data);
        
        const appsRes = await api.get('/applications/company');
        setTotalApplications(appsRes.data.length);
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      }
    };
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-neutral-900 leading-tight">Welcome,<br />{companyName}</h1>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 gap-1 h-fit mt-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
              Verified
            </span>
          </div>
        </div>
        <Link
          to="/company/post-internship"
          className="inline-flex items-center justify-center px-5 py-2.5 bg-neutral-900 text-white text-sm font-semibold rounded-lg hover:bg-neutral-800 transition-colors"
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

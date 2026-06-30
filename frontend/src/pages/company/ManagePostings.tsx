import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/axios';

export default function ManagePostings() {
  const [postings, setPostings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchPostings = async () => {
      try {
        const res = await api.get('/internships/company');
        setPostings(res.data);
      } catch (err: any) {
        console.error("Failed to fetch postings", err);
        setErrorMsg(err.response?.data?.detail || err.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchPostings();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this posting? This will also delete all associated applications permanently.")) return;
    try {
      await api.delete(`/internships/${id}`);
      setPostings(prev => prev.filter(p => p.id !== id));
    } catch (err: any) {
      console.error("Failed to delete posting", err);
      alert("Failed to delete posting. " + (err.response?.data?.detail || ""));
    }
  };

  const filteredPostings = postings.filter((p) => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Active') return p.status === 'open';
    if (activeTab === 'Closed') return p.status === 'closed';
    if (activeTab === 'Draft') return p.status === 'draft';
    return true;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Manage Postings</h1>
          <p className="text-sm text-neutral-500 mt-1">View and manage all your internship opportunities.</p>
        </div>
        <Link
          to="/company/post-internship"
          className="inline-flex items-center justify-center px-4 py-2 bg-neutral-900 text-white text-sm font-semibold rounded-lg hover:bg-neutral-800 transition-colors"
        >
          + New Posting
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="flex overflow-x-auto border-b border-neutral-200">
          {['All', 'Active', 'Closed', 'Draft'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-4 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-violet-600 text-violet-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
              }`}
            >
              {tab} Postings
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6">
          {errorMsg && (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 text-sm">
              Failed to load postings: {errorMsg}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin text-4xl">⏳</div>
            </div>
          ) : filteredPostings.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-neutral-200 rounded-xl">
              <span className="text-4xl block mb-4">📄</span>
              <h3 className="text-lg font-bold text-neutral-900 mb-1">No postings found</h3>
              <p className="text-sm text-neutral-500">You don't have any {activeTab.toLowerCase()} postings.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPostings.map((posting) => (
                <div key={posting.id} className="border border-neutral-200 rounded-xl p-5 hover:border-neutral-300 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-neutral-900">{posting.title}</h3>
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide ${
                          posting.status === 'open' ? 'bg-green-100 text-green-800' : 
                          posting.status === 'closed' ? 'bg-red-100 text-red-800' :
                          'bg-neutral-100 text-neutral-800'
                        }`}>
                          {posting.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-neutral-600">
                        <span className="flex items-center gap-1.5"><span className="text-neutral-400">📍</span> {posting.location}</span>
                        <span className="text-neutral-300">•</span>
                        <span className="flex items-center gap-1.5"><span className="text-neutral-400">⏳</span> {posting.duration_weeks / 4} Months</span>
                        <span className="text-neutral-300">•</span>
                        <span className="flex items-center gap-1.5"><span className="text-neutral-400">🎯</span> {posting.track_type}</span>
                        <span className="text-neutral-300">•</span>
                        <span className="flex items-center gap-1.5"><span className="text-neutral-400">🪑</span> {posting.total_slots} Slots</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 shrink-0">
                      <Link 
                        to={`/company/applications?posting=${posting.id}`}
                        className="px-4 py-2 bg-violet-50 text-violet-700 hover:bg-violet-100 rounded-lg text-sm font-semibold transition-colors"
                      >
                        View Applicants
                      </Link>
                      <Link
                        to={`/company/edit-internship/${posting.id}`}
                        className="px-4 py-2 border border-neutral-200 text-neutral-700 hover:bg-neutral-50 rounded-lg text-sm font-semibold transition-colors"
                      >
                        Edit
                      </Link>
                      <button 
                        onClick={() => handleDelete(posting.id)}
                        className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-sm font-semibold transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

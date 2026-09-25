import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/axios';

interface Application {
  id: string;
  internshipId: number;
  companyName: string;
  role: string;
  location: string;
  trackType: 'Competitive' | 'Equity';
  dateApplied: string;
  status: 'Pending' | 'Accepted' | 'Declined';
  fitScore: number;
}

export default function MyApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApps = async () => {
      try {
        const res = await api.get('/applications/mine');
        let mapped = res.data.map((app: any) => {
          const rawTrack = app.track_type || 'Competitive';
          const capitalizedTrack = rawTrack.charAt(0).toUpperCase() + rawTrack.slice(1);
          const rawScore = app.fit_score ? parseFloat(app.fit_score) : 0;
          
          return {
            id: app.id,
            internshipId: app.internship_id,
            companyName: app.company_name || 'Company',
            role: app.role || 'Internship',
            location: '', // Add if needed
            trackType: capitalizedTrack,
            dateApplied: new Date(app.applied_at).toLocaleDateString(),
            status: app.status === 'applied' ? 'Pending' : (app.status.charAt(0).toUpperCase() + app.status.slice(1)),
            fitScore: rawScore.toFixed(1)
          };
        });
        
        // If they have an accepted application, hide all others per exclusive placement rules
        const acceptedApp = mapped.find((app: any) => app.status === 'Accepted');
        if (acceptedApp) {
          mapped = [acceptedApp];
        }

        setApplications(mapped);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchApps();
  }, []);

  const handleWithdraw = async (id: string) => {
    if (!window.confirm("Are you sure you want to withdraw this application?")) return;
    try {
      await api.delete(`/applications/${id}`);
      setApplications(prev => prev.filter(app => app.id !== id));
    } catch (err) {
      console.error("Failed to withdraw application", err);
      alert("Failed to withdraw application");
    }
  };

  const filteredApps = applications.filter(app => 
    filterStatus === 'All' || app.status === filterStatus
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">My Applications</h1>
          <p className="text-sm text-neutral-500 mt-1">Track the status of your internship applications.</p>
        </div>
        <select 
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value)}
          className="p-2 border border-neutral-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-violet-600 outline-none"
        >
          <option value="All">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Accepted">Accepted</option>
          <option value="Declined">Declined</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center p-12"><div className="animate-spin text-4xl">⏳</div></div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 text-neutral-500 text-xs uppercase tracking-wider border-b border-neutral-200">
                <th className="px-5 py-3 font-medium">Company</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Track</th>
                <th className="px-5 py-3 font-medium">Date Applied</th>
                <th className="px-5 py-3 font-medium">Your Fit Score</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-neutral-200">
              {filteredApps.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-neutral-500">
                    You haven't submitted any applications with this status.
                  </td>
                </tr>
              ) : (
                filteredApps.map((app) => (
                  <tr key={app.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 font-bold">
                          {app.companyName.charAt(0)}
                        </div>
                        <p className="font-bold text-neutral-900">{app.companyName}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-medium text-neutral-700">{app.role}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${app.trackType === 'Competitive' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                        {app.trackType}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-neutral-500">{app.dateApplied}</td>
                    <td className="px-5 py-4">
                      <span className={`font-bold ${app.fitScore >= 80 ? 'text-green-600' : app.fitScore >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                        {app.fitScore}%
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                        app.status === 'Pending' ? 'bg-amber-50 text-amber-700' : 
                        app.status === 'Accepted' ? 'bg-green-50 text-green-700' : 
                        'bg-red-50 text-red-700'
                      }`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right space-x-3">
                      <Link to={`/student/browse/${app.internshipId}`} className="text-sm font-semibold text-violet-600 hover:text-violet-700">
                        View Posting
                      </Link>
                      {app.status === 'Pending' && (
                        <button
                          onClick={() => handleWithdraw(app.id)}
                          className="text-sm font-semibold text-red-600 hover:text-red-700"
                        >
                          Withdraw
                        </button>
                      )}
                      {app.status === 'Accepted' && (
                        <Link to="/student/log" className="inline-flex items-center justify-center text-sm font-bold text-green-700 hover:text-green-800 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg border border-green-200 transition-colors ml-2">
                          Start Evidence Log
                        </Link>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        )}
      </div>
    </div>
  );
}

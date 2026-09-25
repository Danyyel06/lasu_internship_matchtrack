import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axiosInstance from '../../lib/axios';

export default function StudentDashboardHome() {
  const [firstName, setFirstName] = useState('Student');
  const [recommendedInternships, setRecommendedInternships] = useState<any[]>([]);
  const [fitScore, setFitScore] = useState<number>(0);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [pendingSkills, setPendingSkills] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.first_name) {
          setFirstName(payload.first_name);
        }
      } catch (e) {
        console.error('Error decoding token', e);
      }
    }

    const fetchRecommended = async () => {
      try {
        const response = await axiosInstance.get('/internships/recommended');
        setRecommendedInternships(response.data);
      } catch (error) {
        console.error('Failed to fetch recommended internships:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchProfileData = async () => {
      try {
        const profileRes = await axiosInstance.get('/skill-verification/status');
        if (profileRes.data.skill_verification_completed_at) {
          setIsVerified(true);
          setFitScore(Math.round(profileRes.data.verified_fit_score || 0));
        } else {
          setIsVerified(false);
          setFitScore(Math.round(profileRes.data.preliminary_fit_score || 0));
          const pending = profileRes.data.skills.filter((s: any) => s.verification_status !== 'verified').length;
          setPendingSkills(pending);
        }
      } catch (error) {
        console.error('Failed to fetch verification status:', error);
      }
    };

    fetchRecommended();
    fetchProfileData();
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 leading-tight">Welcome back,<br />{firstName}</h1>
          <p className="text-neutral-500 mt-2 text-sm">Here is an overview of your industrial training journey.</p>
        </div>
        <div className="w-14 h-14 rounded-full overflow-hidden border border-neutral-200 shrink-0">
          {/* Avatar placeholder */}
          <img 
            src="https://ui-avatars.com/api/?name=Student&background=6D28D9&color=fff&size=150" 
            alt="Profile Avatar" 
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Progress & Top Matches */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Industrial Training Progress */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🎓</span>
                <h2 className="text-xl font-semibold text-neutral-900 leading-tight">Industrial<br/>Training<br/>Progress</h2>
              </div>
            </div>
            
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-neutral-600">Weeks Completed: 0 of 12</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neutral-50 text-neutral-600 gap-1 border border-neutral-200">
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-400"></span> Pending
              </span>
            </div>
            
            <div className="w-full bg-neutral-100 rounded-full h-2.5 mb-6 overflow-hidden">
              <div className="bg-green-600 h-2.5 rounded-full" style={{ width: '0%' }}></div>
            </div>

            <Link 
              to="/student/log"
              className="block w-full py-2.5 text-center bg-white border border-neutral-300 rounded-lg text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              View Evidence Log
            </Link>
          </div>

          {/* Top Internship Matches */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">💼</span>
                <h2 className="text-lg font-bold text-neutral-900">Top Internship Matches</h2>
              </div>
              <Link to="/student/browse" className="text-sm font-semibold text-neutral-900 hover:underline">View All</Link>
            </div>

            <div className="space-y-4">
              {loading ? (
                <div className="bg-neutral-50 border border-neutral-200 border-dashed rounded-xl p-8 text-center text-neutral-500">
                  Loading recommendations...
                </div>
              ) : recommendedInternships.length > 0 ? (
                recommendedInternships.map((internship) => (
                  <div key={internship.id} className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-neutral-900">{internship.title}</h3>
                      <p className="text-sm text-neutral-600">{internship.company_name} • {internship.location || 'Location TBD'}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="block text-sm font-bold text-green-600">{internship.match_percentage}% Match</span>
                      </div>
                      <Link 
                        to={`/student/browse/${internship.id}`} 
                        className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 text-sm font-semibold rounded-lg transition-colors"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-neutral-50 border border-neutral-200 border-dashed rounded-xl p-8 text-center">
                  <span className="text-3xl mb-3 block">🔍</span>
                  <p className="text-sm text-neutral-500 font-medium">Complete your profile to see top internship matches.</p>
                </div>
              )}
            </div>
          </div>
          
        </div>

        {/* Right Column: Fit Score & Deadlines */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Profile Fit Score */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm flex flex-col items-center text-center">
            <div className="flex items-center gap-2 mb-6">
              <h2 className="text-lg font-bold text-neutral-900">
                {isVerified ? "Verified Fit Score" : "Assumed Fit Score"}
              </h2>
              {isVerified ? (
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-success-100 text-success-dark">✓</span>
              ) : (
                <span className="inline-flex px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800">Unverified</span>
              )}
            </div>
            
            <div className="relative w-36 h-36 flex items-center justify-center mb-6">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-neutral-100"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.5"
                />
                <path
                  className={`text-${isVerified ? 'success-dark' : 'slate-900'}`}
                  strokeDasharray={`${fitScore}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-4xl font-bold text-neutral-900">{fitScore}%</span>
              </div>
            </div>

            {!isVerified ? (
              <div className="w-full bg-teal-50 border border-teal-200 rounded-xl p-4 mb-4 text-left">
                <p className="text-sm font-bold text-teal-900 mb-1">Verify Your Skills →</p>
                <p className="text-xs text-teal-800 mb-3">
                  Get your Verified Fit Score and strengthen your match ranking. {pendingSkills} skills pending.
                </p>
                <Link
                  to="/student/skill-verification"
                  className="block w-full py-2 text-center bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-bold transition-colors"
                >
                  Begin Verification
                </Link>
              </div>
            ) : (
              <p className="text-sm text-neutral-600 mb-6 px-4">
                You are a strong match for tech roles. Keep growing to increase your score.
              </p>
            )}

            {isVerified && (
              <Link 
                to="/student/skill-verification"
                className="block w-full py-2.5 text-center bg-white border border-neutral-300 rounded-lg text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                Manage Skills
              </Link>
            )}
          </div>

          {/* Upcoming Deadlines */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-xl text-red-600">📅</span>
              <h2 className="text-lg font-bold text-neutral-900">Upcoming Deadlines</h2>
            </div>

            <div className="space-y-4">
              <div className="bg-neutral-50 border border-neutral-200 border-dashed rounded-xl p-8 text-center">
                <p className="text-sm text-neutral-500 font-medium">No upcoming deadlines at the moment.</p>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}

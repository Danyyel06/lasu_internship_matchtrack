import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../lib/axios';

interface CompleteStatus {
  verified_fit_score: number;
  current_tier: string;
  skills_verified_count: number;
  skills_failed_count: number;
}

export default function SkillVerificationResult() {
  const [result, setResult] = useState<CompleteStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // We re-fetch status to get the updated counts and score, since /complete was already called
    const fetchStatus = async () => {
      try {
        const res = await axiosInstance.get('/skill-verification/status');
        const vCount = res.data.skills.filter((s: any) => s.verification_status === 'verified').length;
        const fCount = res.data.skills.filter((s: any) => s.verification_status === 'failed' || s.verification_status === 're_verifying').length;
        
        setResult({
          verified_fit_score: res.data.verified_fit_score || 0,
          current_tier: "Updated", // we don't have the tier from status but that's fine
          skills_verified_count: vCount,
          skills_failed_count: fCount
        });
      } catch (err) {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    
    fetchStatus();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-6">
      <div className="bg-white rounded-3xl border border-neutral-200 p-10 text-center shadow-sm">
        <div className="w-20 h-20 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">
          🎉
        </div>
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">Diagnostic Complete!</h1>
        <p className="text-neutral-500 mb-8">
          Your skills have been evaluated. Your Assumed Fit Score is now a Verified Fit Score.
        </p>
        
        <div className="bg-neutral-50 rounded-2xl p-8 mb-8 flex flex-col items-center border border-neutral-100">
          <p className="text-sm font-bold text-neutral-500 uppercase tracking-widest mb-2">New Verified Score</p>
          <div className="text-6xl font-black text-teal-600 mb-2">{Math.round(result?.verified_fit_score || 0)}%</div>
        </div>

        <div className="flex gap-4 mb-10">
          <div className="flex-1 p-4 rounded-xl border border-green-200 bg-green-50 text-green-900">
            <p className="text-2xl font-bold mb-1">{result?.skills_verified_count}</p>
            <p className="text-xs font-semibold uppercase">Verified</p>
          </div>
          <div className="flex-1 p-4 rounded-xl border border-red-200 bg-red-50 text-red-900">
            <p className="text-2xl font-bold mb-1">{result?.skills_failed_count}</p>
            <p className="text-xs font-semibold uppercase">Failed</p>
          </div>
        </div>

        <Link
          to="/student/skill-verification"
          className="inline-block w-full py-4 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl font-bold text-lg transition-colors"
        >
          View Dashboard
        </Link>
      </div>
    </div>
  );
}

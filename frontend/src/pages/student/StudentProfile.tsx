import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/axios';

interface StudentProfile {
  id: number;
  matric_no: string;
  faculty: string;
  department: string;
  level: number;
  cgpa: number;
  preliminary_fit_score: number | null;
  verified_fit_score: number | null;
  current_tier: string | null;
  skill_verification_completed_at: string | null;
}

interface SkillStatus {
  skill_name: string;
  claimed_level: number;
  verification_status: string;
  verified_level: number | null;
}

const TIER_CONFIG: Record<string, { label: string; color: string; bg: string; desc: string }> = {
  T1: { label: 'Tier 1', color: 'text-green-700', bg: 'bg-green-100', desc: 'Top Performer' },
  T2: { label: 'Tier 2', color: 'text-amber-700', bg: 'bg-amber-100', desc: 'Developing' },
  T3: { label: 'Tier 3', color: 'text-red-700', bg: 'bg-red-100', desc: 'Needs Growth' },
};

const LEVEL_LABELS: Record<number, string> = {
  1: 'Novice',
  2: 'Beginner',
  3: 'Intermediate',
  4: 'Advanced',
  5: 'Expert',
};

export default function StudentProfile() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [skills, setSkills] = useState<SkillStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState('Student');
  const [email, setEmail] = useState('');

  useEffect(() => {
    // Decode token for name/email
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.first_name) setFirstName(payload.first_name);
        if (payload.email) setEmail(payload.email);
      } catch {}
    }

    const fetchData = async () => {
      try {
        const [profileRes, verificationRes] = await Promise.all([
          api.get('/students/profile'),
          api.get('/skill-verification/status').catch(() => null),
        ]);
        setProfile(profileRes.data);
        if (verificationRes?.data?.skills) {
          setSkills(verificationRes.data.skills);
        }
      } catch (err) {
        console.error('Failed to fetch profile data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="animate-spin text-4xl">⏳</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
        <span className="text-4xl">😕</span>
        <p className="text-neutral-500 font-medium">Could not load your profile. Please try again.</p>
      </div>
    );
  }

  const fitScore = profile.verified_fit_score ?? profile.preliminary_fit_score ?? 0;
  const isVerified = !!profile.skill_verification_completed_at;
  const tier = profile.current_tier ?? 'T3';
  const tierConfig = TIER_CONFIG[tier] ?? TIER_CONFIG['T3'];
  const verifiedSkills = skills.filter(s => s.verification_status === 'verified');
  const pendingSkills = skills.filter(s => s.verification_status !== 'verified');

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">My Profile &amp; Fit Score</h1>
        <p className="text-sm text-neutral-500 mt-1">Your academic profile, tier, and skill snapshot.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: Profile Info */}
        <div className="lg:col-span-2 space-y-6">

          {/* Identity Card */}
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center text-2xl font-bold text-violet-700">
                {firstName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold text-neutral-900">{firstName}</h2>
                {email && <p className="text-sm text-neutral-500">{email}</p>}
                <span className={`inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${tierConfig.bg} ${tierConfig.color}`}>
                  {tierConfig.label} — {tierConfig.desc}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                { label: 'Matric No.', value: profile.matric_no },
                { label: 'Faculty', value: profile.faculty },
                { label: 'Department', value: profile.department },
                { label: 'Level', value: `${profile.level} Level` },
                { label: 'CGPA', value: profile.cgpa?.toFixed(2) ?? '—' },
                {
                  label: 'Skill Verification',
                  value: isVerified ? '✅ Completed' : '⏳ Pending',
                },
              ].map(({ label, value }) => (
                <div key={label} className="bg-neutral-50 rounded-lg p-3">
                  <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">{label}</p>
                  <p className="font-semibold text-neutral-900">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Skills */}
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-neutral-900">My Skills</h2>
              <Link
                to="/student/skill-verification"
                className="text-sm font-semibold text-violet-600 hover:text-violet-700 transition-colors"
              >
                {isVerified ? 'Manage Skills →' : 'Verify Skills →'}
              </Link>
            </div>

            {skills.length === 0 ? (
              <div className="text-center py-8 text-neutral-400">
                <span className="text-3xl block mb-2">🔬</span>
                <p className="text-sm">No skills added yet. Complete skill verification to see them here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {skills.map((skill) => {
                  const verified = skill.verification_status === 'verified';
                  const level = verified ? (skill.verified_level ?? skill.claimed_level) : skill.claimed_level;
                  const pct = (level / 5) * 100;
                  return (
                    <div key={skill.skill_name}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-neutral-800">{skill.skill_name}</span>
                          <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${verified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            {verified ? 'Verified' : 'Claimed'}
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-neutral-500">
                          {LEVEL_LABELS[level] ?? `Level ${level}`} ({level}/5)
                        </span>
                      </div>
                      <div className="w-full bg-neutral-100 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all ${verified ? 'bg-green-500' : 'bg-amber-400'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!isVerified && pendingSkills.length > 0 && (
              <div className="mt-5 bg-teal-50 border border-teal-200 rounded-xl p-4">
                <p className="text-sm font-bold text-teal-900 mb-1">
                  {pendingSkills.length} skill{pendingSkills.length !== 1 ? 's' : ''} pending verification
                </p>
                <p className="text-xs text-teal-700 mb-3">
                  Verified skills boost your Fit Score and unlock more internship matches.
                </p>
                <Link
                  to="/student/skill-verification"
                  className="inline-block py-2 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-bold transition-colors"
                >
                  Begin Verification
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right: Fit Score */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6 flex flex-col items-center text-center">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-lg font-bold text-neutral-900">
                {isVerified ? 'Verified Fit Score' : 'Assumed Fit Score'}
              </h2>
              {isVerified ? (
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100 text-green-700 text-xs">✓</span>
              ) : (
                <span className="inline-flex px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800">Unverified</span>
              )}
            </div>

            {/* Circular gauge */}
            <div className="relative w-36 h-36 flex items-center justify-center mb-4">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-neutral-100"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.5"
                />
                <path
                  className={isVerified ? 'text-green-500' : 'text-violet-600'}
                  strokeDasharray={`${fitScore}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-4xl font-bold text-neutral-900">{Math.round(fitScore)}%</span>
              </div>
            </div>

            <p className="text-xs text-neutral-500 leading-relaxed mb-4 px-2">
              {isVerified
                ? 'Based on your verified skills, CGPA, and profile completeness.'
                : 'This is a preliminary estimate based on your claimed skills. Verify them to unlock your true score.'}
            </p>

            {/* Breakdown */}
            <div className="w-full space-y-2 text-left">
              {[
                { label: 'CGPA', value: profile.cgpa?.toFixed(2) ?? '—' },
                { label: 'Verified Skills', value: `${verifiedSkills.length} / ${skills.length}` },
                { label: 'Tier', value: tierConfig.label },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between text-sm">
                  <span className="text-neutral-500">{label}</span>
                  <span className="font-semibold text-neutral-900">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6 space-y-3">
            <h3 className="text-sm font-bold text-neutral-900 mb-3">Quick Actions</h3>
            <Link
              to="/student/skill-verification"
              className="block w-full py-2.5 text-center bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              🔬 Skill Verification
            </Link>
            <Link
              to="/student/browse"
              className="block w-full py-2.5 text-center bg-white border border-neutral-300 hover:bg-neutral-50 text-neutral-700 rounded-lg text-sm font-semibold transition-colors"
            >
              🔍 Browse Internships
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

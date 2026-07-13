import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../lib/axios';

interface SkillItem {
  skill_name: string;
  claimed_level: number;
  verified_level: number | null;
  verification_status: string;
  cooldown_until: string | null;
}

interface StatusResponse {
  preliminary_fit_score: number | null;
  verified_fit_score: number | null;
  skill_verification_completed_at: string | null;
  skills: SkillItem[];
}

export default function SkillVerification() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState(1);
  const [actionLoading, setActionLoading] = useState(false);
  const [allowedSkills, setAllowedSkills] = useState<string[]>([]);
  const [subRoleName, setSubRoleName] = useState<string | null>(null);
  const [jobFamilyName, setJobFamilyName] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await axiosInstance.get('/skill-verification/status');
      setStatus(res.data);
    } catch (err) {
      setError('Failed to load verification status.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllowedSkills = async () => {
    try {
      const res = await axiosInstance.get('/skill-verification/allowed-skills');
      setAllowedSkills(res.data.allowed_skills || []);
      setSubRoleName(res.data.sub_role || null);
      setJobFamilyName(res.data.job_family || null);
    } catch {
      // non-critical, silently ignore
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchAllowedSkills();
  }, []);

  const handleBeginDiagnostic = async () => {
    navigate('/student/skill-verification/test');
  };

  const handleReVerify = async (skill_name: string) => {
    setActionLoading(true);
    try {
      const res = await axiosInstance.post(`/skill-verification/re-verify/${encodeURIComponent(skill_name)}`);
      if (res.data.allowed) {
        navigate('/student/skill-verification/test');
      } else {
        alert('Skill is on cooldown until ' + new Date(res.data.cooldown_until).toLocaleString());
      }
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to request re-verification');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpgrade = async (skill_name: string, current_level: number) => {
    const newLevelStr = prompt(`Enter new level for ${skill_name} (Current: ${current_level}, Max: 5):`);
    if (!newLevelStr) return;
    const newLevel = parseInt(newLevelStr);
    if (isNaN(newLevel) || newLevel <= current_level || newLevel > 5) {
      alert("Invalid level. Must be a number between your current level + 1 and 5.");
      return;
    }
    setActionLoading(true);
    try {
      await axiosInstance.post('/skill-verification/upgrade-skill', {
        skill_name,
        claimed_level: newLevel
      });
      navigate('/student/skill-verification/test');
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to start upgrade');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddNewSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;
    setActionLoading(true);
    try {
      await axiosInstance.post('/skill-verification/add-skill', {
        skill_name: newSkillName.trim(),
        claimed_level: newSkillLevel
      });
      // The add-skill endpoint generated questions. We navigate to test screen.
      navigate('/student/skill-verification/test');
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      alert(typeof detail === 'string' ? detail : 'Failed to add skill');
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !status) {
    return <div className="text-red-500 text-center py-12">{error}</div>;
  }

  const isCompleted = !!status.skill_verification_completed_at;

  if (!isCompleted) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <div className="text-4xl mb-4">🔬</div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Skill Verification</h1>
          <p className="text-neutral-500 max-w-lg mx-auto">
            Complete this diagnostic to convert your Assumed Fit Score into a Verified Fit Score.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-neutral-900">Skills Pending Verification</h2>
            <span className="px-3 py-1 bg-neutral-100 rounded-full text-xs font-semibold text-neutral-600">
              {status.skills.length} skills
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {status.skills.map((skill, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-neutral-200 bg-neutral-50">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-neutral-900">{skill.skill_name}</h3>
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800">Pending</span>
                </div>
                <p className="text-sm text-neutral-600">Claimed Level: {skill.claimed_level}</p>
              </div>
            ))}
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
            <p className="text-orange-800 text-sm font-bold mb-1">⚠️ Important</p>
            <p className="text-orange-700 text-sm">
              The diagnostic uses tab-switch detection. Switching tabs or windows will automatically fail the active skill group.
            </p>
          </div>

          <button
            onClick={handleBeginDiagnostic}
            className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-lg transition-colors"
          >
            Begin Full Diagnostic →
          </button>
        </div>
      </div>
    );
  }

  // POST-VERIFICATION STATE
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Skill Verification Dashboard</h1>
        <p className="text-neutral-500 mt-1">Manage your skills and grow your Verified Fit Score.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-neutral-900 mb-4">Your Skills</h2>
            <div className="space-y-3">
              {status.skills.map((skill, idx) => {
                const isVerified = skill.verification_status === 'verified';
                const isFailed = skill.verification_status === 'failed';
                const isReVerifying = skill.verification_status === 're_verifying';
                
                let onCooldown = false;
                if (skill.cooldown_until) {
                  onCooldown = new Date(skill.cooldown_until) > new Date();
                }

                return (
                  <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-neutral-200 rounded-lg gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-neutral-900">{skill.skill_name}</h3>
                        {isVerified && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-800">Verified ✓</span>}
                        {isFailed && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">Not Verified</span>}
                        {isReVerifying && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">Re-verifying</span>}
                        {skill.verification_status === 'unverified' && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-100 text-neutral-600">Pending</span>}
                      </div>
                      <p className="text-xs text-neutral-500">
                        Claimed Level: {skill.claimed_level} 
                        {isVerified && ` • Verified Level: ${skill.verified_level}`}
                      </p>
                    </div>
                    
                    <div>
                      {(isFailed || isReVerifying || skill.verification_status === 'unverified') && (
                        <button
                          onClick={() => handleReVerify(skill.skill_name)}
                          disabled={onCooldown || actionLoading}
                          className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-300 text-white text-sm font-semibold rounded-lg transition-colors"
                        >
                          {onCooldown ? 'On Cooldown' : skill.verification_status === 'unverified' ? 'Verify Now' : 'Re-verify'}
                        </button>
                      )}
                      {(isVerified) && (
                        <button
                          onClick={() => handleUpgrade(skill.skill_name, skill.verified_level || skill.claimed_level)}
                          disabled={actionLoading}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
                        >
                          Upgrade Level
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm text-center">
            <h2 className="text-sm font-bold text-neutral-500 uppercase tracking-wider mb-4">Verified Fit Score</h2>
            <div className="text-5xl font-bold text-green-600 mb-2">{Math.round(status.verified_fit_score || 0)}%</div>
            <p className="text-sm text-neutral-600">Your score is actively used for match rankings.</p>
          </div>

          <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-neutral-900 mb-1">Add a New Skill</h2>
            {subRoleName && (
              <p className="text-xs text-neutral-500 mb-4">
                Skills for <span className="font-semibold text-neutral-700">{subRoleName}</span>
                {jobFamilyName && <span className="text-neutral-400"> · {jobFamilyName}</span>}
              </p>
            )}

            {isAddingNew ? (
              allowedSkills.length === 0 ? (
                <div className="text-center py-4">
                  <span className="text-2xl block mb-2">🎉</span>
                  <p className="text-sm text-neutral-500 font-medium">You've added all available skills for your sub-role!</p>
                  <button
                    type="button"
                    onClick={() => setIsAddingNew(false)}
                    className="mt-3 text-sm text-violet-600 hover:text-violet-700 font-semibold"
                  >
                    Close
                  </button>
                </div>
              ) : (
              <form onSubmit={handleAddNewSkill} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Skill Name</label>
                  <select
                    required
                    value={newSkillName}
                    onChange={(e) => setNewSkillName(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-violet-500 focus:outline-none"
                  >
                    <option value="">— Select a skill —</option>
                    {allowedSkills.map((skill) => (
                      <option key={skill} value={skill}>{skill}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Claimed Level (1–5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    required
                    value={newSkillLevel}
                    onChange={(e) => setNewSkillLevel(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
                  />
                  <p className="text-xs text-neutral-400 mt-1">1 = Novice · 2 = Beginner · 3 = Intermediate · 4 = Advanced · 5 = Expert</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => { setIsAddingNew(false); setNewSkillName(''); }} className="flex-1 py-2 bg-neutral-100 text-neutral-700 text-sm font-semibold rounded-lg">Cancel</button>
                  <button type="submit" disabled={actionLoading || !newSkillName} className="flex-1 py-2 bg-violet-600 disabled:bg-neutral-300 text-white text-sm font-semibold rounded-lg">Add &amp; Verify</button>
                </div>
              </form>
              )
            ) : (
              <button
                onClick={() => setIsAddingNew(true)}
                disabled={allowedSkills.length === 0}
                className="w-full py-3 border-2 border-dashed border-neutral-300 text-neutral-600 font-semibold rounded-xl hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {allowedSkills.length === 0 ? '✅ All skills added' : '+ Add New Skill'}
              </button>
            )}
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
            <h3 className="font-bold text-blue-900 mb-2">How to Increase Your Fit Score</h3>
            <ul className="text-sm text-blue-800 space-y-2 list-disc pl-4">
              <li>Pass a re-verification attempt for a previously failed skill (requires 2 passes on different days).</li>
              <li>Add new relevant skills as you learn them and pass the diagnostic.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

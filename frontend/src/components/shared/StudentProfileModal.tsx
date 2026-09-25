

const LEVEL_LABELS: Record<number, string> = {
  1: 'Beginner',
  2: 'Intermediate',
  3: 'Advanced',
  4: 'Expert',
};

interface StudentSkill {
  skill_name: string;
  verified_level: number | null;
  claimed_level: number | null;
  verification_status: string;
}

interface StudentProfileData {
  name: string;
  email: string;
  matric_no: string;
  level: number | null;
  department: string;
  faculty: string;
  cgpa: number | null;
  current_tier: string | null;
  preliminary_fit_score: number | null;
  skills: StudentSkill[];
}

export interface StudentProfileModalProps {
  open: boolean;
  onClose: () => void;
  loading: boolean;
  error: string;
  studentId: number | null;
  data: StudentProfileData | null;
}

export default function StudentProfileModal({ open, onClose, loading, error, studentId, data }: StudentProfileModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <h2 className="text-lg font-bold text-neutral-900">Student Profile</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin text-3xl">⏳</div>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-600 text-sm font-medium">{error}</p>
            <p className="text-neutral-400 text-xs mt-1">Student ID: {studentId}</p>
          </div>
        ) : data ? (
          <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-2xl shrink-0">
                {data.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-xl font-bold text-neutral-900">{data.name}</h3>
                <p className="text-sm text-neutral-500">{data.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  {data.current_tier && (
                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      data.current_tier === 'T1' ? 'bg-blue-50 text-blue-700' :
                      data.current_tier === 'T2' ? 'bg-purple-50 text-purple-700' :
                      'bg-amber-50 text-amber-700'
                    }`}>
                      {data.current_tier}
                    </span>
                  )}
                  {data.preliminary_fit_score !== null && (
                    <span className="text-xs text-neutral-500">
                      Fit Score: <span className="font-semibold text-neutral-700">{data.preliminary_fit_score}%</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-neutral-50 rounded-lg p-3">
                <p className="text-xs text-neutral-500 mb-0.5">Matric No.</p>
                <p className="text-sm font-semibold text-neutral-900">{data.matric_no}</p>
              </div>
              <div className="bg-neutral-50 rounded-lg p-3">
                <p className="text-xs text-neutral-500 mb-0.5">Level</p>
                <p className="text-sm font-semibold text-neutral-900">
                  {data.level ? `${data.level}L` : '—'}
                </p>
              </div>
              <div className="bg-neutral-50 rounded-lg p-3">
                <p className="text-xs text-neutral-500 mb-0.5">Department</p>
                <p className="text-sm font-semibold text-neutral-900">{data.department}</p>
              </div>
              <div className="bg-neutral-50 rounded-lg p-3">
                <p className="text-xs text-neutral-500 mb-0.5">CGPA</p>
                <p className="text-sm font-semibold text-neutral-900">
                  {data.cgpa !== null ? data.cgpa?.toFixed(2) : '—'}
                </p>
              </div>
              <div className="bg-neutral-50 rounded-lg p-3 col-span-2">
                <p className="text-xs text-neutral-500 mb-0.5">Faculty</p>
                <p className="text-sm font-semibold text-neutral-900">{data.faculty}</p>
              </div>
            </div>

            {data.skills && data.skills.length > 0 ? (
              <div>
                <h4 className="text-sm font-bold text-neutral-700 mb-2">Skills</h4>
                <div className="space-y-2">
                  {data.skills.map((skill, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0">
                      <span className="text-sm text-neutral-800">{skill.skill_name}</span>
                      <div className="flex items-center gap-2">
                        {skill.verified_level ? (
                          <span className="text-xs px-2 py-0.5 bg-green-50 text-green-700 rounded font-medium">
                            Verified: {LEVEL_LABELS[skill.verified_level] || `L${skill.verified_level}`}
                          </span>
                        ) : skill.claimed_level ? (
                          <span className="text-xs px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded font-medium">
                            Claimed: {LEVEL_LABELS[skill.claimed_level] || `L${skill.claimed_level}`}
                          </span>
                        ) : null}
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                          skill.verification_status === 'verified' ? 'bg-green-50 text-green-600' :
                          skill.verification_status === 'failed' ? 'bg-red-50 text-red-600' :
                          'bg-neutral-100 text-neutral-500'
                        }`}>
                          {skill.verification_status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-neutral-400 italic">No skills listed yet.</p>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

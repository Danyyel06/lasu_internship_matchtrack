import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

interface CheckInContent {
  focus_area: string;
  core_action: string;
  the_blocker: string;
  the_takeaway: string;
}

interface QuizQuestion {
  question: string;
  options: string[];
}

/**
 * LogDetailData matches the backend LogDetailResponse (camelCase).
 * Backend endpoint: GET /api/v1/academic-supervisors/log-wall/{student_id}/week/{week_id}
 */
interface LogDetailData {
  studentId: number;
  studentName: string;
  weekNumber: number;
  wedContent: CheckInContent | null;
  satContent: CheckInContent | null;
  wedPhotoUrl: string | null;
  satPhotoUrl: string | null;
  wedSubmittedAt: string | null;
  satSubmittedAt: string | null;
  quizScore: number | null;
  quizPassed: boolean | null;
  quizQuestions: QuizQuestion[] | null;
  quizStudentAnswers: number[] | null;
}

interface LogDetailProps {
  studentId: number;
  weekId: number;
  onClose: () => void;
}

// ─── PhotoCarousel ────────────────────────────────────────────────────────────
// A small self-contained carousel used in the drill-down modal.
// Extracted as a named component so useState/useRef obey the Rules of Hooks.
interface Slide { url: string; label: string; color: 'blue' | 'violet'; }

function PhotoCarousel({ slides }: { slides: Slide[] }) {
  const [idx, setIdx] = useState(0);
  const touchStartX = useRef<number | null>(null);

  if (slides.length === 0) return null;

  const prev = () => setIdx(i => (i - 1 + slides.length) % slides.length);
  const next = () => setIdx(i => (i + 1) % slides.length);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (delta < -40) next();
    else if (delta > 40) prev();
    touchStartX.current = null;
  };

  return (
    <div>
      {/* Slide frame */}
      <div
        className="relative rounded-xl overflow-hidden border border-neutral-200 bg-neutral-100"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <img
          key={slides[idx].url}
          src={`http://localhost:8000${slides[idx].url}`}
          alt={`${slides[idx].label} workplace`}
          className="w-full max-h-56 object-cover transition-opacity duration-300"
        />
        {/* Day label badge */}
        <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold text-white shadow ${
          slides[idx].color === 'blue' ? 'bg-blue-600' : 'bg-violet-600'
        }`}>
          {slides[idx].label}
        </div>
        {/* Arrow buttons — only if more than one slide */}
        {slides.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center text-sm transition-colors"
              aria-label="Previous photo"
            >
              ‹
            </button>
            <button
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center text-sm transition-colors"
              aria-label="Next photo"
            >
              ›
            </button>
          </>
        )}
      </div>
      {/* Dot indicators */}
      {slides.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === idx ? 'bg-neutral-700' : 'bg-neutral-300'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────


export default function LogDetail({ studentId, weekId, onClose }: LogDetailProps) {
  const [data, setData] = useState<LogDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const res = await axios.get(
          `http://localhost:8000/api/v1/academic-supervisors/log-wall/${studentId}/week/${weekId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const d: LogDetailData = res.data;
        setData(d);
        setActivePhoto(d.wedPhotoUrl ? 'wed' : 'sat');
      } catch {
        console.error('Failed to load log detail');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [studentId, weekId]);

  // Close on backdrop click
  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const Field = ({ label, value }: { label: string; value: string }) => (
    <div>
      <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm text-neutral-700 leading-relaxed">{value}</p>
    </div>
  );

  return (
    <div
      ref={overlayRef}
      onClick={handleBackdrop}
      className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
    >
      <div className="bg-white w-full md:max-w-2xl md:rounded-2xl rounded-t-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-start justify-between shrink-0">
          <div>
            {loading ? (
              <div className="h-5 w-40 bg-neutral-100 rounded animate-pulse" />
            ) : (
              <>
                <h2 className="font-bold text-neutral-900">{data?.studentName}</h2>
                <p className="text-xs text-neutral-500">Week {data?.weekNumber}</p>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="ml-4 p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-4 bg-neutral-100 rounded animate-pulse" />)}
            </div>
          ) : data ? (
            <>
              {/* ─── Photo Carousel ─── */}
              {(data.wedPhotoUrl || data.satPhotoUrl) && (
                <PhotoCarousel
                  slides={[
                    ...(data.wedPhotoUrl ? [{ url: data.wedPhotoUrl, label: 'Wednesday', color: 'blue'   as const }] : []),
                    ...(data.satPhotoUrl ? [{ url: data.satPhotoUrl, label: 'Saturday',  color: 'violet' as const }] : []),
                  ]}
                />
              )}

              {/* Submission timestamps */}
              <div className="flex flex-wrap gap-3">
                {data.wedSubmittedAt && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
                    📝 Wed submitted {new Date(data.wedSubmittedAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
                {data.satSubmittedAt && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 text-violet-700 text-xs font-semibold">
                    📸 Sat submitted {new Date(data.satSubmittedAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>

              {/* Wednesday Content */}
              {data.wedContent && (
                <div>
                  <h3 className="text-sm font-bold text-blue-700 mb-3">Wednesday Check-in</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Focus Area" value={data.wedContent.focus_area} />
                    <Field label="Core Action" value={data.wedContent.core_action} />
                    <Field label="Blocker" value={data.wedContent.the_blocker} />
                    <Field label="Takeaway" value={data.wedContent.the_takeaway} />
                  </div>
                </div>
              )}

              {/* Saturday Content */}
              {data.satContent && (
                <div>
                  <h3 className="text-sm font-bold text-violet-700 mb-3">Saturday Check-in</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Focus Area" value={data.satContent.focus_area} />
                    <Field label="Core Action" value={data.satContent.core_action} />
                    <Field label="Blocker" value={data.satContent.the_blocker} />
                    <Field label="Takeaway" value={data.satContent.the_takeaway} />
                  </div>
                </div>
              )}

              {/* AI Quiz Results */}
              {data.quizScore !== null && (
                <div>
                  <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border mb-3 ${
                    data.quizPassed
                      ? 'bg-success-50 border-success-base'
                      : 'bg-danger-50 border-danger-base'
                  }`}>
                    <span className="text-lg">🧠</span>
                    <div>
                      <p className="text-xs font-bold text-neutral-600">AI Scenario Quiz</p>
                      <p className={`text-sm font-semibold ${data.quizPassed ? 'text-success-dark' : 'text-danger-dark'}`}>
                        {data.quizScore}/5 — {data.quizPassed ? 'Passed' : 'Failed'}
                      </p>
                    </div>
                  </div>

                  {/* Q&A Accordion — visible to Academic Supervisor (read-only) */}
                  {data.quizQuestions && data.quizQuestions.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Quiz Review</p>
                      {data.quizQuestions.map((q, i) => {
                        const studentAns = data.quizStudentAnswers?.[i];
                        // We don't have correct_answers in this endpoint, so just show the student's selection
                        return (
                          <details key={i} className="group border border-neutral-200 rounded-xl overflow-hidden">
                            <summary className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none list-none bg-neutral-50 hover:bg-neutral-100 transition-colors">
                              <span className="flex-shrink-0 text-sm font-bold text-neutral-500">Q{i + 1}</span>
                              <p className="text-sm text-neutral-800 font-medium line-clamp-1">{q.question}</p>
                            </summary>
                            <div className="px-4 py-3 space-y-1.5 bg-white">
                              {q.options.map((opt, j) => (
                                <div
                                  key={j}
                                  className={`px-3 py-2 rounded-lg text-sm ${
                                    j === studentAns
                                      ? 'bg-blue-50 text-blue-800 font-medium border border-blue-200'
                                      : 'text-neutral-600'
                                  }`}
                                >
                                  {j === studentAns && '→ '}{opt}
                                  {j === studentAns && <span className="ml-2 text-xs text-blue-500">(student's answer)</span>}
                                </div>
                              ))}
                            </div>
                          </details>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <p className="text-neutral-500 text-sm">Could not load log details.</p>
          )}
        </div>

        {/* Footer — read-only, no actions for Academic Supervisor */}
        <div className="px-6 py-4 border-t border-neutral-100 shrink-0">
          <p className="text-xs text-neutral-400 text-center">Read-only view · Academic Supervisors cannot annotate individual check-ins</p>
        </div>
      </div>
    </div>
  );
}

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

// ─── Individual check-in slide ─────────────────────────────────────────────────
interface SlideData {
  label: string;
  color: 'blue' | 'violet';
  photoUrl: string | null;
  submittedAt: string | null;
  content: CheckInContent | null;
}

function CheckInSlide({ slide }: { slide: SlideData }) {
  const accent = slide.color === 'blue' ? 'blue' : 'violet';
  const accentBg = accent === 'blue' ? 'bg-blue-600' : 'bg-violet-600';
  const accentText = accent === 'blue' ? 'text-blue-700' : 'text-violet-700';
  const accentLight = accent === 'blue' ? 'bg-blue-50' : 'bg-violet-50';

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Photo */}
      {slide.photoUrl ? (
        <div className="relative shrink-0">
          <img
            src={slide.photoUrl}
            alt={`${slide.label} workplace photo`}
            className="w-full object-cover"
            style={{ maxHeight: '200px', minHeight: '140px' }}
          />
          {/* Day badge */}
          <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold text-white shadow ${accentBg}`}>
            {slide.label}
          </div>
        </div>
      ) : (
        // No photo placeholder
        <div className={`shrink-0 h-28 flex flex-col items-center justify-center ${accentLight}`}>
          <span className="text-3xl mb-1">📋</span>
          <p className={`text-xs font-bold ${accentText}`}>{slide.label} — No photo</p>
        </div>
      )}

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* Timestamp pill */}
        {slide.submittedAt && (
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${accentLight} ${accentText} text-xs font-semibold`}>
            📅 Submitted {new Date(slide.submittedAt).toLocaleDateString('en-NG', {
              weekday: 'short', day: 'numeric', month: 'short',
              hour: '2-digit', minute: '2-digit'
            })}
          </span>
        )}

        {/* Fields */}
        {slide.content ? (
          <div className="space-y-4">
            <Field label="Focus Area" value={slide.content.focus_area} accent={accentText} />
            <Field label="Core Action" value={slide.content.core_action} accent={accentText} />
            <Field label="The Blocker" value={slide.content.the_blocker} accent={accentText} />
            <Field label="The Takeaway" value={slide.content.the_takeaway} accent={accentText} />
          </div>
        ) : (
          <p className="text-sm text-neutral-400 italic">No report content available for this check-in.</p>
        )}

        {/* Bottom breathing room */}
        <div className="h-2" />
      </div>
    </div>
  );
}

function Field({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div>
      <p className={`text-[11px] font-bold uppercase tracking-wider mb-1 ${accent}`}>{label}</p>
      <p className="text-sm text-neutral-700 leading-relaxed">{value}</p>
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────


export default function LogDetail({ studentId, weekId, onClose }: LogDetailProps) {
  const [data, setData] = useState<LogDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [slideIdx, setSlideIdx] = useState(0);
  const overlayRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const res = await axios.get(
          `/api/v1/academic-supervisors/log-wall/${studentId}/week/${weekId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setData(res.data as LogDetailData);
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

  // Build slides from data — only include slides that have something to show
  const slides: SlideData[] = [];
  if (data) {
    if (data.wedContent || data.wedPhotoUrl || data.wedSubmittedAt) {
      slides.push({
        label: 'Wednesday',
        color: 'blue',
        photoUrl: data.wedPhotoUrl,
        submittedAt: data.wedSubmittedAt,
        content: data.wedContent,
      });
    }
    if (data.satContent || data.satPhotoUrl || data.satSubmittedAt) {
      slides.push({
        label: 'Saturday',
        color: 'violet',
        photoUrl: data.satPhotoUrl,
        submittedAt: data.satSubmittedAt,
        content: data.satContent,
      });
    }
  }

  const totalSlides = slides.length;
  const goNext = () => setSlideIdx(i => Math.min(i + 1, totalSlides - 1));
  const goPrev = () => setSlideIdx(i => Math.max(i - 1, 0));

  // Touch/swipe on carousel
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (delta < -40) goNext();
    else if (delta > 40) goPrev();
    touchStartX.current = null;
  };

  const hasQuiz = data?.quizScore !== null && data?.quizScore !== undefined;

  return (
    <div
      ref={overlayRef}
      onClick={handleBackdrop}
      className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
    >
      <div className="bg-white w-full md:max-w-lg md:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ maxHeight: '92vh' }}
      >
        {/* ── Header ── */}
        <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between shrink-0">
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
            className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-4 bg-neutral-100 rounded animate-pulse" />
            ))}
          </div>
        ) : !data ? (
          <div className="p-6 text-sm text-neutral-500">Could not load log details.</div>
        ) : (
          <>
            {/* ── Carousel area (scrollable per slide) ── */}
            {totalSlides > 0 ? (
              <div
                className="flex-1 min-h-0 relative flex flex-col"
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
              >
                {/* Slide indicator pills */}
                {totalSlides > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-3 pb-1 shrink-0">
                    {slides.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => setSlideIdx(i)}
                        className={`px-3 py-0.5 rounded-full text-[11px] font-bold border transition-all ${
                          i === slideIdx
                            ? s.color === 'blue'
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-violet-600 text-white border-violet-600'
                            : 'bg-white text-neutral-400 border-neutral-200'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Slide content */}
                <div className="flex-1 min-h-0 overflow-hidden relative">
                  <CheckInSlide slide={slides[slideIdx]} />
                </div>

                {/* Prev / Next arrows — only if more than 1 slide */}
                {totalSlides > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-100 shrink-0 bg-white">
                    <button
                      onClick={goPrev}
                      disabled={slideIdx === 0}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                        slideIdx === 0
                          ? 'text-neutral-300 cursor-not-allowed'
                          : 'text-blue-600 hover:bg-blue-50'
                      }`}
                    >
                      ← {slideIdx > 0 ? slides[slideIdx - 1].label : 'Previous'}
                    </button>

                    <span className="text-xs text-neutral-400 font-medium">
                      {slideIdx + 1} / {totalSlides}
                    </span>

                    <button
                      onClick={goNext}
                      disabled={slideIdx === totalSlides - 1}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                        slideIdx === totalSlides - 1
                          ? 'text-neutral-300 cursor-not-allowed'
                          : 'text-violet-600 hover:bg-violet-50'
                      }`}
                    >
                      {slideIdx < totalSlides - 1 ? slides[slideIdx + 1].label : 'Next'} →
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-neutral-400 text-sm">
                No check-in content available.
              </div>
            )}

            {/* ── Quiz section — static at bottom ── */}
            {hasQuiz && (
              <div className="shrink-0 border-t border-neutral-200 bg-neutral-50 px-5 py-4 space-y-3">
                {/* Score banner */}
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
                  data.quizPassed
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}>
                  <span className="text-xl">🧠</span>
                  <div>
                    <p className="text-xs font-bold text-neutral-600">AI Scenario Quiz</p>
                    <p className={`text-sm font-semibold ${data.quizPassed ? 'text-green-700' : 'text-red-700'}`}>
                      {data.quizScore}/5 — {data.quizPassed ? 'Passed ✓' : 'Failed ✗'}
                    </p>
                  </div>
                </div>

                {/* Q&A accordion */}
                {data.quizQuestions && data.quizQuestions.length > 0 && (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Quiz Review</p>
                    {data.quizQuestions.map((q, i) => {
                      const studentAns = data.quizStudentAnswers?.[i];
                      return (
                        <details key={i} className="border border-neutral-200 rounded-xl overflow-hidden">
                          <summary className="flex items-center gap-3 px-3 py-2.5 cursor-pointer select-none list-none bg-white hover:bg-neutral-50 transition-colors">
                            <span className="shrink-0 text-xs font-bold text-neutral-400">Q{i + 1}</span>
                            <p className="text-xs text-neutral-800 font-medium line-clamp-1">{q.question}</p>
                          </summary>
                          <div className="px-3 py-2 space-y-1 bg-neutral-50">
                            {q.options.map((opt, j) => (
                              <div
                                key={j}
                                className={`px-3 py-1.5 rounded-lg text-xs ${
                                  j === studentAns
                                    ? 'bg-blue-50 text-blue-800 font-semibold border border-blue-200'
                                    : 'text-neutral-500'
                                }`}
                              >
                                {j === studentAns && '→ '}{opt}
                                {j === studentAns && <span className="ml-1 text-blue-400">(student's answer)</span>}
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

            {/* Footer */}
            <div className="px-5 py-2.5 border-t border-neutral-100 shrink-0">
              <p className="text-[10px] text-neutral-400 text-center">Read-only view · Academic Supervisors cannot annotate check-ins</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

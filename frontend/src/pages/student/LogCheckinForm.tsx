import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

// ─── Field definitions with per-field limit type ────────────────────────────
// limitType: 'chars' uses maxLength; 'words' uses a live word counter.
const FIELDS = [
  {
    key: 'focus_area',
    label: 'Focus Area',
    hint: 'e.g. "Database Schema Design" (60 chars max)',
    max: 60,
    limitType: 'chars' as const,
  },
  {
    key: 'core_action',
    label: 'Core Action Taken',
    hint: 'What major task did you tackle this session?',
    max: 150,
    limitType: 'words' as const,
  },
  {
    key: 'the_blocker',
    label: 'The Blocker',
    hint: 'What challenge did you face and how did you solve it?',
    max: 100,
    limitType: 'words' as const,
  },
  {
    key: 'the_takeaway',
    label: 'The Takeaway',
    hint: 'What was your biggest learning milestone this session?',
    max: 100,
    limitType: 'words' as const,
  },
];

/** Returns the word count of a string. */
function countWords(text: string): number {
  return text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
}

/** Returns true if this field's content is within its limit. */
function withinLimit(field: typeof FIELDS[number], value: string): boolean {
  if (field.limitType === 'chars') return value.length <= field.max;
  return countWords(value) <= field.max;
}

type CheckInType = 'wednesday' | 'saturday';

export default function LogCheckinForm() {
  const { checkInType } = useParams<{ checkInType: string }>();
  const navigate = useNavigate();
  const type = (checkInType as CheckInType) || 'wednesday';
  const isWednesday = type === 'wednesday';
  const label = isWednesday ? 'Wednesday' : 'Saturday';

  const [form, setForm] = useState<Record<string, string>>({
    focus_area: '',
    core_action: '',
    the_blocker: '',
    the_takeaway: '',
  });

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [artifactId, setArtifactId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ref for hidden file inputs
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFieldChange = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  // ─── Upload helper (shared by both actions) ─────────────────────────────
  const uploadPhoto = async (file: File, source: 'camera' | 'file') => {
    setUploading(true);
    setError(null);
    // Show a local preview immediately
    const objectUrl = URL.createObjectURL(file);
    setPhotoPreview(objectUrl);
    setArtifactId(null);
    try {
      const token = localStorage.getItem('access_token');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_source', source);
      const res = await axios.post(
        'http://localhost:8000/api/v1/logs/artifact-upload',
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      setArtifactId(res.data.artifact_id);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Photo upload failed. Please try again.');
      setPhotoPreview(null);
    } finally {
      setUploading(false);
    }
  };

  // Action A — live camera via file input with capture attribute
  const handleCameraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadPhoto(file, 'camera');
    e.target.value = ''; // reset so same file can be re-selected
  };

  // Action B — file picker (screenshots, downloads)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadPhoto(file, 'file');
    e.target.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate all fields filled
    const emptyField = FIELDS.find(f => !form[f.key].trim());
    if (emptyField) {
      setError(`Please fill in the "${emptyField.label}" field.`);
      return;
    }

    // Validate all limits respected
    const overLimit = FIELDS.find(f => !withinLimit(f, form[f.key]));
    if (overLimit) {
      const unit = overLimit.limitType === 'chars' ? 'characters' : 'words';
      setError(`"${overLimit.label}" exceeds the ${overLimit.max} ${unit} limit. Please shorten it.`);
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('access_token');
      await axios.post(
        `http://localhost:8000/api/v1/logs/${type}`,
        {
          focus_area: form.focus_area,
          core_action: form.core_action,
          the_blocker: form.the_blocker,
          the_takeaway: form.the_takeaway,
          artifact_id: artifactId,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigate('/student/log');
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
        'Submission failed. Please check your connection and try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const allFieldsFilled = FIELDS.every(f => form[f.key].trim().length > 0);
  const allWithinLimits = FIELDS.every(f => withinLimit(f, form[f.key]));
  const canSubmit = allFieldsFilled && allWithinLimits && !submitting && !uploading;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-10">
      {/* Back nav */}
      <button
        onClick={() => navigate('/student/log')}
        className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-800 transition-colors"
      >
        ← Back to Evidence Log
      </button>

      {/* Header */}
      <div>
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide mb-3 ${
          isWednesday ? 'bg-blue-50 text-blue-700' : 'bg-violet-50 text-violet-700'
        }`}>
          {isWednesday ? '📝 Wednesday' : '📸 Saturday'} Check-in
        </div>
        <h1 className="text-2xl font-bold text-neutral-900">{label} Check-in</h1>
        <p className="text-neutral-500 mt-1 text-sm">
          {isWednesday
            ? 'Record your mid-week progress and attach a photo or screenshot of your work.'
            : 'Wrap up your week with a full reflection and attach evidence of your Saturday work.'}
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 font-medium">
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Text reflection fields */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm space-y-5">
          <h2 className="font-bold text-neutral-900">Your Reflection</h2>
          {FIELDS.map((field) => {
            const { key, label: fieldLabel, hint, max, limitType } = field;
            const value = form[key];
            const count = limitType === 'chars' ? value.length : countWords(value);
            const isOver = count > max;
            const isNearLimit = !isOver && count > max * 0.85;
            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-semibold text-neutral-800">{fieldLabel}</label>
                  <span className={`text-xs tabular-nums font-medium ${
                    isOver ? 'text-red-600' : isNearLimit ? 'text-amber-600' : 'text-neutral-400'
                  }`}>
                    {count} / {max} {limitType === 'words' ? 'words' : 'chars'}
                  </span>
                </div>
                <textarea
                  value={value}
                  onChange={e => handleFieldChange(key, e.target.value)}
                  // Only apply hard maxLength for char-limited fields
                  maxLength={limitType === 'chars' ? max : undefined}
                  placeholder={hint}
                  rows={key === 'focus_area' ? 2 : 3}
                  className={`w-full rounded-lg border px-4 py-3 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-shadow ${
                    isOver ? 'border-red-300 bg-red-50' : 'border-neutral-200'
                  }`}
                />
                {isOver && (
                  <p className="text-xs text-red-600 mt-1">
                    {limitType === 'words'
                      ? `Too many words — please trim to ${max} words.`
                      : `Too many characters — ${max} max.`}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Trust but Verify Artifact Upload ─────────────────────────────── */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm space-y-4">
          <div>
            <h2 className="font-bold text-neutral-900 mb-1">Workplace Evidence</h2>

            {/* UX Scarecrow Banner — spec §1.2 */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
              <span className="text-xl flex-shrink-0">⚠️</span>
              <p className="text-sm text-amber-800 leading-relaxed">
                <span className="font-bold">Upload a live photo or a recent screenshot of your specific task.</span>{' '}
                Note: Uploading old or irrelevant images will not help you pass the Weekly AI Validation Quiz,
                which is generated directly from your logs.
              </p>
            </div>
          </div>

          {/* Hidden file inputs */}
          {/* Action A — live camera (rear-facing on mobile) */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleCameraChange}
          />
          {/* Action B — file/screenshot picker */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Photo preview */}
          {photoPreview && (
            <div className="relative rounded-xl overflow-hidden border border-neutral-200">
              <img
                src={photoPreview}
                alt="Uploaded evidence"
                className="w-full max-h-56 object-cover"
              />
              {uploading && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <p className="text-white text-sm font-medium">Uploading...</p>
                </div>
              )}
              {artifactId && (
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-green-600 text-white text-xs font-bold shadow">
                  ✓ Uploaded
                </div>
              )}
            </div>
          )}

          {/* Dual action buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              disabled={uploading}
              className={`py-3 rounded-xl text-sm font-semibold border-2 border-dashed transition-colors ${
                artifactId
                  ? 'border-green-300 text-green-700 hover:bg-green-50'
                  : 'border-blue-300 text-blue-700 hover:bg-blue-50'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              📷 {artifactId ? 'Retake Photo' : 'Open Camera'}
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className={`py-3 rounded-xl text-sm font-semibold border-2 border-dashed transition-colors ${
                artifactId
                  ? 'border-green-300 text-green-700 hover:bg-green-50'
                  : 'border-violet-300 text-violet-700 hover:bg-violet-50'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              🖼️ {artifactId ? 'Replace File' : 'Upload Screenshot'}
            </button>
          </div>

          <p className="text-xs text-neutral-400 text-center">
            Use <span className="font-medium text-neutral-600">Open Camera</span> for live workplace photos ·{' '}
            <span className="font-medium text-neutral-600">Upload Screenshot</span> for code editors, design tools, or lab reports
          </p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={!canSubmit}
          className={`w-full py-4 rounded-xl text-sm font-bold transition-colors ${
            !canSubmit
              ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
              : 'bg-neutral-900 hover:bg-neutral-700 text-white'
          }`}
        >
          {submitting ? 'Submitting...' : uploading ? 'Uploading evidence...' : `Submit ${label} Check-in`}
        </button>

        {(!allFieldsFilled || !allWithinLimits) && (
          <p className="text-xs text-center text-neutral-400">
            {!allFieldsFilled
              ? 'Fill in all four reflection fields to enable submission.'
              : 'One or more fields exceeds its word or character limit.'}
          </p>
        )}
      </form>
    </div>
  );
}


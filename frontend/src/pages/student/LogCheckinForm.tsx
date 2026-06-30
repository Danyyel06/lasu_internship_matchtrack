import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const FIELDS = [
  {
    key: 'focus_area',
    label: 'Focus Area',
    hint: 'What area of work did you focus on?',
    max: 300,
  },
  {
    key: 'core_action',
    label: 'Core Action Taken',
    hint: 'What was the primary action you took?',
    max: 300,
  },
  {
    key: 'the_blocker',
    label: 'The Blocker',
    hint: 'What obstacle or challenge did you encounter?',
    max: 300,
  },
  {
    key: 'the_takeaway',
    label: 'Key Takeaway',
    hint: 'What did you learn or conclude?',
    max: 300,
  },
];

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

  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [artifactId, setArtifactId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraUnavailable, setCameraUnavailable] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);

  const handleFieldChange = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const openCamera = async () => {
    setCameraError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      setStream(mediaStream);
      setCameraOpen(true);
      // Small delay to let the video element render
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch(console.error);
        }
      }, 100);
    } catch (err: any) {
      const noCamera = err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError';
      const denied = err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError';
      if (noCamera) {
        setCameraUnavailable(true);
        setCameraError('No camera detected on this device. You may submit without a photo on desktop.');
      } else if (denied) {
        setCameraError('Camera permission denied. Please allow camera access in your browser settings, or submit without a photo.');
      } else {
        setCameraError('Could not access camera. Please try again, or submit without a photo.');
      }
    }
  };

  const stopCamera = () => {
    stream?.getTracks().forEach(t => t.stop());
    setStream(null);
    setCameraOpen(false);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      async (blob) => {
        if (!blob) return;
        const file = new File([blob], `checkin_${type}_${Date.now()}.jpg`, { type: 'image/jpeg' });
        setPhoto(file);
        setPhotoPreview(canvas.toDataURL('image/jpeg', 0.85));
        stopCamera();
        await uploadPhoto(file);
      },
      'image/jpeg',
      0.85
    );
  };

  const uploadPhoto = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const token = localStorage.getItem('access_token');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_source', 'camera');
      // check_in_type is now optional on the backend — will be set when check-in is submitted
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
      setError(
        err?.response?.data?.detail || 'Photo upload failed. Please retake and try again.'
      );
      setPhoto(null);
      setPhotoPreview(null);
    } finally {
      setUploading(false);
    }
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

    // Photo is strongly encouraged but not a hard block on desktop where no camera exists.
    // If camera is available but they haven't captured yet, remind them.
    if (!artifactId && !cameraUnavailable && !cameraError) {
      setError('A workplace photo is required. Please capture one using the camera below.');
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
  // Submit is enabled when all text fields are filled, regardless of photo.
  const canSubmit = allFieldsFilled && !submitting && !uploading;

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
            ? 'Record your mid-week progress. Include a live workplace photo to verify your presence.'
            : 'Wrap up your week with a full reflection and a live Saturday workplace photo.'}
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
          {FIELDS.map(({ key, label, hint, max }) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold text-neutral-800">{label}</label>
                <span className={`text-xs tabular-nums ${
                  form[key].length > max * 0.85 ? 'text-amber-600 font-medium' : 'text-neutral-400'
                }`}>
                  {form[key].length} / {max}
                </span>
              </div>
              <textarea
                value={form[key]}
                onChange={e => handleFieldChange(key, e.target.value)}
                maxLength={max}
                placeholder={hint}
                rows={3}
                className="w-full rounded-lg border border-neutral-200 px-4 py-3 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-shadow"
              />
            </div>
          ))}
        </div>

        {/* KYC Photo section */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm">
          <h2 className="font-bold text-neutral-900 mb-1">Workplace Photo</h2>
          <p className="text-sm text-neutral-500 mb-4">
            Take a live photo using your device's rear camera to verify your workplace presence.
            Gallery uploads are not accepted.
            {cameraUnavailable && <span className="block mt-1 text-amber-600 font-medium">No camera found — you can still submit your reflection without a photo.</span>}
          </p>

          {/* Camera error */}
          {cameraError && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {cameraError}
            </div>
          )}

          {/* Live camera viewfinder */}
          {cameraOpen && (
            <div className="mb-4 relative rounded-xl overflow-hidden bg-black border border-neutral-200">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full max-h-72 object-cover"
              />
              <div className="absolute inset-0 flex flex-col justify-between p-4">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center text-xs hover:bg-black/70 transition-colors"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="w-16 h-16 rounded-full bg-white border-4 border-neutral-200 shadow-lg flex items-center justify-center hover:bg-neutral-100 transition-colors"
                    aria-label="Capture photo"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-600" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Photo preview after capture */}
          {photoPreview && !cameraOpen && (
            <div className="mb-4 rounded-xl overflow-hidden border border-neutral-200 relative">
              <img
                src={photoPreview}
                alt="Captured workplace photo"
                className="w-full max-h-56 object-cover"
              />
              {uploading && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <p className="text-white text-sm font-medium">Uploading...</p>
                </div>
              )}
              {artifactId && (
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-green-600 text-white text-xs font-bold">
                  ✓ Uploaded
                </div>
              )}
            </div>
          )}

          {/* Camera trigger button */}
          {!cameraOpen && (
            <button
              type="button"
              onClick={openCamera}
              className={`w-full py-3.5 rounded-xl text-sm font-semibold transition-colors border-2 border-dashed ${
                artifactId
                  ? 'border-green-300 text-green-700 hover:bg-green-50'
                  : 'border-neutral-300 text-neutral-600 hover:border-blue-400 hover:text-blue-600'
              }`}
            >
              {artifactId ? '📸 Retake Photo' : '📷 Open Camera'}
            </button>
          )}
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
          {submitting ? 'Submitting...' : uploading ? 'Uploading photo...' : `Submit ${label} Check-in`}
        </button>

        {!allFieldsFilled && (
          <p className="text-xs text-center text-neutral-400">
            Fill in all four reflection fields to enable submission.
          </p>
        )}
      </form>
    </div>
  );
}

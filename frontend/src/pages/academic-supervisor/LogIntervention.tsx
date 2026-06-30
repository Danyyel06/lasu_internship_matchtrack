import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

export default function LogIntervention() {
  const navigate = useNavigate();
  const { studentId } = useParams();

  const [student, setStudent] = useState<any>(null);
  const [method, setMethod] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const res = await axios.get('http://localhost:8000/api/v1/academic-supervisors/students', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const foundStudent = res.data.find((s: any) => s.id === parseInt(studentId || '0'));
        setStudent(foundStudent);
      } catch (err) {
        console.error("Failed to fetch student", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudent();
  }, [studentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!method || !date || !notes) return;
    
    setSubmitting(true);
    setError('');
    
    try {
      const token = localStorage.getItem('access_token');
      await axios.post(
        `http://localhost:8000/api/v1/academic-supervisors/students/${studentId}/interventions`,
        {
          contact_method: method,
          contact_date: date,
          notes: notes
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert('Intervention logged successfully.');
      navigate('/academic-supervisor/log-wall');
    } catch (err: any) {
      console.error("Failed to log intervention", err);
      setError(err.response?.data?.detail || 'Failed to log intervention. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (!student) return <div className="p-6">Student not found.</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/academic-supervisor/log-wall')}
            className="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center text-neutral-500 hover:bg-neutral-50 transition-colors"
          >
            ←
          </button>
          <h1 className="text-xl font-bold text-neutral-900">Log Intervention</h1>
        </div>
      </div>

      {/* Identity Card */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-200 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-700 font-bold text-lg border border-red-200">
          {student.name.charAt(0)}
        </div>
        <div>
          <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1 block">Intervention For</span>
          <div className="flex items-center gap-3">
            <h2 className="font-bold text-neutral-900 text-lg">{student.name}</h2>
            <span className="text-sm font-medium bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded">ID: {student.id}</span>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 text-sm text-blue-800">
        <span className="text-blue-600 mt-0.5">ⓘ</span>
        <p>
          Logging a contact adds a timestamped note to the student's record visible to the HOD. It does not automatically resolve red flags.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 text-sm">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200 space-y-6">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">Contact Method</label>
          <select 
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            required
            className="w-full px-4 py-3 border border-neutral-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 outline-none"
          >
            <option value="" disabled>Select method</option>
            <option value="Phone Call">Phone Call</option>
            <option value="In-Person">In-Person</option>
            <option value="Email">Email</option>
            <option value="WhatsApp">WhatsApp</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">Date of Contact</label>
          <input 
            type="date" 
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full px-4 py-3 border border-neutral-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">Intervention Notes</label>
          <textarea 
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            required
            rows={5}
            placeholder="Describe the discussion and specific outcomes..."
            className="w-full px-4 py-3 border border-neutral-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 outline-none resize-none"
          ></textarea>
        </div>

        <div className="pt-4 flex flex-col gap-3">
          <button 
            type="submit" 
            disabled={submitting}
            className="w-full py-3 px-4 rounded-xl bg-black text-white font-medium hover:bg-neutral-800 transition-colors shadow-sm disabled:bg-neutral-400"
          >
            {submitting ? 'Saving...' : 'Save Log Entry'}
          </button>
          <button 
            type="button" 
            onClick={() => navigate('/academic-supervisor/log-wall')} 
            className="w-full py-3 px-4 text-neutral-500 font-medium hover:text-neutral-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

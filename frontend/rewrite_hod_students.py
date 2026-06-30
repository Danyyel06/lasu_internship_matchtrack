import os

filepath = "c:/Users/User/lasu-internship-platform/frontend/src/pages/hod/Students.tsx"

new_content = """import { useState, useEffect } from 'react';
import axios from 'axios';

export default function HodStudents() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  
  const [supervisors, setSupervisors] = useState<any[]>([]);
  const [assigningId, setAssigningId] = useState<number | null>(null);
  const [selectedSupervisor, setSelectedSupervisor] = useState<number | ''>('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchStudents();
    fetchSupervisors();
  }, []);

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.get('http://localhost:8000/api/v1/hod/students', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(res.data);
    } catch (err: any) {
      console.error("Failed to fetch department students", err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        alert("Authentication Error: You are not authorized to view HOD data. Please log out and log back in with the HOD account (rajilawal@lasu.edu.ng).");
      }
    }
  };

  const fetchSupervisors = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.get('http://localhost:8000/api/v1/hod/supervisors', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSupervisors(res.data);
    } catch (err) {
      console.error("Failed to fetch supervisors", err);
    }
  };

  const handleAssignSupervisor = async () => {
    if (!selectedSupervisor || !selectedStudent) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem('access_token');
      await axios.post(
        `http://localhost:8000/api/v1/hod/students/${selectedStudent.id}/assign-supervisor`,
        { supervisor_id: selectedSupervisor },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Supervisor assigned successfully!");
      setAssigningId(null);
      setSelectedSupervisor('');
      
      // Update local state temporarily for UX
      const assignedSup = supervisors.find(s => s.id === Number(selectedSupervisor));
      if (assignedSup) {
        setSelectedStudent({...selectedStudent, supervisor: assignedSup.name});
      }
      
      await fetchStudents();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to assign supervisor");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = students.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || (s.matric && s.matric.includes(searchTerm)));

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Department Students</h1>
          <p className="text-neutral-500">Monitor placement status and assign academic supervisors.</p>
        </div>
        <div className="flex items-center gap-4">
          <input 
            type="text" 
            placeholder="Search students..." 
            className="p-2.5 border border-neutral-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg font-medium">Filter</button>
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-neutral-50 border-b border-neutral-200 text-sm text-neutral-600">
            <tr>
              <th className="px-6 py-4 font-medium">Student</th>
              <th className="px-6 py-4 font-medium">Matric No</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Company Placement</th>
              <th className="px-6 py-4 font-medium">Academic Supervisor</th>
              <th className="px-6 py-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {filtered.map(student => (
              <tr key={student.id} className="hover:bg-neutral-50 transition-colors">
                <td className="px-6 py-4 font-medium text-neutral-900">{student.name}</td>
                <td className="px-6 py-4 text-neutral-500">{student.matric}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                    student.status === 'Placed' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {student.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm">
                    <p className="font-medium text-neutral-900">{student.company}</p>
                    {student.company !== 'None' && <p className="text-neutral-500 text-xs">{student.role}</p>}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-sm ${student.supervisor === 'Unassigned' ? 'text-red-600 font-medium' : 'text-neutral-700'}`}>
                    {student.supervisor}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button 
                    onClick={() => setSelectedStudent(student)}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-12 text-center text-neutral-500">No students found matching your search.</div>
        )}
      </div>

      {selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-neutral-900">{selectedStudent.name}</h2>
                <p className="text-neutral-500 text-sm">Matric: {selectedStudent.matric}</p>
              </div>
              <button onClick={() => { setSelectedStudent(null); setAssigningId(null); }} className="p-2 hover:bg-neutral-100 rounded-lg text-neutral-500">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                <p className="text-sm text-blue-800 font-medium">
                  <strong>Access Restricted:</strong> As Head of Department, you can view placement metadata but you cannot view specific weekly logbook (Pulse) contents or inline feedback. That channel is strictly reserved for the Academic and Industry Supervisors.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-neutral-900 mb-4">Placement Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                    <p className="text-sm text-neutral-500 mb-1">Company</p>
                    <p className="font-semibold text-neutral-900">{selectedStudent.company}</p>
                  </div>
                  <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                    <p className="text-sm text-neutral-500 mb-1">Role</p>
                    <p className="font-semibold text-neutral-900">{selectedStudent.role}</p>
                  </div>
                  <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                    <p className="text-sm text-neutral-500 mb-1">Academic Supervisor</p>
                    <p className="font-semibold text-neutral-900">{selectedStudent.supervisor}</p>
                  </div>
                  <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                    <p className="text-sm text-neutral-500 mb-1">Status</p>
                    <p className="font-semibold text-neutral-900">{selectedStudent.status}</p>
                  </div>
                </div>
              </div>

              {assigningId === selectedStudent.id && (
                <div className="bg-white border border-neutral-300 rounded-xl p-4 shadow-sm">
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Select Supervisor to Assign</label>
                  <div className="flex gap-3">
                    <select 
                      className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
                      value={selectedSupervisor}
                      onChange={(e) => setSelectedSupervisor(Number(e.target.value))}
                    >
                      <option value="" disabled>Select a supervisor...</option>
                      {supervisors.map(sup => (
                        <option key={sup.id} value={sup.id}>{sup.name} ({sup.assignedStudents}/{sup.maxStudents} assigned)</option>
                      ))}
                    </select>
                    <button 
                      onClick={handleAssignSupervisor}
                      disabled={!selectedSupervisor || submitting}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-neutral-300"
                    >
                      {submitting ? 'Saving...' : 'Confirm'}
                    </button>
                    <button 
                      onClick={() => setAssigningId(null)}
                      className="px-4 py-2 text-neutral-600 font-medium hover:bg-neutral-100 rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {selectedStudent.interventions && selectedStudent.interventions.length > 0 && (
                <div>
                  <h3 className="font-bold text-neutral-900 mb-4 flex items-center gap-2">
                    <span className="text-red-500">🚩</span> Logged Interventions
                  </h3>
                  <div className="space-y-4">
                    {selectedStudent.interventions.map((intervention: any, idx: number) => (
                      <div key={idx} className="p-4 bg-white border border-red-200 rounded-lg shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-bold bg-neutral-100 text-neutral-700 px-2 py-1 rounded">
                            {intervention.method}
                          </span>
                          <span className="text-xs text-neutral-500 font-medium">{intervention.date}</span>
                        </div>
                        <p className="text-sm text-neutral-800 mb-3">{intervention.notes}</p>
                        <p className="text-xs text-neutral-500">Logged by: <span className="font-medium text-neutral-700">{intervention.logged_by}</span></p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-neutral-200 bg-neutral-50 flex justify-end gap-3 rounded-b-xl">
              <button onClick={() => { setSelectedStudent(null); setAssigningId(null); }} className="px-4 py-2 bg-white border border-neutral-300 text-neutral-700 font-medium rounded-lg hover:bg-neutral-50">Close</button>
              {selectedStudent.supervisor === 'Unassigned' && selectedStudent.status === 'Placed' && assigningId !== selectedStudent.id && (
                <button 
                  onClick={() => setAssigningId(selectedStudent.id)}
                  className="px-4 py-2 bg-neutral-900 text-white font-medium rounded-lg hover:bg-neutral-800"
                >
                  Assign Supervisor Now
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
"""

with open(filepath, "w", encoding="utf-8") as f:
    f.write(new_content)

print("Rewritten Students.tsx")

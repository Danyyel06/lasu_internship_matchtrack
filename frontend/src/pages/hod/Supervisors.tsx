import { useState, useEffect } from 'react';
import axios from 'axios';

export default function HodSupervisors() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedSupervisorForAssign, setSelectedSupervisorForAssign] = useState<any>(null);
  const [supervisors, setSupervisors] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<Set<number>>(new Set());
  
  // New supervisor form
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newTitle, setNewTitle] = useState('Lecturer');

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const [supRes, stuRes] = await Promise.all([
        axios.get('http://localhost:8000/api/v1/hod/supervisors', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('http://localhost:8000/api/v1/hod/students', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setSupervisors(supRes.data);
      setStudents(stuRes.data);
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        alert("Authentication Error: You are not authorized to view HOD data. Please log out and log back in with the HOD account (rajilawal@lasu.edu.ng).");
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const unassignedStudents = students.filter(s => s.status === 'Placed' && s.supervisor === 'Unassigned');

  const handleCreateSupervisor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('access_token');
      await axios.post('http://localhost:8000/api/v1/hod/supervisors', {
        name: newName.trim(),
        email: newEmail.trim(),
        title: newTitle
      }, { headers: { Authorization: `Bearer ${token}` } });
      alert('Supervisor invited successfully! Password is password123');
      setIsAddModalOpen(false);
      setNewName('');
      setNewEmail('');
      setNewTitle('Lecturer');
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error creating supervisor');
    }
  };

  const handleToggleStudent = (id: number) => {
    const newSet = new Set(selectedStudents);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedStudents(newSet);
  };

  const handleAssign = async () => {
    if (selectedStudents.size === 0) return;
    try {
      const token = localStorage.getItem('access_token');
      await Promise.all(Array.from(selectedStudents).map(studentId => 
        axios.post(`http://localhost:8000/api/v1/hod/students/${studentId}/assign-supervisor`, {
          supervisor_user_id: selectedSupervisorForAssign.id
        }, { headers: { Authorization: `Bearer ${token}` } })
      ));
      alert('Students assigned successfully!');
      setSelectedSupervisorForAssign(null);
      setSelectedStudents(new Set());
      fetchData();
    } catch (err) {
      alert('Error assigning students');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Academic Supervisors</h1>
          <p className="text-neutral-500">Manage lecturers and their student supervision loads.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors flex items-center gap-2"
        >
          <span>+</span> Add New Supervisor
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 border border-neutral-200 rounded-xl shadow-sm">
          <p className="text-sm font-medium text-neutral-500 mb-1">Total Supervisors</p>
          <p className="text-2xl font-bold text-neutral-900">{supervisors.length}</p>
        </div>
        <div className="bg-white p-4 border border-neutral-200 rounded-xl shadow-sm">
          <p className="text-sm font-medium text-neutral-500 mb-1">Total Capacity Available</p>
          <p className="text-2xl font-bold text-success-dark">{supervisors.reduce((acc, curr) => acc + curr.maxStudents, 0)} Students</p>
        </div>
        <div className="bg-white p-4 border border-neutral-200 rounded-xl shadow-sm">
          <p className="text-sm font-medium text-neutral-500 mb-1">Students Assigned</p>
          <p className="text-2xl font-bold text-neutral-900">{supervisors.reduce((acc, curr) => acc + curr.assignedStudents, 0)} Students</p>
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-neutral-50 border-b border-neutral-200 text-sm text-neutral-600">
            <tr>
              <th className="px-6 py-4 font-medium">Lecturer</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Student Load</th>
              <th className="px-6 py-4 font-medium">Capacity Utilized</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {supervisors.map(sup => {
              const util = Math.round((sup.assignedStudents / sup.maxStudents) * 100) || 0;
              return (
                <tr key={sup.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-neutral-900">{sup.name}</p>
                    <p className="text-sm text-neutral-500">{sup.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                      sup.status === 'Active' ? 'bg-success-50 text-success-dark' : 'bg-neutral-100 text-neutral-700'
                    }`}>
                      {sup.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-neutral-900">{sup.assignedStudents}</span>
                    <span className="text-neutral-500 text-sm"> / {sup.maxStudents}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${util > 90 ? 'bg-danger' : util > 70 ? 'bg-amber-500' : 'bg-success'}`}
                          style={{ width: `${util}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-neutral-600 w-8">{util}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button 
                        onClick={() => { setSelectedSupervisorForAssign(sup); setSelectedStudents(new Set()); }}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        Assign Interns
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {supervisors.length === 0 && (
          <div className="p-12 text-center text-neutral-500">No supervisors added yet.</div>
        )}
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md flex flex-col">
            <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-neutral-900">Invite Academic Supervisor</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-neutral-100 rounded-lg text-neutral-500">✕</button>
            </div>
            
            <form onSubmit={handleCreateSupervisor} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Full Name</label>
                <input value={newName} onChange={e => setNewName(e.target.value)} type="text" required placeholder="e.g. Dr. Adamu" className="w-full p-2.5 border border-neutral-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Staff Title</label>
                <input value={newTitle} onChange={e => setNewTitle(e.target.value)} type="text" required placeholder="e.g. Lecturer" className="w-full p-2.5 border border-neutral-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Official Email</label>
                <input value={newEmail} onChange={e => setNewEmail(e.target.value)} type="email" required placeholder="e.g. adamu@lasu.edu.ng" className="w-full p-2.5 border border-neutral-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 bg-white border border-neutral-300 text-neutral-700 font-medium rounded-lg hover:bg-neutral-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700">Send Invitation</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedSupervisorForAssign && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl flex flex-col">
            <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-neutral-900">Assign Interns to {selectedSupervisorForAssign.name}</h2>
                <p className="text-sm text-neutral-500">Select unassigned students below</p>
              </div>
              <button onClick={() => setSelectedSupervisorForAssign(null)} className="p-2 hover:bg-neutral-100 rounded-lg text-neutral-500">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-2">
                {unassignedStudents.map((student: any) => (
                  <label key={student.id} className="flex items-center gap-4 p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={selectedStudents.has(student.id)}
                      onChange={() => handleToggleStudent(student.id)}
                      className="w-4 h-4 text-blue-600 rounded border-neutral-300 focus:ring-blue-500" 
                    />
                    <div>
                      <p className="font-medium text-neutral-900">{student.name}</p>
                      <p className="text-sm text-neutral-500">Matric: {student.matric}</p>
                    </div>
                  </label>
                ))}
                {unassignedStudents.length === 0 && (
                  <p className="text-neutral-500 text-center py-8">No unassigned students available.</p>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-neutral-200 bg-neutral-50 flex justify-end gap-3 rounded-b-xl">
              <button onClick={() => setSelectedSupervisorForAssign(null)} className="px-4 py-2 bg-white border border-neutral-300 text-neutral-700 font-medium rounded-lg hover:bg-neutral-50">Cancel</button>
              <button onClick={handleAssign} disabled={selectedStudents.size === 0} className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">Confirm Assignment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

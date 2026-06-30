import os

filepath = "c:/Users/User/lasu-internship-platform/frontend/src/pages/academic-supervisor/Profile.tsx"

new_content = """
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function AcademicSupervisorProfile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ first_name: '', last_name: '', phone_number: '', office_location: '' });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.get('http://localhost:8000/api/v1/academic/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(res.data);
      setEditForm({
        first_name: res.data.first_name || '',
        last_name: res.data.last_name || '',
        phone_number: res.data.phone_number || '',
        office_location: res.data.office_location || ''
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdate = async () => {
    try {
      const token = localStorage.getItem('access_token');
      await axios.put('http://localhost:8000/api/v1/academic/profile', editForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsEditing(false);
      fetchProfile();
    } catch (err) {
      console.error(err);
      alert('Failed to update profile');
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    navigate('/login');
  };

  if (!profile) return <div className="p-8 text-center text-neutral-500">Loading profile...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Profile</h1>
          <p className="text-neutral-500 mt-1">Manage your account and academic details.</p>
        </div>
      </div>

      {/* Top Card */}
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-neutral-200 flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
        <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-3xl relative uppercase">
          {profile.first_name?.[0]}{profile.last_name?.[0]}
        </div>
        <div className="flex-1">
          <h2 className="text-3xl font-bold text-neutral-900 mb-1">{profile.first_name} {profile.last_name}</h2>
          <p className="text-lg text-neutral-600 mb-4">Senior Lecturer, {profile.department}</p>
          <div className="flex flex-wrap justify-center md:justify-start gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-bold border ${
              profile.is_verified ? 'bg-green-100 text-green-700 border-green-200' : 'bg-amber-100 text-amber-700 border-amber-200'
            }`}>
              {profile.is_verified ? 'Active Supervisor' : 'Pending Verification'}
            </span>
            <span className="bg-neutral-100 text-neutral-700 px-3 py-1 rounded-full text-sm font-medium border border-neutral-200">
              {profile.faculty}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-neutral-900">Personal Information</h2>
              <button onClick={() => setIsEditing(!isEditing)} className="text-sm font-medium text-blue-600 hover:text-blue-700">
                {isEditing ? 'Cancel' : 'Edit'}
              </button>
            </div>
            
            {isEditing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">First Name</label>
                    <input 
                      type="text" 
                      className="w-full border px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
                      value={editForm.first_name}
                      onChange={(e) => setEditForm({...editForm, first_name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Last Name</label>
                    <input 
                      type="text" 
                      className="w-full border px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
                      value={editForm.last_name}
                      onChange={(e) => setEditForm({...editForm, last_name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Phone Number</label>
                    <input 
                      type="text" 
                      className="w-full border px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
                      value={editForm.phone_number}
                      onChange={(e) => setEditForm({...editForm, phone_number: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Office Location</label>
                    <input 
                      type="text" 
                      className="w-full border px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
                      value={editForm.office_location}
                      onChange={(e) => setEditForm({...editForm, office_location: e.target.value})}
                    />
                  </div>
                </div>
                <button 
                  onClick={handleUpdate}
                  className="w-full bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-neutral-500 mb-1">Email Address</label>
                    <p className="text-neutral-900 font-medium">{profile.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-500 mb-1">Phone Number</label>
                    <p className="text-neutral-900 font-medium">{profile.phone_number}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-500 mb-1">Office Location</label>
                    <p className="text-neutral-900 font-medium">{profile.office_location}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-500 mb-1">Faculty / Department</label>
                    <p className="text-neutral-900 font-medium">{profile.faculty} / {profile.department}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-neutral-900 rounded-2xl p-6 shadow-sm text-white">
            <div className="w-10 h-10 bg-neutral-800 rounded-lg flex items-center justify-center text-xl mb-4">📚</div>
            <h2 className="text-lg font-semibold mb-2">Academic Supervision Handbook</h2>
            <p className="text-sm text-neutral-400 mb-6 leading-relaxed">
              Review the official university guidelines for student internship mentorship and grading protocols.
            </p>
            <button className="w-full py-3 px-4 rounded-xl border border-neutral-700 text-sm font-medium hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2">
              View Handbook <span>↗</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-200">
            <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3 px-2">Account Settings</h2>
            <div className="space-y-1">
              <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-neutral-50 text-left transition-colors group">
                <span className="text-sm font-medium text-neutral-700">Change Password</span>
                <span className="text-neutral-400 group-hover:text-neutral-900 transition-colors">→</span>
              </button>
              <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-neutral-50 text-left transition-colors group">
                <span className="text-sm font-medium text-neutral-700">Notification Preferences</span>
                <span className="text-neutral-400 group-hover:text-neutral-900 transition-colors">→</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-6 text-center pb-6">
        <button onClick={handleSignOut} className="w-full md:w-auto px-8 py-3 bg-red-50 text-red-700 font-bold rounded-xl hover:bg-red-100 transition-colors border border-red-100">
          Sign Out
        </button>
      </div>
    </div>
  );
}
"""

with open(filepath, "w", encoding="utf-8") as f:
    f.write(new_content)

print("Rewritten AcademicSupervisorProfile.tsx")

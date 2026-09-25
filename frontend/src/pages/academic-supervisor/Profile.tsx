import { useState, useEffect } from 'react';
import axios from 'axios';

export default function AcademicSupervisorProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    office_location: '',
    title: '',
  });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.get('/api/v1/academic-supervisors/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(res.data);
      setEditForm({
        first_name: res.data.first_name || '',
        last_name: res.data.last_name || '',
        phone_number: res.data.phone_number || '',
        office_location: res.data.office_location || '',
        title: res.data.title || '',
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdate = async () => {
    setSaving(true);
    setSaveMsg('');
    try {
      const token = localStorage.getItem('access_token');
      await axios.put('/api/v1/academic-supervisors/profile', editForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsEditing(false);
      setSaveMsg('Profile updated successfully.');
      await fetchProfile();
    } catch (err) {
      console.error(err);
      setSaveMsg('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
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

      {saveMsg && (
        <div className={`px-4 py-3 rounded-lg text-sm font-medium ${saveMsg.startsWith('Profile updated') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {saveMsg}
        </div>
      )}

      {/* Top Card */}
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-neutral-200 flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
        <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-3xl relative uppercase">
          {profile.first_name?.[0]}{profile.last_name?.[0]}
        </div>
        <div className="flex-1">
          <h2 className="text-3xl font-bold text-neutral-900 mb-1">{profile.first_name} {profile.last_name}</h2>
          {/* Title line — blank if no title set */}
          {(profile.title || profile.department) && (
            <p className="text-lg text-neutral-600 mb-4">
              {[profile.title, profile.department].filter(Boolean).join(', ')}
            </p>
          )}
          <div className="flex flex-wrap justify-center md:justify-start gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-bold border ${
              profile.is_verified ? 'bg-green-100 text-green-700 border-green-200' : 'bg-amber-100 text-amber-700 border-amber-200'
            }`}>
              {profile.is_verified ? 'Active Supervisor' : 'Pending Verification'}
            </span>
            {profile.faculty && (
              <span className="bg-neutral-100 text-neutral-700 px-3 py-1 rounded-full text-sm font-medium border border-neutral-200">
                {profile.faculty}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-neutral-900">Personal Information</h2>
              <button onClick={() => { setIsEditing(!isEditing); setSaveMsg(''); }} className="text-sm font-medium text-blue-600 hover:text-blue-700">
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
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Title / Academic Rank</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Senior Lecturer, Professor"
                      className="w-full border px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
                      value={editForm.title}
                      onChange={(e) => setEditForm({...editForm, title: e.target.value})}
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
                  <div className="md:col-span-2">
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
                  disabled={saving}
                  className="w-full bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving ? 'Saving…' : 'Save Changes'}
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
                    <label className="block text-sm font-medium text-neutral-500 mb-1">Title / Academic Rank</label>
                    <p className="text-neutral-900 font-medium">{profile.title || <span className="text-neutral-400 italic">Not set</span>}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-500 mb-1">Phone Number</label>
                    <p className="text-neutral-900 font-medium">{profile.phone_number || <span className="text-neutral-400 italic">Not set</span>}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-500 mb-1">Office Location</label>
                    <p className="text-neutral-900 font-medium">{profile.office_location || <span className="text-neutral-400 italic">Not set</span>}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-500 mb-1">Faculty / Department</label>
                    <p className="text-neutral-900 font-medium">{[profile.faculty, profile.department].filter(Boolean).join(' / ') || <span className="text-neutral-400 italic">Not set</span>}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Account Settings — only Change Password */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-200">
            <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3 px-2">Account Settings</h2>
            <div className="space-y-1">
              <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-neutral-50 text-left transition-colors group">
                <span className="text-sm font-medium text-neutral-700">Change Password</span>
                <span className="text-neutral-400 group-hover:text-neutral-900 transition-colors">→</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

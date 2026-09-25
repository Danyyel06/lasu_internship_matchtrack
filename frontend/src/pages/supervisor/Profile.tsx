
import { useState, useEffect } from 'react';
import api from '../../lib/axios';
import { useNavigate } from 'react-router-dom';

export default function SupervisorProfile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ first_name: '', last_name: '', phone_number: '', linkedin_profile: '', mentorship_philosophy: '' });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/supervisors/profile');
      setProfile(res.data);
      setEditForm({
        first_name: res.data.first_name || '',
        last_name: res.data.last_name || '',
        phone_number: res.data.phone_number || '',
        linkedin_profile: res.data.linkedin_profile || '',
        mentorship_philosophy: res.data.mentorship_philosophy || ''
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdate = async () => {
    try {
      await api.put('/supervisors/profile', editForm);
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
          <p className="text-neutral-500 mt-1">Manage your account and professional details.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Account Information */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-neutral-900">Account Information</h2>
              <button onClick={() => setIsEditing(!isEditing)} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                {isEditing ? 'Cancel' : 'Edit Details'}
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-500 mb-1">First Name</label>
                  {isEditing ? (
                    <input type="text" className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none" value={editForm.first_name} onChange={e => setEditForm({...editForm, first_name: e.target.value})} />
                  ) : (
                    <p className="text-neutral-900">{profile.first_name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-500 mb-1">Last Name</label>
                  {isEditing ? (
                    <input type="text" className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none" value={editForm.last_name} onChange={e => setEditForm({...editForm, last_name: e.target.value})} />
                  ) : (
                    <p className="text-neutral-900">{profile.last_name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-500 mb-1">Email</label>
                  {isEditing ? (
                    <input type="email" className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm outline-none bg-neutral-100 cursor-not-allowed" value={profile.email} disabled />
                  ) : (
                    <p className="text-neutral-900">{profile.email}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-500 mb-1">Phone Number</label>
                  {isEditing ? (
                    <input type="text" className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none" value={editForm.phone_number} onChange={e => setEditForm({...editForm, phone_number: e.target.value})} />
                  ) : (
                    <p className="text-neutral-900">{profile.phone_number}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Professional Details */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200">
            <h2 className="text-lg font-semibold text-neutral-900 mb-6">Professional Details</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-500 mb-1">LinkedIn Profile</label>
                {isEditing ? (
                  <input type="url" className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none" value={editForm.linkedin_profile} onChange={e => setEditForm({...editForm, linkedin_profile: e.target.value})} />
                ) : (
                  <a href={profile.linkedin_profile || "#"} className="text-blue-600 hover:underline" target="_blank" rel="noreferrer">
                    {profile.linkedin_profile || "Not specified"}
                  </a>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-500 mb-1">Mentorship Philosophy</label>
                {isEditing ? (
                  <textarea rows={4} className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none" value={editForm.mentorship_philosophy} onChange={e => setEditForm({...editForm, mentorship_philosophy: e.target.value})}></textarea>
                ) : (
                  <p className="text-neutral-900 text-sm whitespace-pre-wrap">{profile.mentorship_philosophy || "Not specified"}</p>
                )}
              </div>
            </div>
          </div>
          
          {isEditing && (
            <button onClick={handleUpdate} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-colors">
              Update Profile
            </button>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-200">
            <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider mb-4 px-2">Workplace & Security</h2>
            <div className="space-y-1">
              <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-neutral-50 text-left transition-colors group">
                <span className="text-sm font-medium text-neutral-700">Change Password</span>
                <span className="text-neutral-400 group-hover:text-neutral-900 transition-colors">→</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-200">
            <div className="pt-2 mt-2">
              <button onClick={handleSignOut} className="w-full text-left p-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

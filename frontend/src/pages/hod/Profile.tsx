
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function HODProfile() {
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
      const res = await axios.get('/api/v1/hod/profile', {
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
      await axios.put('/api/v1/hod/profile', editForm, {
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
          <p className="text-neutral-500 mt-1">Manage your account and departmental details.</p>
        </div>
      </div>

      {/* Top Card */}
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-neutral-200 flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
        <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-3xl relative uppercase">
          {profile.first_name?.[0]}{profile.last_name?.[0]}
          {profile.is_verified && (
            <div className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full flex items-center justify-center text-teal-600 shadow-sm border border-neutral-100 text-sm">
              ✔
            </div>
          )}
        </div>
        <div className="flex-1 mt-2 md:mt-0">
          <h2 className="text-3xl font-bold text-neutral-900 mb-1">{profile.first_name} {profile.last_name}</h2>
          <p className="text-lg text-neutral-600 mb-4">Head of Department, {profile.department}</p>
          <div className="flex flex-wrap justify-center md:justify-start gap-3">
            <span className={`px-4 py-1.5 rounded-full text-sm font-bold border flex items-center gap-2 ${
              profile.is_verified ? 'bg-teal-50 text-teal-700 border-teal-100' : 'bg-amber-50 text-amber-700 border-amber-100'
            }`}>
              {profile.is_verified ? '✔ Verified Account' : 'Pending Verification'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-neutral-900">Personal Information</h2>
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              {isEditing ? 'Cancel' : 'Edit'}
            </button>
          </div>
          
          {isEditing ? (
            <div className="space-y-4">
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
              <button 
                onClick={handleUpdate}
                className="w-full bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-4 border-b border-neutral-100 pb-4">
                <div className="w-10 h-10 rounded-full bg-neutral-50 flex items-center justify-center text-neutral-500">✉️</div>
                <div>
                  <p className="text-sm font-medium text-neutral-500">Email Address</p>
                  <p className="text-neutral-900 font-medium">{profile.email}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 border-b border-neutral-100 pb-4">
                <div className="w-10 h-10 rounded-full bg-neutral-50 flex items-center justify-center text-neutral-500">📞</div>
                <div>
                  <p className="text-sm font-medium text-neutral-500">Phone Number</p>
                  <p className="text-neutral-900 font-medium">{profile.phone_number}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-neutral-50 flex items-center justify-center text-neutral-500">🏢</div>
                <div>
                  <p className="text-sm font-medium text-neutral-500">Office Location</p>
                  <p className="text-neutral-900 font-medium">{profile.office_location}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Departmental Details */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 mb-6">Departmental Details</h2>
            
            <div className="space-y-6">
              <div className="flex items-center gap-4 border-b border-neutral-100 pb-4">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">🏛️</div>
                <div>
                  <p className="text-sm font-medium text-neutral-500">Faculty</p>
                  <p className="text-neutral-900 font-bold">{profile.faculty}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 border-b border-neutral-100 pb-4">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">📋</div>
                <div>
                  <p className="text-sm font-medium text-neutral-500">Department</p>
                  <p className="text-neutral-900 font-bold">{profile.department}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <button 
              onClick={handleSignOut}
              className="w-full py-3 px-4 bg-red-50 text-red-700 font-bold rounded-xl hover:bg-red-100 transition-colors border border-red-100"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import os

filepath = "c:/Users/User/lasu-internship-platform/frontend/src/pages/company/Profile.tsx"

new_content = """
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function CompanyProfile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ 
    first_name: '', last_name: '', phone_number: '', 
    company_name: '', industry: '', company_size: '', company_website: '', company_address: '' 
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.get('http://localhost:8000/api/v1/companies/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(res.data);
      setEditForm({
        first_name: res.data.first_name || '',
        last_name: res.data.last_name || '',
        phone_number: res.data.phone_number || '',
        company_name: res.data.company_name || '',
        industry: res.data.industry || '',
        company_size: res.data.company_size || '',
        company_website: res.data.company_website || '',
        company_address: res.data.company_address || ''
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdate = async () => {
    try {
      const token = localStorage.getItem('access_token');
      await axios.put('http://localhost:8000/api/v1/companies/profile', editForm, {
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
          <h1 className="text-2xl font-bold text-neutral-900">Company Profile</h1>
          <p className="text-neutral-500 mt-1">Manage your account and company details.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Representative Information */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-neutral-900">Representative Information</h2>
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

          {/* Company Details */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200">
            <h2 className="text-lg font-semibold text-neutral-900 mb-6">Company Details</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-500 mb-1">Company Name</label>
                  {isEditing ? (
                    <input type="text" className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none" value={editForm.company_name} onChange={e => setEditForm({...editForm, company_name: e.target.value})} />
                  ) : (
                    <p className="text-neutral-900">{profile.company_name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-500 mb-1">Industry</label>
                  {isEditing ? (
                    <input type="text" className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none" value={editForm.industry} onChange={e => setEditForm({...editForm, industry: e.target.value})} />
                  ) : (
                    <p className="text-neutral-900">{profile.industry || "Not specified"}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-500 mb-1">Company Size</label>
                  {isEditing ? (
                    <input type="text" className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none" value={editForm.company_size} onChange={e => setEditForm({...editForm, company_size: e.target.value})} />
                  ) : (
                    <p className="text-neutral-900">{profile.company_size || "Not specified"}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-500 mb-1">Website</label>
                  {isEditing ? (
                    <input type="text" className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none" value={editForm.company_website} onChange={e => setEditForm({...editForm, company_website: e.target.value})} />
                  ) : (
                    <a href={profile.company_website || "#"} className="text-blue-600 hover:underline" target="_blank" rel="noreferrer">
                      {profile.company_website || "Not specified"}
                    </a>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-500 mb-1">Address</label>
                  {isEditing ? (
                    <input type="text" className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none" value={editForm.company_address} onChange={e => setEditForm({...editForm, company_address: e.target.value})} />
                  ) : (
                    <p className="text-neutral-900">{profile.company_address || "Not specified"}</p>
                  )}
                </div>
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
            <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider mb-4 px-2">Verification Status</h2>
            <div className="px-2 mb-2">
              <span className={`px-3 py-1 rounded-full text-sm font-bold border ${
                profile.is_verified ? 'bg-green-100 text-green-700 border-green-200' : 'bg-amber-100 text-amber-700 border-amber-200'
              }`}>
                {profile.is_verified ? 'Verified' : 'Pending Verification'}
              </span>
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
"""

with open(filepath, "w", encoding="utf-8") as f:
    f.write(new_content)

print("Created Company Profile.tsx")

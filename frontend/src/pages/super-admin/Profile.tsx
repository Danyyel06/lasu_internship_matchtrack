import { useState, useEffect } from 'react';
import axios from 'axios';

export default function SuperAdminProfile() {
  const [activeTab, setActiveTab] = useState('personal');
  const [profile, setProfile] = useState({ firstName: '', lastName: '', email: '' });
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(localStorage.getItem('sa_profile_photo') || null);
  
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const res = await axios.get('/api/v1/admin/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProfile({
          firstName: res.data.first_name || '',
          lastName: res.data.last_name || '',
          email: res.data.email || ''
        });
      } catch (error) {
        console.error("Failed to fetch profile", error);
      }
    };
    fetchProfile();
  }, []);

  const handleUpdateProfile = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('access_token');
      await axios.patch('/api/v1/admin/me', 
        { first_name: profile.firstName, last_name: profile.lastName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Profile updated successfully');
    } catch (error) {
      console.error("Failed to update profile", error);
      alert('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwords.new !== passwords.confirm) {
      alert("New passwords do not match");
      return;
    }
    setIsSaving(true);
    try {
      const token = localStorage.getItem('access_token');
      await axios.post('/api/v1/admin/change-password', 
        { current_password: passwords.current, new_password: passwords.new },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Password updated successfully');
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (error: any) {
      console.error("Failed to change password", error);
      alert(error.response?.data?.detail || 'Failed to change password');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPhotoDataUrl(result);
        localStorage.setItem('sa_profile_photo', result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Administrator Profile</h1>
        <p className="text-neutral-500 text-sm mt-1">Manage your personal account settings and security.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        
        <div className="w-full md:w-64 shrink-0">
          <nav className="space-y-1">
            {[
              { id: 'personal', label: 'Personal Information', icon: '👤' },
              { id: 'security', label: 'Security & Password', icon: '🔒' },
              { id: 'preferences', label: 'Notification Preferences', icon: '🔔' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-colors text-left ${
                  activeTab === tab.id 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-1 bg-white rounded-xl shadow-sm border border-neutral-200 p-6 min-h-[400px]">
          {activeTab === 'personal' && (
            <div className="space-y-6 animate-in fade-in">
              <h2 className="text-lg font-bold text-neutral-900 mb-4">Personal Information</h2>
              <div className="flex items-center gap-6 mb-6">
                <div className="w-20 h-20 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-2xl font-bold overflow-hidden relative">
                  {photoDataUrl ? (
                    <img src={photoDataUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    "SA"
                  )}
                </div>
                <div>
                  <input type="file" id="photo-upload" className="sr-only" accept="image/*" onChange={handlePhotoUpload} />
                  <label htmlFor="photo-upload" className="cursor-pointer px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-50 inline-block">
                    Upload Photo
                  </label>
                  <p className="text-xs text-neutral-500 mt-2">JPG or PNG. Max size 2MB.</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">First Name</label>
                  <input type="text" value={profile.firstName} onChange={(e) => setProfile({...profile, firstName: e.target.value})} className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Last Name</label>
                  <input type="text" value={profile.lastName} onChange={(e) => setProfile({...profile, lastName: e.target.value})} className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Official Email</label>
                  <input type="email" value={profile.email} disabled className="w-full px-4 py-2 border border-neutral-200 bg-neutral-50 text-neutral-500 rounded-lg outline-none" />
                  <p className="text-xs text-neutral-500 mt-1">Email cannot be changed directly. Contact IT support for reassignment.</p>
                </div>
              </div>
              <div className="pt-6 border-t border-neutral-200 flex justify-end">
                <button onClick={handleUpdateProfile} disabled={isSaving} className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">Save Changes</button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6 animate-in fade-in">
              <h2 className="text-lg font-bold text-neutral-900 mb-4">Security Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Current Password</label>
                  <input type="password" value={passwords.current} onChange={(e) => setPasswords({...passwords, current: e.target.value})} placeholder="••••••••" className="w-full max-w-md px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">New Password</label>
                  <input type="password" value={passwords.new} onChange={(e) => setPasswords({...passwords, new: e.target.value})} placeholder="••••••••" className="w-full max-w-md px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Confirm New Password</label>
                  <input type="password" value={passwords.confirm} onChange={(e) => setPasswords({...passwords, confirm: e.target.value})} placeholder="••••••••" className="w-full max-w-md px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none" />
                </div>
              </div>
              <div className="pt-6 border-t border-neutral-200 flex justify-end">
                <button onClick={handleChangePassword} disabled={isSaving || !passwords.current || !passwords.new || !passwords.confirm} className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">Update Password</button>
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="space-y-6 animate-in fade-in">
              <h2 className="text-lg font-bold text-neutral-900 mb-4">Notification Preferences</h2>
              <div className="space-y-4">
                {[
                  { title: "New Account Registrations", desc: "Get notified when a new Company or HOD registers." },
                  { title: "Weekly System Summary", desc: "Receive a weekly email summarizing platform activity." },
                  { title: "Critical Error Alerts", desc: "Immediate notification for any 500-level server errors." }
                ].map((pref, i) => (
                  <label key={i} className="flex items-center justify-between p-4 bg-neutral-50 border border-neutral-200 rounded-lg cursor-pointer hover:bg-neutral-100">
                    <div>
                      <p className="font-bold text-neutral-900">{pref.title}</p>
                      <p className="text-sm text-neutral-500">{pref.desc}</p>
                    </div>
                    <div className="relative">
                      <input type="checkbox" className="sr-only" defaultChecked />
                      <div className="block w-14 h-8 rounded-full bg-blue-600 transition-colors"></div>
                      <div className="absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform translate-x-6"></div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

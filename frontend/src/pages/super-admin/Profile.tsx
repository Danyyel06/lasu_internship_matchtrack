import { useState } from 'react';

export default function SuperAdminProfile() {
  const [activeTab, setActiveTab] = useState('personal');

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
                <div className="w-20 h-20 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-2xl font-bold">
                  SA
                </div>
                <button className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-50">
                  Upload Photo
                </button>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">First Name</label>
                  <input type="text" defaultValue="Super" className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Last Name</label>
                  <input type="text" defaultValue="Admin" className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Official Email</label>
                  <input type="email" defaultValue="admin@lasu.edu.ng" disabled className="w-full px-4 py-2 border border-neutral-200 bg-neutral-50 text-neutral-500 rounded-lg outline-none" />
                  <p className="text-xs text-neutral-500 mt-1">Email cannot be changed directly. Contact IT support for reassignment.</p>
                </div>
              </div>
              <div className="pt-6 border-t border-neutral-200 flex justify-end">
                <button className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700">Save Changes</button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6 animate-in fade-in">
              <h2 className="text-lg font-bold text-neutral-900 mb-4">Security Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Current Password</label>
                  <input type="password" placeholder="••••••••" className="w-full max-w-md px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">New Password</label>
                  <input type="password" placeholder="••••••••" className="w-full max-w-md px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Confirm New Password</label>
                  <input type="password" placeholder="••••••••" className="w-full max-w-md px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none" />
                </div>
              </div>
              <div className="pt-6 border-t border-neutral-200 flex justify-end">
                <button className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700">Update Password</button>
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

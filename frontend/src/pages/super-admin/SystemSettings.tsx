import { useState } from 'react';
import axios from 'axios';

export default function SuperAdminSystemSettings() {
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Settings state
  const [settings, setSettings] = useState({
    cycleStartDate: '2026-08-01',
    cycleEndDate: '2026-12-15',
    maxInternsPerSupervisor: 10,
    missedPulseAlertThreshold: 2,
    enableNotifications: true,
    requireHodApproval: true
  });

  // Department Objectives State
  const [selectedDept, setSelectedDept] = useState('Computer Science');
  const [deptObjectives, setDeptObjectives] = useState([
    "Apply theoretical computing knowledge to real-world software engineering.",
    "Develop proficiency in modern version control and CI/CD pipelines.",
    "Understand professional ethics and workplace communication.",
    "Demonstrate ability to work in agile development teams."
  ]);
  const [newObjective, setNewObjective] = useState('');

  const handleSaveSettings = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const token = localStorage.getItem('access_token');
      await axios.patch('http://localhost:8000/api/v1/admin/system-settings', 
        {
          cycle_start_date: settings.cycleStartDate,
          cycle_end_date: settings.cycleEndDate,
          supervisor_capacity: settings.maxInternsPerSupervisor,
          alert_threshold: settings.missedPulseAlertThreshold,
          feature_toggles: {
            enableNotifications: settings.enableNotifications,
            requireHodApproval: settings.requireHodApproval
          }
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to save", error);
    } finally {
      setIsSaving(false);
    }
  };

  const addObjective = () => {
    if (!newObjective.trim()) return;
    setDeptObjectives([...deptObjectives, newObjective.trim()]);
    setNewObjective('');
  };

  const removeObjective = (index: number) => {
    setDeptObjectives(deptObjectives.filter((_, i) => i !== index));
  };

  const handleSaveObjectives = async () => {
    try {
      const token = localStorage.getItem('access_token');
      await axios.patch(`http://localhost:8000/api/v1/admin/department-objectives/${selectedDept}`, 
        {
          department_name: selectedDept,
          objectives: deptObjectives
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Objectives saved successfully');
    } catch (error) {
      console.error("Failed to save objectives", error);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">System Settings</h1>
        <p className="text-neutral-500 text-sm mt-1">Global platform configuration and academic defaults.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Settings Navigation */}
        <div className="w-full md:w-64 shrink-0">
          <nav className="space-y-1">
            {[
              { id: 'general', label: 'General Parameters', icon: '⚙️' },
              { id: 'cycle', label: 'Internship Cycle Dates', icon: '📅' },
              { id: 'objectives', label: 'Department Objectives', icon: '🎯' },
              { id: 'features', label: 'Feature Toggles', icon: '🎛️' },
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

        {/* Settings Content */}
        <div className="flex-1">
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 min-h-[500px]">
            
            {saveSuccess && (
              <div className="mb-6 bg-green-50 text-green-700 p-4 rounded-xl border border-green-200 font-medium animate-in fade-in slide-in-from-top-4">
                Settings saved successfully.
              </div>
            )}

            {activeTab === 'general' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div>
                  <h2 className="text-lg font-bold text-neutral-900 mb-4">Thresholds & Capacities</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Max Interns per Supervisor</label>
                      <input 
                        type="number" min="1" max="50"
                        value={settings.maxInternsPerSupervisor}
                        onChange={(e) => setSettings({...settings, maxInternsPerSupervisor: parseInt(e.target.value)})}
                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                      />
                      <p className="text-xs text-neutral-500 mt-1">Maximum students an Industry Supervisor can manage.</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Missed Pulse Alert Threshold</label>
                      <input 
                        type="number" min="1" max="5"
                        value={settings.missedPulseAlertThreshold}
                        onChange={(e) => setSettings({...settings, missedPulseAlertThreshold: parseInt(e.target.value)})}
                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                      />
                      <p className="text-xs text-neutral-500 mt-1">Consecutive missed pulses before triggering Academic Supervisor alert.</p>
                    </div>
                  </div>
                </div>
                
                <div className="pt-6 border-t border-neutral-200 flex justify-end">
                  <button onClick={handleSaveSettings} disabled={isSaving} className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'cycle' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div>
                  <h2 className="text-lg font-bold text-neutral-900 mb-4">Active Cycle Dates</h2>
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg mb-6">
                    <p className="text-sm text-amber-800 font-medium">Warning: Modifying active cycle dates while placements are ongoing may affect logbook synchronisation.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Cycle Start Date</label>
                      <input 
                        type="date"
                        value={settings.cycleStartDate}
                        onChange={(e) => setSettings({...settings, cycleStartDate: e.target.value})}
                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Cycle End Date</label>
                      <input 
                        type="date"
                        value={settings.cycleEndDate}
                        onChange={(e) => setSettings({...settings, cycleEndDate: e.target.value})}
                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="pt-6 border-t border-neutral-200 flex justify-end">
                  <button onClick={handleSaveSettings} disabled={isSaving} className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'objectives' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-bold text-neutral-900">Department Learning Objectives</h2>
                  <select 
                    className="border border-neutral-300 rounded-lg px-4 py-2 text-sm text-neutral-700 focus:ring-2 focus:ring-blue-600 outline-none"
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                  >
                    <option>Computer Science</option>
                    <option>Mechanical Engineering</option>
                    <option>Business Administration</option>
                  </select>
                </div>

                <div className="bg-neutral-50 p-6 rounded-xl border border-neutral-200 space-y-4">
                  <p className="text-sm text-neutral-600 mb-4">
                    These objectives are automatically injected into the Unified Assessment Framework for every student placed from this department.
                  </p>
                  
                  {deptObjectives.map((obj, i) => (
                    <div key={i} className="flex items-start gap-3 bg-white p-4 rounded-lg border border-neutral-200 shadow-sm">
                      <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">{i+1}</span>
                      <p className="flex-1 text-sm text-neutral-800">{obj}</p>
                      <button onClick={() => removeObjective(i)} className="text-red-500 hover:text-red-700 font-bold px-2 py-1">×</button>
                    </div>
                  ))}

                  <div className="mt-4 flex gap-3">
                    <textarea 
                      value={newObjective}
                      onChange={(e) => setNewObjective(e.target.value)}
                      placeholder="Add a new university objective..."
                      className="flex-1 px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none text-sm resize-none h-20"
                    />
                    <button 
                      onClick={addObjective}
                      disabled={!newObjective.trim()}
                      className="px-6 py-2 bg-neutral-800 text-white font-medium rounded-lg hover:bg-neutral-900 transition-colors disabled:opacity-50"
                    >
                      Add
                    </button>
                  </div>
                </div>

                <div className="pt-6 border-t border-neutral-200 flex justify-end">
                  <button onClick={handleSaveObjectives} className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
                    Save Objectives for {selectedDept}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'features' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <h2 className="text-lg font-bold text-neutral-900 mb-4">Feature Toggles</h2>
                
                <div className="space-y-4">
                  <label className="flex items-center justify-between p-4 bg-neutral-50 border border-neutral-200 rounded-lg cursor-pointer hover:bg-neutral-100 transition-colors">
                    <div>
                      <p className="font-bold text-neutral-900">Email Notifications</p>
                      <p className="text-sm text-neutral-500">Send automated emails for application updates and pulse alerts.</p>
                    </div>
                    <div className="relative">
                      <input type="checkbox" className="sr-only" checked={settings.enableNotifications} onChange={() => setSettings({...settings, enableNotifications: !settings.enableNotifications})} />
                      <div className={`block w-14 h-8 rounded-full transition-colors ${settings.enableNotifications ? 'bg-blue-600' : 'bg-neutral-300'}`}></div>
                      <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${settings.enableNotifications ? 'translate-x-6' : ''}`}></div>
                    </div>
                  </label>

                  <label className="flex items-center justify-between p-4 bg-neutral-50 border border-neutral-200 rounded-lg cursor-pointer hover:bg-neutral-100 transition-colors">
                    <div>
                      <p className="font-bold text-neutral-900">Require HOD Approval</p>
                      <p className="text-sm text-neutral-500">Force HOD to manually approve academic supervisors before they can access the system.</p>
                    </div>
                    <div className="relative">
                      <input type="checkbox" className="sr-only" checked={settings.requireHodApproval} onChange={() => setSettings({...settings, requireHodApproval: !settings.requireHodApproval})} />
                      <div className={`block w-14 h-8 rounded-full transition-colors ${settings.requireHodApproval ? 'bg-blue-600' : 'bg-neutral-300'}`}></div>
                      <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${settings.requireHodApproval ? 'translate-x-6' : ''}`}></div>
                    </div>
                  </label>
                </div>

                <div className="pt-6 border-t border-neutral-200 flex justify-end">
                  <button onClick={handleSaveSettings} disabled={isSaving} className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
                    Save Changes
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}

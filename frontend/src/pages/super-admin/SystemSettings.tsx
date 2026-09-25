import { useState, useEffect } from 'react';
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
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const res = await axios.get('/api/v1/admin/system-settings', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const data = res.data.reduce((acc: any, curr: any) => {
          acc[curr.key] = curr.value;
          return acc;
        }, {});

        setSettings({
          cycleStartDate: data.cycle_start_date || '2026-08-01',
          cycleEndDate: data.cycle_end_date || '2026-12-15',
          maxInternsPerSupervisor: data.supervisor_capacity ? parseInt(data.supervisor_capacity) : 10,
          missedPulseAlertThreshold: data.alert_threshold ? parseInt(data.alert_threshold) : 2,
        });
      } catch (error) {
        console.error("Failed to fetch settings", error);
      }
    };
    fetchSettings();
  }, []);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const token = localStorage.getItem('access_token');
      await axios.patch('/api/v1/admin/system-settings', 
        [
          { key: 'cycle_start_date', value: settings.cycleStartDate, description: 'Cycle Start Date' },
          { key: 'cycle_end_date', value: settings.cycleEndDate, description: 'Cycle End Date' },
          { key: 'supervisor_capacity', value: settings.maxInternsPerSupervisor.toString(), description: 'Max Interns per Supervisor' },
          { key: 'alert_threshold', value: settings.missedPulseAlertThreshold.toString(), description: 'Missed Pulse Alert Threshold' }
        ],
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
              { id: 'cycle', label: 'Internship Cycle Dates', icon: '📅' }
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



          </div>
        </div>

      </div>
    </div>
  );
}

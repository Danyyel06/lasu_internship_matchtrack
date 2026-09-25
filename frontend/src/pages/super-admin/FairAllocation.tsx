import { useState, useEffect } from 'react';
import axios from 'axios';

export default function SuperAdminFairAllocation() {
  const [minQuota, setMinQuota] = useState(15);
  const [maxQuota, setMaxQuota] = useState(25);
  const [weights, setWeights] = useState({
    previousCompliance: 40,
    companySize: 30,
    historicalRetention: 30
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const totalWeight = weights.previousCompliance + weights.companySize + weights.historicalRetention;

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const res = await axios.get('/api/v1/admin/system-settings', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const settings = res.data.reduce((acc: any, curr: any) => {
          acc[curr.key] = curr.value;
          return acc;
        }, {});

        if (settings.min_equity_quota) setMinQuota(Number(settings.min_equity_quota));
        if (settings.max_equity_quota) setMaxQuota(Number(settings.max_equity_quota));
        
        if (settings.fair_participation_weights) {
          const w = JSON.parse(settings.fair_participation_weights);
          setWeights({
            previousCompliance: w.previousCompliance || 40,
            companySize: w.companySize || 30,
            historicalRetention: w.historicalRetention || 30
          });
        }
      } catch (error) {
        console.error("Failed to fetch fair allocation settings", error);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    if (totalWeight !== 100) return;
    setIsSaving(true);
    setSaveSuccess(false);
    
    try {
      const token = localStorage.getItem('access_token');
      await axios.patch('/api/v1/admin/system-settings', 
        [
          { key: 'min_equity_quota', value: minQuota.toString(), description: 'Minimum Equity Quota' },
          { key: 'max_equity_quota', value: maxQuota.toString(), description: 'Maximum Equity Quota' },
          { key: 'fair_participation_weights', value: JSON.stringify(weights), description: 'Fair Participation Weights' }
        ],
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to save settings", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Fair Allocation Engine</h1>
        <p className="text-neutral-500 text-sm mt-1">Configure the global parameters for the Equity Track quota system.</p>
      </div>

      {saveSuccess && (
        <div className="bg-green-50 text-green-700 p-4 rounded-xl border border-green-200 font-medium animate-in fade-in slide-in-from-top-4">
          Fair Allocation settings updated successfully.
        </div>
      )}

      <div className="bg-blue-50 p-5 rounded-xl border border-blue-200 mb-6 flex gap-4 text-blue-900">
        <span className="text-2xl">💡</span>
        <div>
          <h3 className="font-bold mb-1">How Dual-Track Fair Allocation Works</h3>
          <p className="text-sm opacity-90 leading-relaxed">
            Every internship posting is assigned to either the <strong>Competitive Track</strong> (strict skill filters) or the <strong>Equity and Developmental Track</strong>. 
            Companies must satisfy a minimum cycle-level equity quota for the Equity Track, based on their Fair Participation Score. 
            When presenting students for the Equity Track, the system strictly enforces <strong>forced T1 → T2 → T3 interleaving</strong>, ensuring strong and developing students are seen equally.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quota Range */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xl">📊</div>
            <div>
              <h2 className="text-lg font-bold text-neutral-900">Cycle Quota Range</h2>
              <p className="text-xs text-neutral-500">Global minimum and maximum limits</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <label className="font-medium text-neutral-700 text-sm">Minimum Equity Quota</label>
                <span className="font-bold text-blue-600">{minQuota}%</span>
              </div>
              <input 
                type="range" min="0" max="50" step="1"
                value={minQuota}
                onChange={(e) => setMinQuota(Math.min(parseInt(e.target.value), maxQuota - 1))}
                className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <p className="text-xs text-neutral-500 mt-2">The absolute minimum percentage of slots a company must offer to the Equity Track.</p>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="font-medium text-neutral-700 text-sm">Maximum Equity Quota</label>
                <span className="font-bold text-blue-600">{maxQuota}%</span>
              </div>
              <input 
                type="range" min="0" max="50" step="1"
                value={maxQuota}
                onChange={(e) => setMaxQuota(Math.max(parseInt(e.target.value), minQuota + 1))}
                className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <p className="text-xs text-neutral-500 mt-2">The highest quota ceiling for companies with poor Fair Participation Scores.</p>
            </div>
          </div>
        </div>

        {/* Dynamic Formula Weights */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center text-xl">🧮</div>
            <div>
              <h2 className="text-lg font-bold text-neutral-900">Dynamic Calculation Weights</h2>
              <p className="text-xs text-neutral-500">How a company's specific quota is calculated</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className={`flex justify-between items-center p-3 rounded-lg border ${totalWeight === 100 ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
              <span className="font-bold text-sm">Total Weight:</span>
              <span className="font-bold">{totalWeight}%</span>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="font-medium text-neutral-700 text-sm">Previous Cycle Compliance</label>
                <span className="font-bold text-green-600">{weights.previousCompliance}%</span>
              </div>
              <input 
                type="range" min="0" max="100" step="5"
                value={weights.previousCompliance}
                onChange={(e) => setWeights({...weights, previousCompliance: parseInt(e.target.value)})}
                className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-green-600"
              />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="font-medium text-neutral-700 text-sm">Company Size (Total Slots)</label>
                <span className="font-bold text-green-600">{weights.companySize}%</span>
              </div>
              <input 
                type="range" min="0" max="100" step="5"
                value={weights.companySize}
                onChange={(e) => setWeights({...weights, companySize: parseInt(e.target.value)})}
                className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-green-600"
              />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="font-medium text-neutral-700 text-sm">Historical Retention Rate</label>
                <span className="font-bold text-green-600">{weights.historicalRetention}%</span>
              </div>
              <input 
                type="range" min="0" max="100" step="5"
                value={weights.historicalRetention}
                onChange={(e) => setWeights({...weights, historicalRetention: parseInt(e.target.value)})}
                className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-green-600"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-6 border-t border-neutral-200 mt-8">
        <button 
          onClick={handleSave}
          disabled={totalWeight !== 100 || isSaving}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSaving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>
    </div>
  );
}

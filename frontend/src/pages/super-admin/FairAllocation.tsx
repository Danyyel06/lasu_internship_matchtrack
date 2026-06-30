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
    // In a real app we fetch this from API
  }, []);

  const handleSave = async () => {
    if (totalWeight !== 100) return;
    setIsSaving(true);
    setSaveSuccess(false);
    
    try {
      const token = localStorage.getItem('access_token');
      await axios.patch('http://localhost:8000/api/v1/admin/fair-allocation-settings', 
        {
          min_equity_quota: minQuota,
          max_equity_quota: maxQuota,
          fair_participation_weights: weights
        },
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
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Fair Allocation Engine</h1>
        <p className="text-neutral-500 text-sm mt-1">Configure the global parameters for the Equity Track quota system.</p>
      </div>

      {saveSuccess && (
        <div className="bg-green-50 text-green-700 p-4 rounded-xl border border-green-200 font-medium animate-in fade-in slide-in-from-top-4">
          Fair Allocation settings updated successfully.
        </div>
      )}

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
                onChange={(e) => setMinQuota(parseInt(e.target.value))}
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
                onChange={(e) => setMaxQuota(parseInt(e.target.value))}
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

import { useState, useEffect } from 'react';
import axios from 'axios';

export default function SuperAdminJobFamilies() {
  const [jobFamilies, setJobFamilies] = useState<any[]>([]);
  const [editingFamily, setEditingFamily] = useState<any | null>(null);
  
  // Create New state
  const [isCreating, setIsCreating] = useState(false);
  const [newFamilyData, setNewFamilyData] = useState({ name: '', description: '' });

  // Weights state when editing
  const [weights, setWeights] = useState({ cgpa: 25, skills: 35, coursework: 20, projects: 20 });
  const [subRoles, setSubRoles] = useState<{id: number, name: string}[]>([]);
  const [newSubRole, setNewSubRole] = useState('');

  const fetchJobFamilies = async () => {
    try {
      const res = await axios.get('/api/v1/job-families');
      // Ensure default_weights is parsed and sub_roles is an array of strings
      const data = res.data.map((jf: any) => ({
        ...jf,
        default_weights: typeof jf.default_weights === 'string' ? JSON.parse(jf.default_weights) : jf.default_weights,
        sub_roles: jf.sub_roles || []
      }));
      setJobFamilies(data);
    } catch (error) {
      console.error("Failed to fetch job families", error);
    }
  };

  useEffect(() => {
    fetchJobFamilies();
  }, []);

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

  const startEditing = (family: any) => {
    setEditingFamily(family);
    setWeights(family.default_weights);
    setSubRoles([...family.sub_roles]);
  };

  const handleSave = async () => {
    if (totalWeight !== 100) return;
    
    try {
      const token = localStorage.getItem('access_token');
      // Dummy API call
      await axios.patch(`/api/v1/admin/job-families/${editingFamily.id}`, 
        { default_weights: weights, sub_roles: subRoles },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Optimistic update
      setJobFamilies(jobFamilies.map(jf => 
        jf.id === editingFamily.id ? { ...jf, default_weights: weights, sub_roles: subRoles } : jf
      ));
      
      setEditingFamily(null);
    } catch (error) {
      console.error("Failed to save job family", error);
    }
  };

  const handleCreate = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.post(`/api/v1/admin/job-families`, 
        { 
          name: newFamilyData.name, 
          description: newFamilyData.description,
          default_weights: { cgpa: 25, skills: 35, coursework: 20, projects: 20 }
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setJobFamilies([...jobFamilies, {
        id: res.data.id,
        name: newFamilyData.name,
        description: newFamilyData.description,
        default_weights: { cgpa: 25, skills: 35, coursework: 20, projects: 20 },
        sub_roles: []
      }]);
      
      setIsCreating(false);
      setNewFamilyData({ name: '', description: '' });
    } catch (error) {
      console.error("Failed to create job family", error);
    }
  };

  const addSubRole = async (e: React.KeyboardEvent | React.MouseEvent) => {
    if ((e.type === 'keydown' && (e as React.KeyboardEvent).key !== 'Enter') || !newSubRole.trim()) return;
    if (!subRoles.find(r => r.name === newSubRole.trim())) {
      try {
        const token = localStorage.getItem('access_token');
        const res = await axios.post(`/api/v1/admin/job-families/${editingFamily.id}/sub-roles`,
          { name: newSubRole.trim() },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        // Assuming the backend returns the new sub-role with its ID
        setSubRoles([...subRoles, { id: res.data.id || Date.now(), name: newSubRole.trim() }]);
        fetchJobFamilies(); // Refresh to get real IDs if needed
      } catch (error) {
        console.error("Failed to add sub-role", error);
      }
    }
    setNewSubRole('');
  };

  const removeSubRole = async (roleId: number) => {
    try {
      const token = localStorage.getItem('access_token');
      await axios.delete(`/api/v1/admin/job-families/${editingFamily.id}/sub-roles/${roleId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubRoles(subRoles.filter(r => r.id !== roleId));
      fetchJobFamilies(); // Keep parent list in sync
    } catch (error) {
      console.error("Failed to remove sub-role", error);
    }
  };

  if (editingFamily) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={() => setEditingFamily(null)}
            className="w-10 h-10 rounded-full hover:bg-neutral-200 flex items-center justify-center text-neutral-600 transition-colors"
          >
            ←
          </button>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Edit {editingFamily.name}</h1>
            <p className="text-neutral-500 text-sm mt-1">{editingFamily.description}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 space-y-8">
          
          {/* Weights Section */}
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-neutral-900">Matching Weights</h2>
              <div className={`px-4 py-2 rounded-lg font-bold text-sm ${totalWeight === 100 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                Total: {totalWeight}%
                {totalWeight !== 100 && <span className="ml-2 text-xs font-normal opacity-80">(Must equal 100)</span>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { key: 'cgpa', label: 'CGPA & Academics' },
                { key: 'skills', label: 'Verified Skills' },
                { key: 'projects', label: 'Project Experience' },
                { key: 'coursework', label: 'Relevant Coursework' }
              ].map((item) => (
                <div key={item.key} className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                  <div className="flex justify-between mb-2">
                    <label className="font-medium text-neutral-700 text-sm">{item.label}</label>
                    <span className="font-bold text-blue-600">{weights[item.key as keyof typeof weights]}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" max="100" step="5"
                    value={weights[item.key as keyof typeof weights]}
                    onChange={(e) => setWeights({...weights, [item.key]: parseInt(e.target.value)})}
                    className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Sub-roles Section */}
          <section>
            <h2 className="text-lg font-bold text-neutral-900 mb-4">Sub-roles List</h2>
            <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
              <div className="flex flex-wrap gap-2 mb-4">
                {subRoles.map((role) => (
                  <div key={role.id} className="flex items-center gap-2 bg-white border border-neutral-300 px-3 py-1.5 rounded-full text-sm font-medium text-neutral-700 shadow-sm">
                    {role.name}
                    <button 
                      onClick={() => removeSubRole(role.id)}
                      className="text-neutral-400 hover:text-red-500 transition-colors"
                    >×</button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 max-w-sm">
                <input 
                  type="text" 
                  value={newSubRole}
                  onChange={(e) => setNewSubRole(e.target.value)}
                  onKeyDown={addSubRole}
                  placeholder="e.g. Data Scientist..."
                  className="flex-1 px-3 py-2 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-blue-600 outline-none text-sm"
                />
                <button 
                  onClick={addSubRole}
                  className="bg-neutral-200 hover:bg-neutral-300 text-neutral-700 font-medium px-4 py-2 rounded-lg transition-colors text-sm"
                >
                  Add
                </button>
              </div>
            </div>
          </section>

        </div>

        <div className="flex justify-end gap-4 mt-6">
          <button 
            onClick={() => setEditingFamily(null)}
            className="px-6 py-3 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 font-medium transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={totalWeight !== 100}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Changes
          </button>
        </div>

      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">Job Families</h1>
          <p className="text-neutral-500 text-xs sm:text-sm mt-1">Configure the core job families, their matching weights, and sub-roles.</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm self-start sm:self-auto"
        >
          + Create New Family
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {jobFamilies.map((family) => (
          <div key={family.id} className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden flex flex-col hover:border-blue-300 transition-colors">
            <div className="p-5 border-b border-neutral-100 flex justify-between items-start">
              <div>
                <h2 className="text-lg font-bold text-neutral-900">{family.name}</h2>
                <p className="text-sm text-neutral-500 mt-1 line-clamp-2">{family.description}</p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {family.sub_roles.slice(0, 3).map((role: string, idx: number) => (
                    <span key={idx} className="bg-neutral-100 text-neutral-600 text-xs px-2 py-1 rounded-md">{role}</span>
                  ))}
                  {family.sub_roles.length > 3 && (
                    <span className="bg-neutral-100 text-neutral-600 text-xs px-2 py-1 rounded-md">+{family.sub_roles.length - 3} more</span>
                  )}
                </div>
              </div>
              <button 
                onClick={() => startEditing(family)}
                className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors shrink-0"
              >
                Edit
              </button>
            </div>
            <div className="p-5 bg-neutral-50 flex-1">
              <div className="flex items-center justify-between text-xs font-medium text-neutral-500 mb-3 uppercase">
                <span>Matching Weights</span>
                <span>Sum: 100%</span>
              </div>
              <div className="flex h-3 rounded-full overflow-hidden bg-neutral-200">
                <div style={{ width: `${family.default_weights.skills}%` }} className="bg-blue-500" title={`Skills: ${family.default_weights.skills}%`}></div>
                <div style={{ width: `${family.default_weights.cgpa}%` }} className="bg-green-500" title={`CGPA: ${family.default_weights.cgpa}%`}></div>
                <div style={{ width: `${family.default_weights.projects}%` }} className="bg-purple-500" title={`Projects: ${family.default_weights.projects}%`}></div>
                <div style={{ width: `${family.default_weights.coursework}%` }} className="bg-amber-500" title={`Coursework: ${family.default_weights.coursework}%`}></div>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3 text-xs text-neutral-500">
                <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Skills</div>
                <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> CGPA</div>
                <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500"></span> Projects</div>
                <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Coursework</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isCreating && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setIsCreating(false)}>
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-neutral-900 mb-4">Create Job Family</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Name</label>
                <input 
                  type="text" 
                  value={newFamilyData.name}
                  onChange={(e) => setNewFamilyData({...newFamilyData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                  placeholder="e.g. Artificial Intelligence"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Description</label>
                <textarea 
                  value={newFamilyData.description}
                  onChange={(e) => setNewFamilyData({...newFamilyData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none min-h-[100px]"
                  placeholder="Brief description of the job family..."
                ></textarea>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button 
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 border border-neutral-300 rounded-lg text-sm font-medium hover:bg-neutral-50 text-neutral-700"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreate}
                disabled={!newFamilyData.name.trim() || !newFamilyData.description.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium text-white disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

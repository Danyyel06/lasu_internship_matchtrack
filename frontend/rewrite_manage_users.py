import os
import re

filepath = "c:/Users/User/lasu-internship-platform/frontend/src/pages/super-admin/ManageUsers.tsx"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# We need to add state for the form
# We will replace the Create User Modal with a specific form for HOD (or dynamic based on role, but right now we only need HOD)

new_state_vars = """
  const [createForm, setCreateForm] = useState({
    role: 'Head of Department',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    departmentName: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
"""

# Insert state vars after `const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);`
content = content.replace("const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);", "const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);\n" + new_state_vars)

handle_create_func = """
  const handleCreateUser = async () => {
    if (createForm.role !== 'Head of Department') {
      alert("Only HOD creation is currently supported from this dashboard.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('access_token');
      await axios.post('http://localhost:8000/api/v1/admin/hods', {
        first_name: createForm.firstName,
        last_name: createForm.lastName,
        email: createForm.email,
        password: createForm.password,
        department_name: createForm.departmentName
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Close modal and refresh users
      setIsCreateModalOpen(false);
      setCreateForm({ role: 'Head of Department', firstName: '', lastName: '', email: '', password: '', departmentName: '' });
      
      // Refresh list
      const res = await axios.get('http://localhost:8000/api/v1/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data);
      
    } catch (error: any) {
      console.error("Failed to create user", error);
      alert(error.response?.data?.detail || "Failed to create user");
    } finally {
      setIsSubmitting(false);
    }
  };
"""

content = content.replace("const filteredUsers =", handle_create_func + "\n  const filteredUsers =")

# Rewrite the modal HTML
new_modal = """
      {/* Create User Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-neutral-900 mb-4">Create New Account</h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Role</label>
                <select 
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
                  value={createForm.role}
                  onChange={(e) => setCreateForm({...createForm, role: e.target.value})}
                >
                  <option value="Head of Department">Head of Department</option>
                  <option value="Academic Supervisor" disabled>Academic Supervisor (Create via HOD)</option>
                  <option value="Industry Supervisor" disabled>Industry Supervisor (Create via Company)</option>
                </select>
              </div>
              
              {createForm.role === 'Head of Department' && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Department Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Computer Science"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600" 
                    value={createForm.departmentName}
                    onChange={(e) => setCreateForm({...createForm, departmentName: e.target.value})}
                  />
                </div>
              )}

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-neutral-700 mb-1">First Name</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600" 
                    value={createForm.firstName}
                    onChange={(e) => setCreateForm({...createForm, firstName: e.target.value})}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Last Name</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600" 
                    value={createForm.lastName}
                    onChange={(e) => setCreateForm({...createForm, lastName: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
                <input 
                  type="email" 
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600" 
                  value={createForm.email}
                  onChange={(e) => setCreateForm({...createForm, email: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Temporary Password</label>
                <input 
                  type="password" 
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600" 
                  value={createForm.password}
                  onChange={(e) => setCreateForm({...createForm, password: e.target.value})}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="flex-1 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateUser}
                disabled={isSubmitting || !createForm.firstName || !createForm.lastName || !createForm.email || !createForm.password || !createForm.departmentName}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
              >
                {isSubmitting ? 'Creating...' : 'Create Account'}
              </button>
            </div>
          </div>
        </div>
      )}
"""

# Replace the old modal block with regex
import re
content = re.sub(r'\{\/\* Create User Modal \*\/\}.*?\}\)', new_modal.strip(), content, flags=re.DOTALL)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Rewritten ManageUsers.tsx")

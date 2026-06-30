import re

filepath = r"C:\Users\User\lasu-internship-platform\frontend\src\pages\super-admin\ManageUsers.tsx"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

modal_html = """
      {/* Create User Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-neutral-900 mb-4">Create New User</h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Role</label>
                <select 
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                  value={createForm.role}
                  onChange={(e) => setCreateForm({...createForm, role: e.target.value})}
                >
                  <option value="Head of Department">Head of Department</option>
                  <option value="Student">Student (Not Supported Here)</option>
                  <option value="Academic Supervisor">Academic Supervisor (Not Supported Here)</option>
                  <option value="Company Rep">Company Rep (Not Supported Here)</option>
                </select>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-neutral-700 mb-1">First Name</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg" 
                    value={createForm.firstName}
                    onChange={(e) => setCreateForm({...createForm, firstName: e.target.value})}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Last Name</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg" 
                    value={createForm.lastName}
                    onChange={(e) => setCreateForm({...createForm, lastName: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
                <input 
                  type="email" 
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg" 
                  value={createForm.email}
                  onChange={(e) => setCreateForm({...createForm, email: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Password</label>
                <input 
                  type="password" 
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg" 
                  value={createForm.password}
                  onChange={(e) => setCreateForm({...createForm, password: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Department Name (For HOD only)</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg" 
                  value={createForm.departmentName}
                  onChange={(e) => setCreateForm({...createForm, departmentName: e.target.value})}
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
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
              >
                {isSubmitting ? 'Creating...' : 'Create Account'}
              </button>
            </div>
          </div>
        </div>
      )}
"""

new_content = re.sub(
    r"\{\/\* Create User Modal \*\/}.*?\}\s*</div>\s*\);\s*\}\s*$",
    modal_html + "    </div>\n  );\n}\n",
    content,
    flags=re.DOTALL
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Rewrote ManageUsers.tsx modal")

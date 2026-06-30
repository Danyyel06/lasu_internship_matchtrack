import { useState, useEffect } from 'react';
import axios from 'axios';

export default function SuperAdminManageUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [createForm, setCreateForm] = useState({
    role: 'Head of Department',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    departmentName: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const res = await axios.get('http://localhost:8000/api/v1/admin/users', {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log("FETCH USERS RESPONSE:", res.data);
        setUsers(res.data);
      } catch (error: any) {
        console.error("Failed to fetch users", error);
      }
    };
    fetchUsers();
  }, []);

  const handleSuspend = async (user: any) => {
    try {
      const token = localStorage.getItem('access_token');
      // Dummy endpoint hit, logic handled in backend
      await axios.patch(`http://localhost:8000/api/v1/admin/users/${user.id}`, 
        { action: user.is_verified ? 'suspend' : 'reactivate' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Optimistically update
      setUsers(users.map(u => u.id === user.id ? { ...u, is_verified: !u.is_verified } : u));
    } catch (error) {
      console.error("Failed to toggle suspension", error);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    try {
      // In a real scenario you'd hit a DELETE endpoint
      setUsers(users.filter(u => u.id !== userToDelete.id));
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
      setDeleteConfirmText('');
    } catch (error) {
      console.error("Failed to delete", error);
    }
  };

  
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

  const filteredUsers = users.filter(u => {
    const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim();
    const matchesSearch = u.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          fullName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'All Roles' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Manage Users</h1>
          <p className="text-neutral-500 text-sm mt-1">Directory of all registered accounts.</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
        >
          <span className="text-lg leading-none">+</span>
          Create New User
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-neutral-200 flex gap-4 bg-neutral-50">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">🔍</span>
            <input 
              type="text"
              placeholder="Search by name or email..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="border border-neutral-300 rounded-lg px-4 py-2 text-sm text-neutral-700 focus:ring-2 focus:ring-blue-600 outline-none"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option>All Roles</option>
            <option value="student">Student</option>
            <option value="company_rep">Company Rep</option>
            <option value="industry_supervisor">Industry Supervisor</option>
            <option value="head_of_department">Head of Department</option>
            <option value="academic_supervisor">Academic Supervisor</option>
          </select>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-sm text-neutral-600">
            <thead className="text-xs text-neutral-500 uppercase bg-white border-b border-neutral-200 sticky top-0">
              <tr>
                <th className="px-6 py-4 font-medium">User</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Joined</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-600 font-bold uppercase">
                        {user.first_name?.[0]}{user.last_name?.[0]}
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900">{user.first_name} {user.last_name}</p>
                        <p className="text-xs text-neutral-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="capitalize">{user.role.replace(/_/g, ' ')}</span>
                  </td>
                  <td className="px-6 py-4">
                    {user.is_verified ? (
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">Active</span>
                    ) : (
                      <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold">Suspended</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-neutral-500">
                    {new Date(user.created_at || Date.now()).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button 
                        onClick={() => handleSuspend(user)}
                        className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors ${
                          user.is_verified ? 'text-amber-700 bg-amber-50 hover:bg-amber-100' : 'text-green-700 bg-green-50 hover:bg-green-100'
                        }`}
                      >
                        {user.is_verified ? 'Suspend' : 'Reactivate'}
                      </button>
                      <button 
                        onClick={() => { setUserToDelete(user); setIsDeleteModalOpen(true); }}
                        className="text-xs font-medium text-red-600 bg-white border border-red-200 px-3 py-1.5 rounded-md hover:bg-red-50 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredUsers.length === 0 && (
            <div className="p-8 text-center text-neutral-500">
              No users found matching your search.
            </div>
          )}
        </div>
      </div>

      {/* Delete Modal (Two-step confirmation) */}
      {isDeleteModalOpen && userToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-red-600 mb-2">Delete User Account</h3>
            <p className="text-neutral-600 text-sm mb-4">
              You are about to permanently delete <strong className="text-neutral-900">{userToDelete.email}</strong>. 
              This action cannot be undone and will cascade to all associated records.
            </p>
            <div className="mb-6 bg-red-50 border border-red-100 p-4 rounded-lg">
              <label className="block text-sm font-medium text-red-800 mb-2">
                Type <strong>DELETE</strong> to confirm
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 rounded-md border border-red-300 focus:ring-2 focus:ring-red-500 outline-none"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => { setIsDeleteModalOpen(false); setDeleteConfirmText(''); setUserToDelete(null); }}
                className="flex-1 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete}
                disabled={deleteConfirmText !== 'DELETE'}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      
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
    </div>
  );
}

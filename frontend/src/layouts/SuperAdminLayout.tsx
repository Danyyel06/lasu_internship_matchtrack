import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';

export default function SuperAdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    { name: 'Dashboard', href: '/super-admin/dashboard', icon: '📊' },
    { name: 'Verify Accounts', href: '/super-admin/verify', icon: '✅' },
    { name: 'Manage Users', href: '/super-admin/users', icon: '👥' },
    { name: 'Configure Job Families', href: '/super-admin/job-families', icon: '💼' },
    { name: 'Fair Allocation Settings', href: '/super-admin/fair-allocation', icon: '⚖️' },
    { name: 'Institutional Reports', href: '/super-admin/reports', icon: '📈' },
    { name: 'System Settings', href: '/super-admin/settings', icon: '⚙️' },
    { name: 'Notifications', href: '/super-admin/notifications', icon: '🔔' },
    { name: 'Profile', href: '/super-admin/profile', icon: '👤' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    navigate('/super-admin/login');
  };

  return (
    <div className="flex h-screen bg-neutral-50 overflow-hidden font-sans">
      {/* Permanent left sidebar */}
      <aside className="hidden md:flex md:w-64 flex-col bg-white border-r border-neutral-200 h-full">
        <div className="p-6 border-b border-neutral-200">
          <Link to="/super-admin/dashboard" className="text-xl font-bold text-neutral-900 tracking-tight flex items-center gap-2">
            <img src="/lasu-logo.png" alt="LASU Logo" className="w-8 h-8 object-contain" />
            <span>LASU<span className="text-blue-600">Admin</span></span>
          </Link>
          <div className="mt-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
              SA
            </div>
            <div>
              <p className="text-sm font-bold text-neutral-900">Super Admin</p>
              <p className="text-xs text-neutral-500">System Administrator</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {navigation.map((item) => {
              const isActive = location.pathname.startsWith(item.href);
              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-neutral-200">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 w-full transition-colors"
          >
            <span className="text-lg">🚪</span>
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b border-neutral-200 px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img src="/lasu-logo.png" alt="LASU Logo" className="w-6 h-6 object-contain" />
            <span className="font-bold text-neutral-900">LASU<span className="text-blue-600">Admin</span></span>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto bg-neutral-50">
          <Outlet />
        </div>

        {/* Mobile Bottom Navigation (4-tab bottom bar) */}
        <nav className="md:hidden bg-white border-t border-neutral-200">
          <ul className="flex justify-around items-center">
            {[
              { name: 'Dashboard', href: '/super-admin/dashboard', icon: '📊' },
              { name: 'Verify', href: '/super-admin/verify', icon: '✅' },
              { name: 'Users', href: '/super-admin/users', icon: '👥' },
              { name: 'Profile', href: '/super-admin/profile', icon: '👤' },
            ].map((item) => {
              const isActive = location.pathname.startsWith(item.href);
              return (
                <li key={item.name} className="flex-1">
                  <Link
                    to={item.href}
                    className={`flex flex-col items-center justify-center py-3 text-xs font-medium ${
                      isActive ? 'text-blue-600' : 'text-neutral-500'
                    }`}
                  >
                    <span className="text-xl mb-1">{item.icon}</span>
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </main>
    </div>
  );
}

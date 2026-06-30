import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';

export default function SupervisorLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    { name: 'Dashboard', href: '/supervisor/dashboard', icon: '🏠' },
    { name: 'Interns', href: '/supervisor/interns', icon: '👥' },
    { name: 'Monthly Review', href: '/supervisor/monthly-review', icon: '📅' },
    { name: 'Alerts', href: '/supervisor/alerts', icon: '🚨' },
    { name: 'Profile', href: '/supervisor/profile', icon: '👤' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-neutral-50 overflow-hidden font-sans">
      <aside className="hidden md:flex md:w-64 flex-col bg-white border-r border-neutral-200">
        <div className="p-6 border-b border-neutral-200">
          <Link to="/" className="text-xl font-bold text-neutral-900 tracking-tight flex items-center gap-2">
            <img src="/lasu-logo.png" alt="LASU Logo" className="w-8 h-8 object-contain" />
            <span>LASU<span className="text-blue-600">Supervisor</span></span>
          </Link>
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
          <ul className="space-y-1">
            <li>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-danger-dark hover:bg-danger-50 transition-colors"
              >
                <span className="text-lg">🚪</span>
                Log Out
              </button>
            </li>
          </ul>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto relative">
        <header className="md:hidden bg-white border-b border-neutral-200 p-4 flex items-center justify-between sticky top-0 z-20">
          <Link to="/" className="text-lg font-bold text-neutral-900 flex items-center gap-2">
            <img src="/lasu-logo.png" alt="LASU Logo" className="w-6 h-6 object-contain" />
            <span>LASU</span>
          </Link>
          <button className="p-2 text-neutral-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </header>

        <div className="p-4 md:p-8 max-w-7xl mx-auto pb-24 md:pb-8">
          <Outlet />
        </div>
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around p-2 z-30">
        {navigation.slice(0, 5).map(item => (
          <Link key={item.name} to={item.href} className={`flex flex-col items-center ${location.pathname.startsWith(item.href) ? 'text-blue-600' : 'text-neutral-500'}`}>
            <span className="text-xl">{item.icon}</span>
            <span className="text-[10px] mt-1">{item.name}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}

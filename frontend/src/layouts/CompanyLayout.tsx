import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';

export default function CompanyLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    { name: 'Dashboard', href: '/company/dashboard', icon: '📊' },
    { name: 'Post Internship', href: '/company/post-internship', icon: '➕' },
    { name: 'Manage Postings', href: '/company/postings', icon: '📋' },
    { name: 'Applications Received', href: '/company/applications', icon: '📥' },
    { name: 'My Interns', href: '/company/interns', icon: '👥' },
    { name: 'Manage Supervisors', href: '/company/supervisors', icon: '👔' },
    { name: 'Performance Reports', href: '/company/reports', icon: '📈' },
    { name: 'Company Profile', href: '/company/profile', icon: '🏢' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-neutral-50 overflow-hidden font-sans">
      {/* Sidebar - Hidden on mobile, block on md and up */}
      <aside className="hidden md:flex md:w-64 flex-col bg-white border-r border-neutral-200">
        <div className="p-6 border-b border-neutral-200">
          <Link to="/" className="text-xl font-bold text-neutral-900 tracking-tight flex items-center gap-2">
            <img src="/lasu-logo.png" alt="LASU Logo" className="w-8 h-8 object-contain" />
            <span>LASU<span className="text-green-600">Company</span></span>
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
                        ? 'bg-green-50 text-green-700'
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
              <Link
                to="/company/settings"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
              >
                <span className="text-lg">⚙️</span>
                Settings
              </Link>
            </li>
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

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b border-neutral-200 p-4 flex items-center justify-between sticky top-0 z-20">
          <Link to="/" className="text-lg font-bold text-neutral-900 flex items-center gap-2">
            <img src="/lasu-logo.png" alt="LASU Logo" className="w-6 h-6 object-contain" />
            <span>LASU</span>
          </Link>
          <button className="p-2 text-neutral-600">
            {/* Hamburger Icon */}
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </header>

        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation Placeholder - Usually 4 main items */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 pb-safe z-30">
        <div className="flex justify-around items-center h-16">
          <Link to="/company/dashboard" className={`flex flex-col items-center justify-center w-full h-full ${location.pathname.includes('/company/dashboard') ? 'text-green-600' : 'text-neutral-500'}`}>
            <span className="text-xl">📊</span>
            <span className="text-[10px] font-medium mt-1">Dashboard</span>
          </Link>
          <Link to="/company/post-internship" className={`flex flex-col items-center justify-center w-full h-full ${location.pathname.includes('/company/post') ? 'text-green-600' : 'text-neutral-500'}`}>
            <span className="text-xl">➕</span>
            <span className="text-[10px] font-medium mt-1">Post</span>
          </Link>
          <Link to="/company/applications" className={`flex flex-col items-center justify-center w-full h-full ${location.pathname.includes('/company/applications') ? 'text-green-600' : 'text-neutral-500'}`}>
            <span className="text-xl">📥</span>
            <span className="text-[10px] font-medium mt-1">Applicants</span>
          </Link>
          <button className="flex flex-col items-center justify-center w-full h-full text-neutral-500">
            <span className="text-xl">☰</span>
            <span className="text-[10px] font-medium mt-1">More</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import MobileDrawer from '../components/MobileDrawer';

export default function AcademicSupervisorLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/academic-supervisor/home', icon: '🏠' },
    { name: 'Log Wall', href: '/academic-supervisor/log-wall', icon: '🖼️' },
    { name: 'Alerts', href: '/academic-supervisor/alerts', icon: '🚨' },
    { name: 'Profile', href: '/academic-supervisor/profile', icon: '👤' },
  ];

  const handleSignOut = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-neutral-50 overflow-hidden font-sans">
      <aside className="hidden md:flex md:w-64 flex-col bg-white border-r border-neutral-200">
        <div className="p-6 border-b border-neutral-200">
          <Link to="/" className="text-xl font-bold flex items-center gap-2">
            <img src="/lasu-logo.png" alt="LASU Logo" className="w-8 h-8 object-contain" />
            <span>LASU<span className="text-blue-600">AcadSup</span></span>
          </Link>
        </div>
        <nav className="flex-1 py-4">
          <ul className="space-y-1 px-3">
            {navigation.map((item) => (
              <li key={item.name}>
                <Link to={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${location.pathname.startsWith(item.href) ? 'bg-blue-50 text-blue-700' : 'text-neutral-600 hover:bg-neutral-100'}`}>
                  <span>{item.icon}</span> {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        {/* Sign Out at bottom of sidebar */}
        <div className="p-4 border-t border-neutral-200">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors text-sm font-medium"
          >
            <span>🚪</span> Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b border-neutral-200 p-4 flex items-center justify-between sticky top-0 z-20">
          <Link to="/academic-supervisor/home" className="text-lg font-bold text-neutral-900 flex items-center gap-2">
            <img src="/lasu-logo.png" alt="LASU Logo" className="w-6 h-6 object-contain" />
            <span>LASU<span className="text-blue-600">AcadSup</span></span>
          </Link>
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
            aria-label="Open navigation menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </header>

        <div className="p-4 md:p-8 max-w-7xl mx-auto"><Outlet /></div>
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 pb-safe z-30 shadow-lg">
        <div className="flex justify-around items-center h-16">
          {navigation.map(item => (
            <Link
              key={item.name}
              to={item.href}
              className={`flex flex-col items-center justify-center w-full h-full ${location.pathname.startsWith(item.href) ? 'text-blue-600 font-bold' : 'text-neutral-500'}`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-[10px] font-medium mt-0.5">{item.name}</span>
            </Link>
          ))}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center w-full h-full text-neutral-500 hover:text-neutral-900 active:text-blue-600 transition-colors"
          >
            <span className="text-xl">☰</span>
            <span className="text-[10px] font-medium mt-0.5">More</span>
          </button>
        </div>
      </nav>

      {/* Mobile Slide-out Drawer */}
      <MobileDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        roleTitle="AcadSup"
        roleSubtitle="Academic Supervisor Portal"
        roleColorClass="text-blue-600"
        navigation={navigation}
        onLogout={handleSignOut}
      />
    </div>
  );
}

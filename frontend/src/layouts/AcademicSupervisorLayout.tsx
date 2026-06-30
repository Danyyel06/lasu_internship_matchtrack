import { Link, Outlet, useLocation } from 'react-router-dom';

export default function AcademicSupervisorLayout() {
  const location = useLocation();
  const navigation = [
    { name: 'Dashboard', href: '/academic-supervisor/home', icon: '🏠' },
    { name: 'Log Wall', href: '/academic-supervisor/log-wall', icon: '🖼️' },
    { name: 'Alerts', href: '/academic-supervisor/alerts', icon: '🚨' },
    { name: 'Profile', href: '/academic-supervisor/profile', icon: '👤' },
  ];

  return (
    <div className="flex h-screen bg-neutral-50 font-sans">
      <aside className="hidden md:flex md:w-64 flex-col bg-white border-r">
        <div className="p-6 border-b">
          <Link to="/" className="text-xl font-bold flex items-center gap-2">
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
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-8 max-w-7xl mx-auto"><Outlet /></div>
      </main>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around p-2">
        {navigation.map(item => (
          <Link key={item.name} to={item.href} className="flex flex-col items-center">
            <span>{item.icon}</span>
            <span className="text-[10px]">{item.name}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}

import os

def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content.strip() + '\n')

# 1. HOD Layout
write_file('frontend/src/layouts/HodLayout.tsx', """
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';

export default function HodLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    { name: 'Dashboard', href: '/hod/home', icon: '🏠' },
    { name: 'Students', href: '/hod/students', icon: '👥' },
    { name: 'Supervisors', href: '/hod/supervisors', icon: '👨‍🏫' },
    { name: 'Alerts', href: '/hod/alerts', icon: '⚠️' },
    { name: 'Reports', href: '/hod/reports', icon: '📊' },
    { name: 'Profile', href: '/hod/profile', icon: '👤' },
  ];

  return (
    <div className="flex h-screen bg-neutral-50 font-sans">
      <aside className="hidden md:flex md:w-64 flex-col bg-white border-r border-neutral-200">
        <div className="p-6 border-b border-neutral-200">
          <Link to="/" className="text-xl font-bold flex items-center gap-2">
            <span>LASU<span className="text-blue-600">HOD</span></span>
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
        {navigation.slice(0, 5).map(item => (
          <Link key={item.name} to={item.href} className="flex flex-col items-center">
            <span>{item.icon}</span>
            <span className="text-[10px]">{item.name}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
""")

# 2. Academic Supervisor Layout
write_file('frontend/src/layouts/AcademicSupervisorLayout.tsx', """
import { Link, Outlet, useLocation } from 'react-router-dom';

export default function AcademicSupervisorLayout() {
  const location = useLocation();
  const navigation = [
    { name: 'Dashboard', href: '/academic-supervisor/home', icon: '🏠' },
    { name: 'Pulse', href: '/academic-supervisor/pulse', icon: '📈' },
    { name: 'Frameworks', href: '/academic-supervisor/frameworks', icon: '📋' },
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
""")

# Placeholders for HOD
hod_pages = ['Registration', 'Dashboard', 'Students', 'Supervisors', 'Alerts', 'Reports', 'Profile']
for page in hod_pages:
    write_file(f'frontend/src/pages/hod/{page}.tsx', f"""
export default function {page}() {{
  return <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200">
    <h1 className="text-2xl font-bold mb-4">{page} - HOD Portal</h1>
    <p>This is the {page} page.</p>
  </div>;
}}
""")

# Placeholders for Academic Supervisor
acad_pages = ['AccountActivation', 'Dashboard', 'Pulse', 'Frameworks', 'Alerts', 'Profile']
for page in acad_pages:
    write_file(f'frontend/src/pages/academic-supervisor/{page}.tsx', f"""
export default function {page}() {{
  return <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200">
    <h1 className="text-2xl font-bold mb-4">{page} - Academic Supervisor</h1>
    <p>This is the {page} page.</p>
  </div>;
}}
""")

# Missing Company & Supervisor pages
write_file('frontend/src/pages/company/ManageSupervisors.tsx', """
export default function ManageSupervisors() {
  return <div className="bg-white p-6 rounded-xl shadow-sm">
    <h1 className="text-2xl font-bold mb-4">Manage Supervisors</h1>
  </div>;
}
""")

write_file('frontend/src/pages/supervisor/Interns.tsx', """
export default function Interns() {
  return <div className="bg-white p-6 rounded-xl shadow-sm">
    <h1 className="text-2xl font-bold mb-4">My Interns</h1>
  </div>;
}
""")

write_file('frontend/src/pages/supervisor/Frameworks.tsx', """
export default function Frameworks() {
  return <div className="bg-white p-6 rounded-xl shadow-sm">
    <h1 className="text-2xl font-bold mb-4">Assessment Frameworks</h1>
  </div>;
}
""")

print("Files generated.")

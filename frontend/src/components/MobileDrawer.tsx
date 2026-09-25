import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

export interface MobileNavItem {
  name: string;
  href: string;
  icon: string;
  badge?: boolean;
}

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  roleTitle: string;
  roleSubtitle?: string;
  roleColorClass?: string; // e.g., 'text-violet-600', 'text-green-600', 'text-blue-600'
  navigation: MobileNavItem[];
  onLogout: () => void;
}

export default function MobileDrawer({
  isOpen,
  onClose,
  roleTitle,
  roleSubtitle,
  roleColorClass = 'text-blue-600',
  navigation,
  onLogout,
}: MobileDrawerProps) {
  const location = useLocation();

  // Close drawer when Escape is pressed
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden flex justify-end">
      {/* Dimmed backdrop */}
      <div
        className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over menu panel */}
      <div className="relative w-4/5 max-w-sm bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-5 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
          <div className="flex items-center gap-2.5">
            <img src="/lasu-logo.png" alt="LASU Logo" className="w-8 h-8 object-contain" />
            <div>
              <p className="text-base font-bold text-neutral-900 leading-tight">
                LASU<span className={roleColorClass}>{roleTitle}</span>
              </p>
              {roleSubtitle && <p className="text-[11px] text-neutral-500 font-medium">{roleSubtitle}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60 rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 px-3 pb-2">
            Navigation Menu
          </p>
          {navigation.map((item) => {
            const isActive = location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={onClose}
                className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-neutral-100 font-bold text-neutral-900 border border-neutral-200'
                    : 'text-neutral-700 hover:bg-neutral-50 active:bg-neutral-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600 ring-2 ring-white"></span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer with Logout */}
        <div className="p-4 border-t border-neutral-200 bg-neutral-50/50">
          <button
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 active:bg-red-100 transition-colors"
          >
            <span className="text-xl">🚪</span>
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}

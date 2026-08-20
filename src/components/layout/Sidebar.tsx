import { NavLink } from 'react-router-dom';
import { Building2, X } from 'lucide-react';
import { NAV_ITEMS } from '@/config/navigation';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { ROLE_LABELS } from '@/lib/types';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { profile } = useAuth();

  const visibleItems = NAV_ITEMS.filter(
    (item) => profile && item.roles.includes(profile.role),
  );

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed lg:sticky top-0 z-40 h-screen w-64 flex-shrink-0',
          'bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800',
          'transition-transform duration-300 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between h-16 px-5 border-b border-gray-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-primary text-white flex items-center justify-center shadow-sm">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-display font-bold text-gray-900 dark:text-white leading-none">
                HostelHub
              </h1>
              <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-0.5">
                Smart Management
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4 space-y-1 h-[calc(100vh-4rem-5rem)]">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group',
                  isActive
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={cn(
                      'w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110',
                      isActive ? 'text-primary-600 dark:text-primary-400' : '',
                    )}
                  />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto text-xs bg-accent-500 text-white px-1.5 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-gray-200 dark:border-slate-800 p-3">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-gray-50 dark:bg-slate-800/50">
            <div className="w-9 h-9 rounded-full bg-gradient-primary text-white flex items-center justify-center text-sm font-semibold">
              {profile?.full_name?.charAt(0).toUpperCase() ?? 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {profile?.full_name ?? 'User'}
              </p>
              <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                {profile ? ROLE_LABELS[profile.role] : ''}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

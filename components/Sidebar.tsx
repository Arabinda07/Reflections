import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, FileText, PlusCircle, Settings, LogOut, Command, LogIn } from 'lucide-react';
import { RoutePath } from '../types';
import { useAuth } from '../context/AuthContext';

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { pathname } = location;
  const { isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate(RoutePath.HOME);
  };

  const handleLogin = () => {
    navigate(RoutePath.LOGIN);
  };

  const navItems = [
    { icon: Home, label: 'Home', path: RoutePath.HOME },
    { icon: FileText, label: 'My Notes', path: RoutePath.NOTES },
    { icon: PlusCircle, label: 'Create Note', path: RoutePath.CREATE_NOTE },
    { icon: Settings, label: 'Account', path: RoutePath.ACCOUNT },
  ];

  const getIsActive = (path: string) => {
    if (path === RoutePath.HOME) {
      return pathname === RoutePath.HOME;
    }
    if (path === RoutePath.NOTES) {
      return pathname.startsWith(RoutePath.NOTES) && pathname !== RoutePath.CREATE_NOTE;
    }
    if (path === RoutePath.CREATE_NOTE) {
      return pathname === RoutePath.CREATE_NOTE;
    }
    return pathname.startsWith(path);
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-white/60 bg-white/45 backdrop-blur-2xl hidden md:flex md:flex-col shadow-[0_4px_15px_rgba(0,0,0,0.03)]">
      <div className="flex h-24 items-center px-8">
        <div className="flex items-center gap-3 text-slate-900 font-bold tracking-tight group cursor-default">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25 transition-transform group-hover:scale-105 group-hover:rotate-3">
            <Command size={20} />
          </div>
          <span className="text-xl tracking-tight text-slate-800">AI Notes</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4">
        <nav className="space-y-2">
          {navItems.map((item) => {
            const isActive = getIsActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 rounded-full px-5 py-3.5 text-sm transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold shadow-[0_4px_15px_rgba(129,140,248,0.25)] translate-x-1'
                    : 'text-slate-600 font-medium hover:bg-white/50 hover:text-slate-900 hover:translate-x-1'
                }`}
              >
                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} className={`transition-colors ${isActive ? "text-white" : "text-slate-500"}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-6 border-t border-white/30">
        {isAuthenticated ? (
            <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-full px-5 py-3.5 text-sm font-medium text-slate-600 hover:bg-white/50 hover:text-red-600 transition-all hover:shadow-sm"
            >
            <LogOut size={20} strokeWidth={2} className="opacity-70" />
            Sign Out
            </button>
        ) : (
            <button
            onClick={handleLogin}
            className="flex w-full items-center gap-3 rounded-full px-5 py-3.5 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-all shadow-sm"
            >
            <LogIn size={20} strokeWidth={2} className="opacity-70" />
            Sign In
            </button>
        )}
      </div>
    </aside>
  );
};
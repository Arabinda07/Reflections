import React, { useState, useRef, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Menu, Search, Sparkles, User, Settings, LogOut, Loader2, FileText, X, LogIn, Moon, Sun } from 'lucide-react';
import { RoutePath, Note } from '../types';
import { noteService } from '../services/noteService';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { StorageImage } from '../components/ui/StorageImage';

export const DashboardLayout: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  
  const handleNavigation = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const navItems = [
    { label: 'My Notes', path: RoutePath.NOTES },
    { label: 'Create Note', path: RoutePath.CREATE_NOTE },
    { label: 'Account', path: RoutePath.ACCOUNT },
  ];

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-green/30 selection:text-green-hover">
      {/* Fixed Navbar */}
      <nav className="fixed top-0 left-0 right-0 h-[64px] bg-white/80 border-b-2 border-border z-[100] flex justify-center liquid-glass">
        <div className="w-full max-w-[1440px] px-4 md:px-10 flex items-center justify-between">
          {/* Left Side */}
          <div className="flex items-center gap-4">
            <div 
              className="flex items-center gap-2 cursor-pointer group"
              onClick={() => handleNavigation(RoutePath.HOME)}
            >
              <div className="h-10 w-10 rounded-xl bg-green flex items-center justify-center text-white shadow-3d-green group-hover:scale-110 transition-transform">
                <Sparkles size={24} fill="currentColor" />
              </div>
              <span className="font-display text-[20px] sm:text-[24px] text-green lowercase tracking-tight truncate max-w-[150px] sm:max-w-none">
                mindful notes
              </span>
            </div>
          </div>

          {/* Right Side - Desktop Nav */}
          <div className="hidden md:flex items-center gap-2">
            <button 
              onClick={toggleDarkMode}
              className="p-2 rounded-xl text-gray-nav hover:text-green hover:bg-green/5 transition-colors"
              title="Toggle Dark Mode"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className="px-4 py-2 text-[13px] font-extrabold uppercase tracking-[0.5px] text-gray-nav hover:text-green hover:bg-green/5 rounded-xl transition-all duration-200"
              >
                {item.label}
              </button>
            ))}
            <div className="w-[1px] h-[24px] bg-border mx-2"></div>
            {isAuthenticated ? (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => logout()}
                className="text-red hover:bg-red/5"
              >
                LOGOUT
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate(RoutePath.LOGIN)}
                >
                  SIGN IN
                </Button>
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={() => navigate(RoutePath.SIGNUP)}
                >
                  SIGN UP
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Icon */}
          <div className="md:hidden flex items-center gap-2">
            <button 
              onClick={toggleDarkMode}
              className="p-2 rounded-xl text-gray-nav hover:text-green hover:bg-green/5 transition-colors"
              title="Toggle Dark Mode"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors z-[110]"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="text-gray-nav" size={24} /> : <Menu className="text-gray-nav" size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay - Moved OUTSIDE of nav to avoid overflow:hidden from liquid-glass */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[105] md:hidden animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-white/98 backdrop-blur-2xl" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="relative flex flex-col p-6 pt-24 gap-4 h-full overflow-y-auto">
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => handleNavigation(item.path)}
                className="w-full p-5 text-left text-[20px] font-black uppercase tracking-widest text-gray-text border-b-2 border-border/50 hover:text-green transition-colors active:bg-green/5 rounded-xl"
              >
                {item.label}
              </button>
            ))}
            
            <div className="mt-8 flex flex-col gap-4">
              {isAuthenticated ? (
                <Button 
                  variant="ghost" 
                  size="lg" 
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-red hover:bg-red/5 h-16 font-black uppercase tracking-widest border-2 border-red/10"
                >
                  LOGOUT
                </Button>
              ) : (
                <>
                  <Button 
                    variant="secondary" 
                    size="lg" 
                    onClick={() => handleNavigation(RoutePath.LOGIN)}
                    className="w-full h-16 font-black uppercase tracking-widest border-2 border-border shadow-3d-gray"
                  >
                    SIGN IN
                  </Button>
                  <Button 
                    variant="primary" 
                    size="lg" 
                    onClick={() => handleNavigation(RoutePath.SIGNUP)}
                    className="w-full h-16 font-black uppercase tracking-widest shadow-3d-green"
                  >
                    SIGN UP
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="pt-[64px] w-full max-w-[1440px] mx-auto">
        <Outlet />
      </main>
    </div>
  );
};
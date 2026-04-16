import React, { useState, useRef, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Menu, Search, Sparkles, User, Settings, LogOut, Loader2, FileText, X, LogIn, Moon, Sun, ArrowRight, Download } from 'lucide-react';
import { RoutePath, Note } from '../types';
import { noteService } from '../services/noteService';
import { useAuth } from '../context/AuthContext';
import { usePWAInstall } from '../context/PWAInstallContext';
import { Button } from '../components/ui/Button';
import { StorageImage } from '../components/ui/StorageImage';
import { SyncBanner } from '../components/ui/SyncBanner';

export const DashboardLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { canInstall, triggerInstall } = usePWAInstall();
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

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const guestNavItems = [
    { label: 'Homepage', path: RoutePath.HOME },
    { label: 'FAQ', path: RoutePath.FAQ },
  ];

  const authNavItems = [
    { label: 'My Notes', path: RoutePath.NOTES },
    { label: 'Create Note', path: RoutePath.CREATE_NOTE },
    { label: 'Account', path: RoutePath.ACCOUNT },
    { label: 'FAQ', path: RoutePath.FAQ },
  ];

  const navItems = isAuthenticated ? authNavItems : guestNavItems;

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#121212] font-sans selection:bg-green/30 selection:text-green-hover transition-colors duration-300">
      {/* Fixed Navbar */}
      <nav className="fixed top-0 left-0 right-0 h-[64px] border-b-2 border-border z-[100] flex justify-center liquid-glass">
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
              <span className="font-display text-[20px] sm:text-[24px] bg-gradient-to-r from-green via-blue to-green bg-clip-text text-transparent animate-gradient-x lowercase tracking-tight truncate max-w-[150px] sm:max-w-none">
                reflections
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
                className="px-4 py-2 text-[13px] font-extrabold uppercase tracking-[0.5px] text-gray-nav hover:text-green hover:bg-green/5 rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-1"
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
                className="text-red hover:bg-red/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red"
              >
                LOGOUT
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate(RoutePath.LOGIN)}
                  className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green"
                >
                  SIGN IN
                </Button>
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={() => navigate(RoutePath.SIGNUP)}
                  className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-green"
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
              className="p-2 rounded-xl text-gray-nav hover:text-green hover:bg-green/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green"
              title="Toggle Dark Mode"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl text-gray-nav hover:text-green hover:bg-green/5 transition-colors z-[110] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="text-gray-nav" size={24} /> : <Menu className="text-gray-nav" size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay - Moved OUTSIDE of nav to avoid overflow:hidden from liquid-glass */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[105] md:hidden animate-in fade-in duration-500">
          <div className="absolute inset-0 bg-white/96 dark:bg-[#0a0a0b]/96 backdrop-blur-3xl" onClick={() => setIsMobileMenuOpen(false)} />
          
          {/* Ambient Background for Mobile Menu */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] right-[-10%] w-[300px] h-[300px] bg-green/10 blur-[100px] rounded-full animate-pulse" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] bg-blue/10 blur-[100px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
          </div>

          {/* Close Button */}
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="absolute top-4 right-4 p-3 rounded-2xl text-gray-nav hover:text-green hover:bg-green/5 transition-all z-[110] border-2 border-border dark:border-white/10 bg-white dark:bg-[#1e1e1e] shadow-3d-gray active:shadow-none active:translate-y-[2px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2"
            aria-label="Close menu"
          >
            <X size={24} />
          </button>

          <div className="relative flex flex-col p-8 pt-24 gap-6 h-full overflow-y-auto">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-12 w-12 rounded-2xl bg-green flex items-center justify-center text-white shadow-3d-green">
                <Sparkles size={28} fill="currentColor" />
              </div>
              <span className="font-display text-[28px] bg-gradient-to-r from-green via-blue to-green bg-clip-text text-transparent animate-gradient-x lowercase">reflections</span>
            </div>

            {isAuthenticated ? (
              <>
                <div className="flex flex-col gap-2">
                  {navItems.map((item) => (
                    <button
                      key={item.label}
                      onClick={() => handleNavigation(item.path)}
                      className="w-full p-6 text-left text-[24px] font-black uppercase tracking-widest text-gray-text border-b-2 border-border/50 hover:text-green transition-all active:bg-green/5 rounded-2xl flex items-center justify-between group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-inset"
                    >
                      <span>{item.label}</span>
                      <ArrowRight className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
                <div className="mt-8 flex flex-col gap-4 pb-10">
                  {/* PWA Install Button — only visible when browser supports it */}
                  {canInstall && (
                    <button
                      onClick={async () => {
                        await triggerInstall();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-center gap-3 p-5 rounded-2xl border-2 border-green/30 bg-green/5 text-green font-black uppercase tracking-widest text-[14px] transition-all hover:bg-green/10 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green"
                    >
                      <Download size={20} />
                      Add to Home Screen
                    </button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="lg" 
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full text-red hover:bg-red/5 h-16 font-black uppercase tracking-widest border-2 border-red/10 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-1"
                  >
                    LOGOUT
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-2 pb-10">
                {[
                  { label: 'Homepage', path: RoutePath.HOME },
                  { label: 'FAQ', path: RoutePath.FAQ },
                  { label: 'Sign In', path: RoutePath.LOGIN },
                  { label: 'Sign Up', path: RoutePath.SIGNUP },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => handleNavigation(item.path)}
                    className="w-full p-6 text-left text-[24px] font-black uppercase tracking-widest text-gray-text border-b-2 border-border/50 hover:text-green transition-all active:bg-green/5 rounded-2xl flex items-center justify-between group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-inset"
                  >
                    <span>{item.label}</span>
                    <ArrowRight className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}

              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <SyncBanner />
      <main className="pt-[64px] w-full max-w-[1440px] mx-auto flex-grow">
        <Outlet />
      </main>

      {/* Global Footer - Minimalist */}
      <footer className="w-full border-t border-border py-8 mt-12 bg-white/50 dark:bg-black/20 backdrop-blur-sm">
        <div className="max-w-[1440px] mx-auto px-4 md:px-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-8">
            <button 
              onClick={() => navigate(RoutePath.HOME)}
              className="text-[11px] font-black uppercase tracking-widest text-gray-nav hover:text-green transition-colors"
            >
              Home
            </button>
            <button 
              onClick={() => navigate(RoutePath.FAQ)}
              className="text-[11px] font-black uppercase tracking-widest text-gray-nav hover:text-green transition-colors"
            >
              FAQ
            </button>
            <button 
              onClick={() => navigate(RoutePath.PRIVACY)}
              className="text-[11px] font-black uppercase tracking-widest text-gray-nav hover:text-green transition-colors"
            >
              Privacy Policy
            </button>
          </div>

          <div className="text-[11px] font-black uppercase tracking-widest text-gray-nav/50">
            © 2026 Arabinda
          </div>
        </div>
      </footer>
    </div>
  );
};
import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  List, 
  X, 
  Moon, 
  Sun, 
  DownloadSimple, 
  CaretRight,
  Leaf 
} from '@phosphor-icons/react';
import { RoutePath } from '../types';
import { useAuth } from '../context/AuthContext';
import { usePWAInstall } from '../context/PWAInstallContext';
import { Button } from '../components/ui/Button';
import { SyncBanner } from '../components/ui/SyncBanner';

export const DashboardLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { canInstall, triggerInstall } = usePWAInstall();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuId = useId();
  const mobileMenuTitleId = useId();
  const mobileMenuDescriptionId = useId();
  const mobileMenuCloseRef = useRef<HTMLButtonElement | null>(null);
  const mobileMenuPanelRef = useRef<HTMLDivElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
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
    if (!isMobileMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false);
        return;
      }

      if (event.key === 'Tab' && mobileMenuPanelRef.current) {
        const focusableElements = mobileMenuPanelRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );

        if (focusableElements.length === 0) {
          event.preventDefault();
          return;
        }

        const first = focusableElements[0];
        const last = focusableElements[focusableElements.length - 1];
        const activeElement = document.activeElement;

        if (event.shiftKey && activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    const focusTimer = window.setTimeout(() => {
      mobileMenuCloseRef.current?.focus();
    }, 40);

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      window.clearTimeout(focusTimer);
      previousFocusRef.current?.focus();
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
    { label: 'My notes', path: RoutePath.NOTES },
    { label: 'Create note', path: RoutePath.CREATE_NOTE },
    { label: 'Account', path: RoutePath.ACCOUNT },
    { label: 'FAQ', path: RoutePath.FAQ },
  ];

  const navItems = isAuthenticated ? authNavItems : guestNavItems;
  const isWritingRoute =
    location.pathname.includes('/new') ||
    location.pathname.includes('/edit') ||
    (location.pathname.startsWith('/notes/') && location.pathname !== '/notes/');
  const isLandingRoute = location.pathname === RoutePath.HOME && !isAuthenticated;

  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-body font-sans selection:bg-green/30 selection:text-green transition-colors duration-300">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>

      {/* Global Grain Texture */}
      <div className="grain-overlay pointer-events-none" />

      {/* Navbar - Stationary Anchor (Floats on Landing) */}
      {!isWritingRoute && (
        <nav className={`z-[100] flex justify-center border-b-2 border-border transition-colors duration-500 ${isLandingRoute ? 'fixed left-0 right-0 top-0 bg-transparent pt-[env(safe-area-inset-top)]' : 'sticky top-0 flex-none bg-[rgba(var(--panel-bg-rgb),0.92)] backdrop-blur-xl pt-[env(safe-area-inset-top)]'}`}>
        <div className="w-full max-w-[1440px] px-4 md:px-10 flex items-center justify-between">
          {/* Left Side */}
          <div className="flex items-center gap-4">
            <div 
              className="flex items-center gap-2 cursor-pointer group"
              onClick={() => handleNavigation(RoutePath.HOME)}
            >
              <div className="h-10 w-10 rounded-xl bg-green flex items-center justify-center text-white shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:-rotate-12">
                <Leaf size={24} weight="fill" />
              </div>
              <span className="font-serif italic text-[22px] sm:text-[26px] text-green tracking-tight truncate max-w-[150px] sm:max-w-none">
                Reflections
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
                className="px-4 py-2 text-[13px] font-extrabold text-gray-nav hover:text-green hover:bg-green/5 rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-1"
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
                Logout
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate(RoutePath.LOGIN)}
                  className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green"
                >
                  Sign in
                </Button>
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={() => navigate(RoutePath.SIGNUP)}
                  className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-green"
                >
                  Sign up
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
              aria-expanded={isMobileMenuOpen}
              aria-controls={mobileMenuId}
            >
              {isMobileMenuOpen ? <X size={24} weight="bold" /> : <List size={24} weight="bold" />}
            </button>
          </div>
        </div>
      </nav>
      )}

      {/* Mobile Menu Overlay - Moved OUTSIDE of nav to avoid overflow:hidden from liquid-glass */}
      {typeof document !== 'undefined' && isMobileMenuOpen
        ? createPortal(
            <div className="fixed inset-0 z-[105] md:hidden animate-in fade-in duration-500">
              <div
                className="absolute inset-0 bg-[rgba(var(--panel-bg-rgb),0.82)] backdrop-blur-2xl"
                onClick={() => setIsMobileMenuOpen(false)}
              />

              {/* Ambient Background for Mobile Menu */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[300px] h-[300px] bg-green/10 blur-[100px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] left-[-10%] h-[300px] w-[300px] animate-pulse rounded-full bg-golden/10 blur-[100px]" style={{ animationDelay: '1s' }} />
              </div>

              <div
                ref={mobileMenuPanelRef}
                id={mobileMenuId}
                role="dialog"
                aria-modal="true"
                aria-labelledby={mobileMenuTitleId}
                aria-describedby={mobileMenuDescriptionId}
                className="relative flex h-full flex-col gap-6 overflow-y-auto p-8 pt-24"
              >
                <h2 id={mobileMenuTitleId} className="sr-only">
                  Navigation menu
                </h2>
                <p id={mobileMenuDescriptionId} className="sr-only">
                  Use this menu to move around Reflections and close it when you are ready to return to the page.
                </p>

                {/* Close Button */}
                <button
                  ref={mobileMenuCloseRef}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="absolute right-4 top-4 z-[110] rounded-2xl border-2 border-border bg-[rgba(var(--panel-bg-rgb),0.94)] p-3 text-gray-nav shadow-sm transition-all duration-300 ease-out-expo hover:bg-green/6 hover:text-green active:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2"
                  aria-label="Close menu"
                >
                  <X size={24} />
                </button>

                <div className="flex items-center gap-3 mb-8">
                  <div className="h-12 w-12 rounded-2xl bg-green flex items-center justify-center text-white shadow-sm">
                    <Leaf size={28} weight="fill" />
                  </div>
                  <span className="font-serif italic text-[28px] text-green">Reflections</span>
                </div>

                {isAuthenticated ? (
                  <>
                    <div className="flex flex-col gap-2">
                      {navItems.map((item) => (
                        <button
                          key={item.label}
                          onClick={() => handleNavigation(item.path)}
                          className="w-full p-6 text-left text-[24px] font-black text-gray-text border-b-2 border-border/50 hover:text-green transition-all duration-300 active:bg-green/5 rounded-2xl flex items-center justify-between group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-inset"
                        >
                          <span>{item.label}</span>
                          <CaretRight weight="bold" className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))}
                    </div>
                    <div className="mt-8 flex flex-col gap-4" style={{ paddingBottom: 'calc(2.5rem + env(safe-area-inset-bottom))' }}>
                      {/* PWA Install Button — only visible when browser supports it */}
                      {canInstall && (
                        <button
                          onClick={async () => {
                            await triggerInstall();
                            setIsMobileMenuOpen(false);
                          }}
                          className="w-full flex items-center justify-center gap-3 p-5 rounded-2xl border-2 border-green/30 bg-green/5 text-green font-black text-[14px] transition-all duration-300 hover:bg-green/10 active:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green"
                        >
                          <DownloadSimple size={20} weight="bold" />
                          Add to home screen
                        </button>
                      )}
                      <Button
                        variant="ghost"
                        size="lg"
                        onClick={() => {
                          logout();
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full text-red hover:bg-red/5 h-16 font-black border-2 border-red/10 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-1"
                      >
                        Logout
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col gap-2" style={{ paddingBottom: 'calc(2.5rem + env(safe-area-inset-bottom))' }}>
                    {[
                      { label: 'Homepage', path: RoutePath.HOME },
                      { label: 'FAQ', path: RoutePath.FAQ },
                      { label: 'Sign In', path: RoutePath.LOGIN },
                      { label: 'Sign Up', path: RoutePath.SIGNUP },
                    ].map((item) => (
                      <button
                        key={item.label}
                        onClick={() => handleNavigation(item.path)}
                        className="w-full p-6 text-left text-[24px] font-black text-gray-text border-b-2 border-border/50 hover:text-green transition-all duration-300 ease-out-quart active:bg-green/5 rounded-2xl flex items-center justify-between group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-inset"
                      >
                        <span>{item.label}</span>
                        <CaretRight weight="bold" className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>,
            document.body,
          )
        : null}

      {/* Main Content - Scrollable Region */}
      <SyncBanner />
      <main id="main-content" tabIndex={-1} className="relative flex flex-1 min-h-0 flex-col overflow-y-auto custom-scrollbar">
        <div className="w-full max-w-[1440px] mx-auto flex-1 flex flex-col">
          <Outlet />
        </div>
        
        {/* Global Footer - Positioned for full-width background with centered content */}
        {!isWritingRoute && (
          <footer className="mt-auto w-full border-t border-border bg-[rgba(var(--panel-bg-rgb),0.72)] py-12 backdrop-blur-sm transition-all duration-300">
            <div className="max-w-[1440px] mx-auto px-6 md:px-16 flex flex-col sm:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-10">
                <button 
                  onClick={() => navigate(RoutePath.HOME)}
                  className="text-[11px] font-black uppercase tracking-widest text-gray-nav hover:text-green transition-all"
                >
                  Home
                </button>
                <button 
                  onClick={() => navigate(RoutePath.FAQ)}
                  className="text-[11px] font-black uppercase tracking-widest text-gray-nav hover:text-green transition-all"
                >
                  FAQ
                </button>
                <button 
                  onClick={() => navigate(RoutePath.PRIVACY)}
                  className="text-[11px] font-black uppercase tracking-widest text-gray-nav hover:text-green transition-all"
                >
                  Privacy
                </button>
              </div>

              <div className="text-[11px] font-black uppercase tracking-widest text-gray-nav/40">
                © 2026 <a 
                  href="https://arabinda07.github.io/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-green transition-all duration-300"
                >
                  Arabinda
                </a>
              </div>
            </div>
          </footer>
        )}
      </main>
    </div>
  );
};

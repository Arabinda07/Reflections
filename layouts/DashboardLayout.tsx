import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import emailjs from '@emailjs/browser';
import { 
  List, 
  X, 
  Moon, 
  Sun, 
  DownloadSimple, 
  CaretRight,
  Bug,
  Leaf,
  PaperPlaneTilt,
  CheckCircle
} from '@phosphor-icons/react';
import { RoutePath } from '../types';
import { useAuth } from '../context/AuthContext';
import { usePWAInstall } from '../context/PWAInstallContext';
import { AnalyticsRouteTracker } from '../src/analytics/AnalyticsRouteTracker';
import { Button } from '../components/ui/Button';
import { ModalSheet } from '../components/ui/ModalSheet';
import { SyncBanner } from '../components/ui/SyncBanner';
import { registerAndroidBackAction } from '../src/native/androidBack';
import { NATIVE_PAGE_TOP_PADDING, NATIVE_TOP_CONTROL_OFFSET } from '../src/native/safeArea';
import { useAndroidBackHandler } from '../src/native/useAndroidBackHandler';

const SUPPORT_EMAIL = 'robinsaha434@gmail.com';
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY; 

export const DashboardLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const { canInstall, isInstalled, triggerInstall } = usePWAInstall();
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

  // Bug Report State
  const [isBugModalOpen, setIsBugModalOpen] = useState(false);
  const [bugMessage, setBugMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useAndroidBackHandler();

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

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    return registerAndroidBackAction(() => {
      setIsMobileMenuOpen(false);
      return true;
    });
  }, [isMobileMenuOpen]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleCloseBugModal = React.useCallback(() => {
    setIsBugModalOpen(false);
    setSubmitError(null);
  }, []);

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const handleBugSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bugMessage.trim()) return;
    
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      const templateParams = {
        from_name: user?.email || 'Guest User',
        message: bugMessage,
        page_url: window.location.href,
        timestamp: new Date().toLocaleString(),
      };

      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateParams,
        EMAILJS_PUBLIC_KEY
      );
      
      setIsSubmitting(false);
      setIsSubmitted(true);
      setBugMessage('');
      
      setTimeout(() => {
        setIsBugModalOpen(false);
        setTimeout(() => setIsSubmitted(false), 500);
      }, 2500);
    } catch (error) {
      console.error('Failed to send bug report:', error);
      setIsSubmitting(false);
      setSubmitError('I couldn\'t send your report just now. Please try again or email us directly.');
    }
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
  const landingControlClass = isLandingRoute
    ? 'surface-floating surface-floating--media'
    : 'text-gray-nav hover:text-green hover:bg-green/5';

  return (
    <div className="relative flex h-[100dvh] flex-col overflow-hidden bg-body font-sans selection:bg-green/30 selection:text-green transition-colors duration-300">
      <AnalyticsRouteTracker />
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>

      {/* Navbar — flex-none keeps it outside the scroll container, no sticky needed */}
      {!isWritingRoute && (
        <nav className={`z-[100] flex-none flex justify-center transition-colors duration-500 ${isLandingRoute ? 'landing-nav-scrim fixed left-0 right-0 top-0 pt-[env(safe-area-inset-top)]' : 'border-b border-border/80 bg-[rgba(var(--panel-bg-rgb),0.9)] pt-[env(safe-area-inset-top)]'}`}>
        <div className="w-full max-w-[1440px] px-4 md:px-10 h-14 flex items-center justify-between">
          {/* Left Side */}
          <div className="flex items-center gap-4">
            <Link 
              to={RoutePath.HOME}
              className="flex items-center gap-2 group"
              aria-label="Reflections — go to home"
            >
              <div className="h-10 w-10 rounded-xl bg-green flex items-center justify-center text-white shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:-rotate-12">
                <Leaf size={24} weight="fill" />
              </div>
              <span className="font-serif italic text-[22px] sm:text-[26px] text-green tracking-tight truncate max-w-[150px] sm:max-w-none">
                Reflections
              </span>
            </Link>
          </div>

          {/* Right Side - Desktop Nav */}
          <div className="hidden md:flex items-center gap-2">
            <button 
              onClick={toggleDarkMode}
              className={`p-2 rounded-xl transition-colors ${landingControlClass}`}
              title="Toggle Dark Mode"
              aria-label={isDarkMode ? 'Use light mode' : 'Use dark mode'}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                aria-current={location.pathname === item.path ? 'page' : undefined}
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
              className={`p-2 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green ${landingControlClass}`}
              title="Toggle Dark Mode"
              aria-label={isDarkMode ? 'Use light mode' : 'Use dark mode'}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`p-2 rounded-xl transition-colors z-[110] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green ${landingControlClass}`}
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
                className="absolute inset-0 screen-scrim screen-scrim--strong"
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
                className="relative flex h-full flex-col gap-6 overflow-y-auto p-8"
                style={{ paddingTop: NATIVE_PAGE_TOP_PADDING }}
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
                  className="surface-floating surface-floating--strong absolute right-4 z-[110] rounded-2xl p-3 text-gray-nav transition-all duration-300 ease-out-expo hover:text-green active:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2"
                  style={{ top: NATIVE_TOP_CONTROL_OFFSET }}
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
                          className="w-full p-6 text-left text-[24px] font-black text-gray-text hover:text-green transition-all duration-300 active:bg-green/5 rounded-2xl flex items-center justify-between group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-inset"
                        >
                          <span>{item.label}</span>
                          <CaretRight weight="bold" className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))}
                    </div>
                    <div className="mt-8 flex flex-col gap-4" style={{ paddingBottom: 'calc(2.5rem + env(safe-area-inset-bottom))' }}>
                      {/* PWA Install Button — only visible when browser supports it */}
                      {canInstall && !isInstalled && (
                        <button
                          onClick={async () => {
                            await triggerInstall();
                            setIsMobileMenuOpen(false);
                          }}
                          className="w-full flex items-center justify-center gap-3 p-5 rounded-2xl border-2 border-green/30 bg-green/5 text-green font-black text-[14px] transition-all duration-300 hover:bg-green/10 active:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green"
                          aria-label="Add Reflections to your home screen"
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
                        className="w-full p-6 text-left text-[24px] font-black text-gray-text hover:text-green transition-all duration-300 ease-out-quart active:bg-green/5 rounded-2xl flex items-center justify-between group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-inset"
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

      {/* Main Content — sole scroll container in the shell */}
      <main id="main-content" tabIndex={-1} className="relative flex flex-1 min-h-0 flex-col overflow-y-auto custom-scrollbar">
        <SyncBanner />
        <div className="w-full flex-1 flex flex-col">
          <Outlet />
        </div>
        
        {/* Global Footer - Positioned for full-width background with centered content */}
        {!isWritingRoute && (
          <footer className="screen-scrim screen-scrim--strong mt-auto w-full border-t border-border py-12 transition-all duration-300">
            <div className="max-w-[1440px] mx-auto px-6 md:px-16 flex flex-col sm:flex-row items-center justify-between gap-8">
              <nav aria-label="Footer navigation" className="flex items-center gap-10">
                <Link 
                  to={RoutePath.HOME}
                  className="text-[11px] font-black uppercase tracking-widest text-gray-nav hover:text-green transition-all"
                >
                  Home
                </Link>
                <Link 
                  to={RoutePath.FAQ}
                  className="text-[11px] font-black uppercase tracking-widest text-gray-nav hover:text-green transition-all"
                >
                  FAQ
                </Link>
                <Link 
                  to={RoutePath.PRIVACY}
                  className="text-[11px] font-black uppercase tracking-widest text-gray-nav hover:text-green transition-all"
                >
                  Privacy
                </Link>
                <Link 
                  to={RoutePath.TERMS}
                  className="text-[11px] font-black uppercase tracking-widest text-gray-nav hover:text-green transition-all"
                >
                  Terms
                </Link>
              </nav>

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

      {/* Floating Bug Report Button */}
      <button
        onClick={() => setIsBugModalOpen(true)}
        className="fixed bottom-4 left-6 z-[100] flex h-11 w-11 items-center justify-center rounded-2xl border-[1.5px] border-border bg-surface text-gray-nav shadow-sm transition-all duration-300 hover:text-green hover:border-green/40 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green/20 group"
        aria-label="Report a bug"
      >
        <Bug size={20} weight="duotone" className="transition-transform group-hover:rotate-12" />
      </button>

      {/* Bug Report Modal */}
      <ModalSheet
        isOpen={isBugModalOpen}
        onClose={handleCloseBugModal}
        title={isSubmitted ? "Thank you" : "Report a bug"}
        description={isSubmitted ? "Your report has been sent. We'll look into it." : "Tell us what felt unclear or broken. Your feedback helps make Reflections better."}
        icon={isSubmitted ? <CheckCircle size={28} weight="duotone" /> : <Bug size={28} weight="duotone" />}
        size="md"
      >
        <div className="space-y-6 py-2">
          {!isSubmitted ? (
            <form onSubmit={handleBugSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="bug-message" className="label-caps text-gray-light">Your report</label>
                <textarea
                  id="bug-message"
                  autoFocus
                  required
                  placeholder="Describe what happened..."
                  value={bugMessage}
                  onChange={(e) => setBugMessage(e.target.value)}
                  className="w-full min-h-[180px] p-6 rounded-[20px] border border-border/40 bg-panel-bg/50 text-gray-text font-serif text-[18px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-green/10 focus:border-green/30 transition-all resize-none placeholder:text-gray-nav/30"
                />
                {submitError && (
                  <p className="text-[13px] font-semibold text-red animate-in fade-in slide-in-from-top-1 duration-300">
                    {submitError}
                  </p>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setIsBugModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="primary" 
                  isLoading={isSubmitting}
                  disabled={!bugMessage.trim()}
                >
                  Send report
                  <PaperPlaneTilt size={18} weight="bold" className="ml-2" />
                </Button>
              </div>
            </form>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center animate-in fade-in zoom-in duration-500">
              <div className="h-20 w-20 rounded-full bg-green/10 text-green flex items-center justify-center mb-6">
                <CheckCircle size={48} weight="fill" />
              </div>
              <p className="font-serif text-[18px] text-gray-text max-w-xs">
                We've received your report and will look into it soon.
              </p>
            </div>
          )}
        </div>
      </ModalSheet>
    </div>
  );
};

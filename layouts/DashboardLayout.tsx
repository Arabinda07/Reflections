import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
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
import { useKeyboardShortcut } from '../src/hooks/useKeyboardShortcut';
import { usePWAInstall } from '../context/PWAInstallContext';
import { AnalyticsRouteTracker } from '../src/analytics/AnalyticsRouteTracker';
import { Button } from '../components/ui/Button';
import { ModalSheet } from '../components/ui/ModalSheet';
import { ReferralInvitePanel } from '../components/ui/ReferralInvitePanel';
import { SyncBanner } from '../components/ui/SyncBanner';
import { referralService } from '../services/engagementServices';
import { registerAndroidBackAction } from '../src/native/androidBack';
import { NATIVE_PAGE_TOP_PADDING, NATIVE_TOP_CONTROL_OFFSET } from '../src/native/safeArea';
import { useAndroidBackHandler } from '../src/native/useAndroidBackHandler';
import { useHaptics } from '../hooks/useHaptics';
import { useSound } from '../hooks/useSound';

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

  const haptics = useHaptics();
  const { playSaveChime } = useSound();

  useKeyboardShortcut(
    { key: 'n', ctrlOrCmd: true },
    (e) => {
      e.preventDefault();
      navigate(RoutePath.CREATE_NOTE);
    },
    [navigate]
  );

  // Bug Report State
  const [isBugModalOpen, setIsBugModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [bugMessage, setBugMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useAndroidBackHandler();

  useEffect(() => {
    referralService.captureReferralCode(location.search);
  }, [location.search]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;

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
      
      haptics.confirming();
      playSaveChime();
      
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
    location.pathname === RoutePath.RELEASE ||
    location.pathname.includes('/new') ||
    location.pathname.includes('/edit') ||
    (location.pathname.startsWith('/notes/') && location.pathname !== '/notes/');
  const isMobileNavSuppressedRoute =
    location.pathname === RoutePath.INSIGHTS ||
    location.pathname.startsWith(RoutePath.SANCTUARY);
  const isLandingRoute = location.pathname === RoutePath.HOME && !isAuthenticated;
  const landingControlClass = isLandingRoute
    ? 'text-hero-ink hover:text-green hover:bg-white/10'
    : 'text-gray-nav hover:text-green hover:bg-green/5';

  return (
    <div className="surface-scope-sage relative flex h-[100dvh] min-h-[100dvh] flex-col overflow-hidden bg-body font-sans selection:bg-green/30 selection:text-green">
      <AnalyticsRouteTracker />
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>

      {/* Navbar — flex-none keeps it outside the scroll container, no sticky needed */}
      {!isWritingRoute && (
        <nav className={`z-[100] flex-none flex justify-center transition-colors duration-500 ${isLandingRoute ? 'landing-nav-scrim fixed left-0 right-0 top-0 pt-[env(safe-area-inset-top)]' : 'bg-body/95 pt-[env(safe-area-inset-top)]'}`}>
          <div className="w-full max-w-[1440px] px-4 md:px-10 h-14 flex items-center justify-between">
          {/* Left Side */}
          <div className="flex items-center gap-4">
            <Link 
              to={RoutePath.HOME}
              className="flex items-center gap-2 group"
              aria-label="Reflections — go to home"
            >
              <div className="h-10 w-10 rounded-xl bg-green flex items-center justify-center text-white shadow-sm transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-12">
                <Leaf size={24} weight="fill" />
              </div>
              <span className="font-serif italic text-[22px] sm:text-[26px] text-green tracking-normal truncate max-w-[150px] sm:max-w-none">
                Reflections
              </span>
            </Link>
          </div>

          {/* Right Side - Desktop Nav */}
          <div className={`${isMobileNavSuppressedRoute ? 'hidden md:flex' : 'flex'} hidden md:flex items-center gap-2`}>
            <button 
              onClick={toggleDarkMode}
              className={`relative flex items-center justify-center w-9 h-9 rounded-xl transition-colors ${landingControlClass}`}
              title="Toggle Dark Mode"
              aria-label={isDarkMode ? 'Use light mode' : 'Use dark mode'}
            >
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                  key={isDarkMode ? 'dark' : 'light'}
                  initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                >
                  {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                </motion.div>
              </AnimatePresence>
            </button>
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  aria-current={isActive ? 'page' : undefined}
                  className={`rounded-xl border-b-2 px-4 py-2 text-[13px] font-extrabold transition-colors duration-200 hover:bg-green/5 hover:text-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-1 ${
                    isActive ? 'border-green bg-green/5 text-green' : 'border-transparent text-gray-nav'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <div className="w-[1px] h-[24px] bg-border mx-2" role="separator" aria-orientation="vertical"></div>
            {isAuthenticated ? (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsInviteModalOpen(true)}
                  className="gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green"
                >
                  Invite
                  <PaperPlaneTilt size={16} weight="regular" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => logout()}
                  className="text-clay hover:bg-clay/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green"
                >
                  Logout
                </Button>
              </>
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
          <div className={`${isMobileNavSuppressedRoute ? 'hidden' : 'flex'} md:hidden items-center gap-2`}>
            <button 
              onClick={toggleDarkMode}
              className={`relative flex items-center justify-center w-9 h-9 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green ${landingControlClass}`}
              title="Toggle Dark Mode"
              aria-label={isDarkMode ? 'Use light mode' : 'Use dark mode'}
            >
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                  key={isDarkMode ? 'dark' : 'light'}
                  initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                >
                  {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                </motion.div>
              </AnimatePresence>
            </button>
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`p-2 rounded-xl transition-colors z-[110] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green ${landingControlClass}`}
              aria-label="Toggle menu"
              aria-expanded={isMobileMenuOpen}
              aria-controls={mobileMenuId}
            >
              {isMobileMenuOpen ? <X size={24} weight="regular" /> : <List size={24} weight="regular" />}
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
                  className="surface-floating surface-floating--strong absolute right-4 z-[110] rounded-2xl p-3 text-gray-nav transition-colors duration-300 ease-out-expo hover:text-green active:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2"
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
                      {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                          <button
                            key={item.label}
                            onClick={() => handleNavigation(item.path)}
                            aria-current={isActive ? 'page' : undefined}
                            className={`flex w-full items-center justify-between rounded-2xl p-6 text-left text-[24px] font-black transition-colors duration-300 active:bg-green/5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-inset ${
                              isActive ? 'bg-green/10 text-green' : 'text-gray-text hover:text-green'
                            }`}
                          >
                            <span>{item.label}</span>
                            <CaretRight weight="regular" className="opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-8 flex flex-col gap-4" style={{ paddingBottom: 'calc(2.5rem + env(safe-area-inset-bottom))' }}>
                      {/* PWA Install Button — only visible when browser supports it */}
                      {canInstall && !isInstalled && (
                        <button
                          onClick={async () => {
                            await triggerInstall();
                            setIsMobileMenuOpen(false);
                          }}
                          className="w-full flex items-center justify-center gap-3 p-5 rounded-2xl border-2 border-green/30 bg-green/5 text-green font-black text-[14px] transition-colors duration-300 hover:bg-green/10 active:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green"
                          aria-label="Add Reflections to your home screen"
                        >
                          <DownloadSimple size={20} weight="regular" />
                          Add to home screen
                        </button>
                      )}
                      <Button
                        variant="secondary"
                        size="lg"
                        onClick={() => {
                          setIsInviteModalOpen(true);
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full h-16 font-black rounded-2xl"
                      >
                        Invite
                        <PaperPlaneTilt size={18} weight="regular" className="ml-2" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="lg"
                        onClick={() => {
                          logout();
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full text-clay hover:bg-clay/5 h-16 font-black border-2 border-clay/10 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-1"
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
                    ].map((item) => {
                      const isActive = location.pathname === item.path;
                      return (
                        <button
                          key={item.label}
                          onClick={() => handleNavigation(item.path)}
                          aria-current={isActive ? 'page' : undefined}
                          className={`flex w-full items-center justify-between rounded-2xl p-6 text-left text-[24px] font-black transition-colors duration-300 ease-out-expo active:bg-green/5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-inset ${
                            isActive ? 'bg-green/10 text-green' : 'text-gray-text hover:text-green'
                          }`}
                        >
                          <span>{item.label}</span>
                          <CaretRight weight="regular" className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>,
            document.body,
          )
        : null}

      {/* Main Content — sole scroll container in the shell */}
      <main id="main-content" tabIndex={-1} className="relative flex min-h-0 w-full flex-1 flex-col overflow-y-auto custom-scrollbar">
        <SyncBanner />
        <div className="w-full flex-1 flex flex-col">
          <Outlet />
        </div>
        
        {/* Global Footer - Positioned for full-width background with centered content */}
        {!isWritingRoute && (
          <footer className="screen-scrim screen-scrim--strong mt-auto w-full border-t border-border py-12 transition-colors duration-300">
            <div className="max-w-[1440px] mx-auto px-6 md:px-16 flex flex-col sm:flex-row items-center justify-between gap-8">
              <nav aria-label="Footer navigation" className="flex flex-wrap items-center justify-center gap-x-6 gap-y-4 sm:gap-10">
                <Link 
                  to={RoutePath.HOME}
                  className="text-[11px] font-black uppercase tracking-widest text-gray-nav hover:text-green transition-colors"
                >
                  Home
                </Link>
                <Link 
                  to={RoutePath.FAQ}
                  className="text-[11px] font-black uppercase tracking-widest text-gray-nav hover:text-green transition-colors"
                >
                  FAQ
                </Link>
                <Link
                  to={RoutePath.ABOUT}
                  className="text-[11px] font-black uppercase tracking-widest text-gray-nav hover:text-green transition-colors"
                >
                  About
                </Link>
                <Link 
                  to={RoutePath.PRIVACY}
                  className="text-[11px] font-black uppercase tracking-widest text-gray-nav hover:text-green transition-colors"
                >
                  Privacy
                </Link>
              </nav>

              <div className="text-[11px] font-black uppercase tracking-widest text-gray-nav/40">
                © 2026 <a 
                  href="https://arabinda07.github.io/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-green transition-colors duration-300"
                  aria-label="Arabinda's portfolio (opens in new tab)"
                >
                  Arabinda
                </a>
              </div>
            </div>
          </footer>
        )}
      </main>

      {!isWritingRoute && (
        <>
          {/* Floating Bug Report Button */}
          <button
            onClick={() => setIsBugModalOpen(!isBugModalOpen)}
            className={`fixed bottom-3 left-6 z-[110] flex h-11 w-11 items-center justify-center rounded-2xl transition duration-300 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green/20 group shadow-sm ${
              isBugModalOpen
                ? 'bg-green text-white border-[1.5px] border-green'
                : 'surface-floating hover:text-green'
            }`}
            aria-label={isBugModalOpen ? "Close bug report" : "Report a bug"}
          >
            {isBugModalOpen ? (
              <X size={20} weight="regular" />
            ) : (
              <Bug size={20} weight="regular" className="transition-transform group-hover:rotate-12" />
            )}
          </button>

          {/* Floating Bug Report Toast */}
          {typeof document !== 'undefined' && createPortal(
            <AnimatePresence>
              {isBugModalOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.95 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="fixed bottom-[68px] left-6 z-[105] w-[calc(100vw-48px)] sm:w-[380px] surface-floating surface-floating--strong !rounded-[24px] overflow-hidden"
                >
                  <div className="p-6">
                    {!isSubmitted ? (
                      <form onSubmit={handleBugSubmit} className="space-y-5">
                        <div className="flex items-center gap-2.5 mb-2">
                          <div className="h-8 w-8 rounded-lg bg-green/10 text-green flex items-center justify-center">
                            <Bug size={18} weight="regular" />
                          </div>
                          <h3 className="label-caps !text-gray-text">Report a bug</h3>
                        </div>

                        <div className="space-y-2">
                          <textarea
                            id="bug-message"
                            autoFocus
                            required
                            placeholder="Describe what happened..."
                            value={bugMessage}
                            onChange={(e) => setBugMessage(e.target.value)}
                            className="w-full min-h-[160px] p-5 rounded-[20px] border border-border/40 bg-body/50 text-gray-text font-serif text-[17px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-green/10 focus:border-green/30 transition-colors resize-none placeholder:text-gray-nav/30"
                          />
                          {submitError && (
                            <p className="text-[12px] font-bold text-clay animate-in fade-in slide-in-from-top-1">
                              {submitError}
                            </p>
                          )}
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                          <Button
                            type="submit"
                            variant="primary"
                            size="sm"
                            isLoading={isSubmitting}
                            disabled={!bugMessage.trim()}
                            className="w-full h-11 rounded-xl"
                          >
                            Send report
                            <PaperPlaneTilt size={16} weight="regular" className="ml-2" />
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-6 text-center animate-in fade-in zoom-in duration-500">
                        <div className="h-16 w-16 rounded-full bg-green/10 text-green flex items-center justify-center mb-5">
                          <CheckCircle size={36} weight="fill" />
                        </div>
                        <h3 className="label-caps mb-2">Thank you</h3>
                        <p className="font-serif italic text-[16px] text-gray-light leading-relaxed">
                          We've received your report. <br /> Your feedback helps a lot.
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>,
            document.body
          )}
        </>
      )}

      <ModalSheet
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Invite someone"
        description="Share Reflections with someone who might want a quiet space to write."
        icon={<PaperPlaneTilt size={20} weight="duotone" />}
        tone="honey"
        size="md"
      >
        <ReferralInvitePanel compact />
      </ModalSheet>
    </div>
  );
};

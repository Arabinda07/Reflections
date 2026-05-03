import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { RoutePath } from '../../types';

type IconProps = {
  className?: string;
};

type PublicHeaderProps = {
  isLandingRoute?: boolean;
};

type PublicMenuIconName = 'home' | 'faq' | 'about' | 'privacy' | 'signIn' | 'signUp';

type PublicMenuItem = {
  label: string;
  href: RoutePath;
  description: string;
  icon: PublicMenuIconName;
};

type ThemeModeButtonProps = {
  isDarkMode: boolean;
  onToggle: () => void;
  className: string;
  variant?: 'icon' | 'menu';
};

const publicNavItems = [
  { label: 'Home', href: RoutePath.HOME, description: 'Back to welcome', icon: 'home' },
  { label: 'FAQ', href: RoutePath.FAQ, description: 'Quick answers', icon: 'faq' },
  { label: 'About', href: RoutePath.ABOUT, description: 'Why it exists', icon: 'about' },
  { label: 'Privacy', href: RoutePath.PRIVACY, description: 'Data and trust', icon: 'privacy' },
] satisfies PublicMenuItem[];

const publicActionItems = [
  { label: 'Sign in', href: RoutePath.LOGIN, description: 'Open your journal', icon: 'signIn' },
  { label: 'Sign up', href: RoutePath.SIGNUP, description: 'Start writing', icon: 'signUp' },
] satisfies PublicMenuItem[];

const getInitialDarkMode = () =>
  typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false;

const AppLeafIcon: React.FC<IconProps> = ({ className = '' }) => (
  <svg viewBox="0 0 256 256" aria-hidden="true" className={className} fill="currentColor">
    <path d="M223.45,40.07a8,8,0,0,0-7.52-7.52C139.8,28.08,78.82,51,52.82,94a87.09,87.09,0,0,0-12.76,49A101.72,101.72,0,0,0,46.7,175.2a4,4,0,0,0,6.61,1.43l85-86.3a8,8,0,0,1,11.32,11.32L56.74,195.94,42.55,210.13a8.2,8.2,0,0,0-.6,11.1,8,8,0,0,0,11.71.43l16.79-16.79c14.14,6.84,28.41,10.57,42.56,11.07q1.67.06,3.33.06A86.93,86.93,0,0,0,162,203.18C205,177.18,227.93,116.21,223.45,40.07Z" />
  </svg>
);

const MenuIcon: React.FC<IconProps> = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none">
    <path
      d="M5 7h14M5 12h14M5 17h14"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const CloseIcon: React.FC<IconProps> = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none">
    <path
      d="m7 7 10 10M17 7 7 17"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const CaretIcon: React.FC<IconProps> = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none">
    <path
      d="m9 6 6 6-6 6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const SunIcon: React.FC<IconProps> = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none">
    <circle cx="12" cy="12" r="4.25" stroke="currentColor" strokeWidth="1.9" />
    <path
      d="M12 2.8v2.1M12 19.1v2.1M21.2 12h-2.1M4.9 12H2.8M18.5 5.5 17 7M7 17l-1.5 1.5M18.5 18.5 17 17M7 7 5.5 5.5"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
    />
  </svg>
);

const MoonIcon: React.FC<IconProps> = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none">
    <path
      d="M19.2 14.8A7.7 7.7 0 0 1 9.2 4.8 8.1 8.1 0 1 0 19.2 14.8Z"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinejoin="round"
    />
  </svg>
);

const PublicMenuIcon: React.FC<IconProps & { name: PublicMenuIconName }> = ({ name, className = '' }) => {
  switch (name) {
    case 'home':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none">
          <path d="M4.8 11.4 12 5l7.2 6.4" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M7.2 10.2v7.7h9.6v-7.7" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10.2 17.9v-4h3.6v4" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'faq':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none">
          <path d="M5.5 7.7a5 5 0 0 1 5-5h3a5 5 0 0 1 5 5v2.6a5 5 0 0 1-5 5h-2.7L6.7 19v-4.1a5 5 0 0 1-1.2-3.2v-4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M10.4 8.4a2 2 0 0 1 2-1.7c1.2 0 2 .7 2 1.7 0 .8-.4 1.2-1.2 1.7-.8.4-1.1.8-1.1 1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M12.1 14.1h.01" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      );
    case 'about':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none">
          <path d="M7 17.3c.5-3 2.2-4.6 5-4.6s4.5 1.6 5 4.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M12 10.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" strokeWidth="1.8" />
          <path d="M18.4 5.1v2.8M17 6.5h2.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case 'privacy':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none">
          <path d="M12 3.6 18.2 6v5.1c0 3.9-2.3 6.8-6.2 8.9-3.9-2.1-6.2-5-6.2-8.9V6L12 3.6Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M9.4 12.2 11.2 14l3.7-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'signIn':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none">
          <path d="M13 5.6h4.6v12.8H13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5.8 12h7.3M10.4 8.8 13.6 12l-3.2 3.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'signUp':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none">
          <path d="M6.4 17.6 7 14l8.1-8.1a2 2 0 0 1 2.9 2.8L9.8 16.9l-3.4.7Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M13.8 7.2 16.7 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M17.7 14.4v4.1M15.7 16.4h4.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
  }
};

const ThemeModeButton: React.FC<ThemeModeButtonProps> = ({
  isDarkMode,
  onToggle,
  className,
  variant = 'icon',
}) => {
  const Icon = isDarkMode ? SunIcon : MoonIcon;
  const label = isDarkMode ? 'Light mode' : 'Dark mode';
  const description = isDarkMode ? 'Use a brighter interface.' : 'Use a quieter dark interface.';

  if (variant === 'menu') {
    return (
      <button
        type="button"
        onClick={onToggle}
        className={className}
        aria-label={isDarkMode ? 'Use light mode' : 'Use dark mode'}
      >
        <span className="mobile-sidebar-link-icon">
          <Icon className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1 text-left">
          <span className="block text-[15px] font-black">{label}</span>
          <span className="mt-0.5 block text-[11px] font-semibold leading-snug text-gray-nav">
            {description}
          </span>
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      className={className}
      title={isDarkMode ? 'Use light mode' : 'Use dark mode'}
      aria-label={isDarkMode ? 'Use light mode' : 'Use dark mode'}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
};

export const PublicHeader: React.FC<PublicHeaderProps> = ({ isLandingRoute = false }) => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(getInitialDarkMode);
  const mobileMenuId = useId();
  const mobileMenuTitleId = useId();
  const mobileMenuDescriptionId = useId();
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const mobileMenuPanelRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return;
    }

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };

    const focusTimer = window.setTimeout(() => closeButtonRef.current?.focus(), 40);

    document.documentElement.classList.add('no-scroll');
    window.addEventListener('keydown', handleEscapeKey);

    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleEscapeKey);
      document.documentElement.classList.remove('no-scroll');
      menuButtonRef.current?.focus();
    };
  }, [isMobileMenuOpen]);

  const toggleDarkMode = () => {
    setIsDarkMode((currentMode) => !currentMode);
  };

  const handleMobileMenuKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Tab') {
      return;
    }

    const panel = mobileMenuPanelRef.current;
    if (!panel) {
      return;
    }

    const focusableItems = Array.from(
      panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((item) => {
      const style = window.getComputedStyle(item);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });

    const firstItem = focusableItems[0];
    const lastItem = focusableItems[focusableItems.length - 1];

    if (!firstItem || !lastItem) {
      event.preventDefault();
      return;
    }

    if (event.shiftKey && document.activeElement === firstItem) {
      event.preventDefault();
      lastItem.focus();
    } else if (!event.shiftKey && document.activeElement === lastItem) {
      event.preventDefault();
      firstItem.focus();
    }
  };

  const controlTone = isLandingRoute
    ? 'text-gray-text hover:bg-[rgb(var(--panel-bg-rgb)/0.2)] hover:text-green'
    : 'text-gray-nav hover:bg-green/5 hover:text-green';

  const mobileMenu = isMobileMenuOpen && typeof document !== 'undefined'
    ? createPortal(
        <div className="lg:hidden">
          <div
            className="public-mobile-menu-scrim fixed inset-0 z-[95]"
            aria-hidden="true"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <aside
            ref={mobileMenuPanelRef}
            id={mobileMenuId}
            role="dialog"
            aria-modal="true"
            aria-labelledby={mobileMenuTitleId}
            aria-describedby={mobileMenuDescriptionId}
            className="public-mobile-menu fixed bottom-0 right-0 top-0 z-[110] h-[100dvh]"
            style={{ width: 'min(86vw, 352px)' }}
            onKeyDown={handleMobileMenuKeyDown}
          >
            <h2 id={mobileMenuTitleId} className="sr-only">
              Navigation menu
            </h2>
            <p id={mobileMenuDescriptionId} className="sr-only">
              Use this menu to move around Reflections and close it when you are ready to return to the page.
            </p>
            <div className="flex items-center justify-between border-b border-border/40 px-5 pb-4 pt-[calc(env(safe-area-inset-top)+1rem)]">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-nav">Menu</p>
                <p className="mt-1 font-serif text-[22px] italic text-green">Reflections</p>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="mobile-sidebar-close"
                aria-label="Close menu"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

            <nav aria-label="Mobile public navigation" className="flex flex-col gap-1.5 px-4 py-5">
              {publicNavItems.map((item) => {
                const isActive = location.pathname === item.href;

                return (
                  <a
                    key={item.href}
                    href={item.href}
                    className="mobile-sidebar-link group"
                    data-active={isActive ? 'true' : undefined}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <span className="mobile-sidebar-link-icon">
                      <PublicMenuIcon name={item.icon} className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-black">{item.label}</span>
                      <span className="mt-1 block text-[12px] font-semibold leading-snug text-gray-nav">
                        {item.description}
                      </span>
                    </span>
                    <CaretIcon className="mobile-sidebar-link-caret h-4 w-4" />
                  </a>
                );
              })}
            </nav>

            <div className="mobile-sidebar-footer">
              <ThemeModeButton
                isDarkMode={isDarkMode}
                onToggle={toggleDarkMode}
                variant="menu"
                className="public-theme-toggle public-theme-toggle--mobile-menu mobile-sidebar-link mobile-sidebar-link--action group"
              />
              {publicActionItems.map((item) => (
                <a key={item.href} href={item.href} className="mobile-sidebar-link mobile-sidebar-link--action group">
                  <span className="mobile-sidebar-link-icon">
                    <PublicMenuIcon name={item.icon} className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-black">{item.label}</span>
                    <span className="mt-0.5 block text-[11px] font-semibold leading-snug text-gray-nav">
                      {item.description}
                    </span>
                  </span>
                </a>
              ))}
            </div>
          </aside>
        </div>,
        document.body,
      )
    : null;

  return (
    <>
      <header className={`public-header ${isLandingRoute ? 'public-header--landing landing-nav-scrim' : 'public-header--standard'}`}>
        <div className="mx-auto flex h-14 w-full max-w-[1440px] items-center justify-between gap-3 px-4 md:px-8 xl:px-10">
          <a
            href={RoutePath.HOME}
            className="group flex min-h-11 min-w-0 items-center gap-2"
            aria-label="Reflections - go to home"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green text-white shadow-sm transition-transform duration-300 group-hover:-rotate-12 group-hover:scale-105">
              <AppLeafIcon className="h-6 w-6" />
            </span>
            <span className="max-w-[150px] truncate font-serif text-[22px] italic tracking-normal text-green sm:max-w-none sm:text-[26px]">
              Reflections
            </span>
          </a>

          <nav aria-label="Public navigation" className="hidden items-center gap-1.5 lg:flex xl:gap-2">
            <ThemeModeButton
              isDarkMode={isDarkMode}
              onToggle={toggleDarkMode}
              className={`public-theme-toggle public-theme-toggle--desktop inline-flex h-11 w-11 items-center justify-center rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green ${controlTone}`}
            />
            {publicNavItems.map((item) => {
              const isActive = location.pathname === item.href;

              return (
                <a
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`inline-flex min-h-11 items-center rounded-xl border px-3 py-2 text-[12px] font-extrabold transition-colors duration-200 hover:border-green/20 hover:bg-green/5 hover:text-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-1 xl:px-4 xl:text-[13px] ${
                    isActive ? 'border-green bg-green/5 text-green shadow-sm shadow-green/5' : 'border-transparent text-gray-nav'
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
            <span className="mx-2 h-6 w-px bg-border" aria-hidden="true" />
            <a
              href={RoutePath.LOGIN}
              className="inline-flex min-h-11 items-center rounded-xl px-3 py-2 text-[13px] font-extrabold text-gray-nav transition-colors hover:bg-green/5 hover:text-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green"
            >
              Sign in
            </a>
            <a
              href={RoutePath.SIGNUP}
              className="inline-flex min-h-11 items-center rounded-xl bg-green px-4 py-2 text-[13px] font-extrabold text-white shadow-sm shadow-green/10 transition-colors hover:bg-green-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2"
            >
              Sign up
            </a>
          </nav>

          <div className="flex items-center gap-2 lg:hidden">
            <ThemeModeButton
              isDarkMode={isDarkMode}
              onToggle={toggleDarkMode}
              className={`public-theme-toggle public-theme-toggle--mobile-header inline-flex h-11 w-11 items-center justify-center rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green ${controlTone}`}
            />
            <button
              ref={menuButtonRef}
              type="button"
              className={`inline-flex h-11 w-11 items-center justify-center rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green ${controlTone}`}
              aria-label="Toggle menu"
              aria-expanded={isMobileMenuOpen}
              aria-controls={mobileMenuId}
              onClick={() => setIsMobileMenuOpen((isOpen) => !isOpen)}
            >
              <MenuIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>
      {mobileMenu}
    </>
  );
};

import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePWAInstallPrompt } from '../../hooks/usePWAInstallPrompt';
import { usePublicHomePath } from '../../src/utils/authHints';
import { RoutePath } from '../../types';

type IconProps = {
  className?: string;
};

type PublicHeaderProps = {
  isLandingRoute?: boolean;
};

type PublicMenuItem = {
  label: string;
  href: RoutePath;
};

type PublicMobileMenuItem = PublicMenuItem & {
  icon: React.FC<IconProps>;
};

type ThemeModeButtonProps = {
  isDarkMode: boolean;
  onToggle: () => void;
  className: string;
};

const publicInfoNavItems = [
  { label: 'FAQ', href: RoutePath.FAQ },
  { label: 'About', href: RoutePath.ABOUT },
  { label: 'Privacy', href: RoutePath.PRIVACY },
] satisfies PublicMenuItem[];

const PUBLIC_THEME_STORAGE_KEY = 'reflections-theme';

const getInitialDarkMode = () =>
  typeof document !== 'undefined'
    ? localStorage.getItem(PUBLIC_THEME_STORAGE_KEY) === 'dark' ||
      document.documentElement.classList.contains('dark')
    : false;

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

const ChevronRightIcon: React.FC<IconProps> = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none">
    <path
      d="m9 6 6 6-6 6"
      stroke="currentColor"
      strokeWidth="2.1"
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

const HomeLineIcon: React.FC<IconProps> = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none">
    <path
      d="M4.8 11.2 12 5.1l7.2 6.1v7.2a1.6 1.6 0 0 1-1.6 1.6h-3.1v-5.3h-5V20H6.4a1.6 1.6 0 0 1-1.6-1.6v-7.2Z"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const HelpBubbleIcon: React.FC<IconProps> = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none">
    <path
      d="M7.1 18.4 4.8 20l.6-3.1A7.9 7.9 0 1 1 7.1 18.4Z"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9.6 9.2a2.7 2.7 0 0 1 5.1 1.3c0 1.8-1.9 2.2-2.4 3.2M12.2 16.5h.01"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const HeartLineIcon: React.FC<IconProps> = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none">
    <path
      d="M12 19.2c-.4 0-.8-.14-1.1-.42C6.6 15.1 4 12.7 4 9.7A3.9 3.9 0 0 1 7.9 5.8c1.5 0 2.9.8 3.6 2 .7-1.2 2.1-2 3.6-2A3.9 3.9 0 0 1 19 9.7c0 3-2.6 5.4-6.9 9.08-.3.28-.7.42-1.1.42Z"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ShieldLeafIcon: React.FC<IconProps> = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none">
    <path
      d="M12 3.8 18.6 6v5.1c0 4.2-2.6 7.5-6.6 9.1-4-1.6-6.6-4.9-6.6-9.1V6L12 3.8Z"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9.3 12.6c2.5-.2 4-1.4 4.7-3.6 1.1 2.9-.1 5.4-3.6 6.2"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ThemeModeButton: React.FC<ThemeModeButtonProps> = ({
  isDarkMode,
  onToggle,
  className,
}) => {
  const Icon = isDarkMode ? SunIcon : MoonIcon;

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
  const navigate = useNavigate();
  const homeHref = usePublicHomePath();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(getInitialDarkMode);
  const { canInstall, isInstalled, triggerInstall } = usePWAInstallPrompt();
  const mobileMenuId = useId();
  const mobileMenuTitleId = useId();
  const mobileMenuDescriptionId = useId();
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const mobileMenuPanelRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const publicNavItems = [
    { label: 'Home', href: homeHref },
    ...publicInfoNavItems,
  ] satisfies PublicMenuItem[];

  const mobileMenuItems = [
    { label: 'Home', href: RoutePath.HOME, icon: HomeLineIcon },
    { label: 'FAQ', href: RoutePath.FAQ, icon: HelpBubbleIcon },
    { label: 'About', href: RoutePath.ABOUT, icon: HeartLineIcon },
    { label: 'Privacy', href: RoutePath.PRIVACY, icon: ShieldLeafIcon },
  ] satisfies PublicMobileMenuItem[];

  const mobileCompactAction = {
    label: 'Begin writing',
    href: RoutePath.SIGNUP,
  } satisfies PublicMenuItem;
  const shouldShowSecondarySignIn = !isLandingRoute;
  const shouldShowInstallAction = canInstall && !isInstalled;
  const shouldShowMobileMenuFooter = shouldShowInstallAction || shouldShowSecondarySignIn;

  const isPublicRouteActive = (href: RoutePath) =>
    href === RoutePath.HOME ? location.pathname === RoutePath.HOME : location.pathname === href;

  useEffect(() => {
    setIsMobileMenuOpen(false);
    document.body.classList.remove('no-scroll');
  }, [location.pathname]);

  useEffect(() => () => {
    document.body.classList.remove('no-scroll');
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem(PUBLIC_THEME_STORAGE_KEY, isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return;
    }

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : menuButtonRef.current;

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };

    const focusTimer = window.setTimeout(() => closeButtonRef.current?.focus(), 40);

    document.body.classList.add('no-scroll');
    window.addEventListener('keydown', handleEscapeKey);

    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleEscapeKey);
      document.body.classList.remove('no-scroll');

      const focusTarget = previousFocusRef.current ?? menuButtonRef.current;
      if (focusTarget && document.contains(focusTarget)) {
        focusTarget.focus();
      }
    };
  }, [isMobileMenuOpen]);

  const toggleDarkMode = () => {
    setIsDarkMode((currentMode) => !currentMode);
  };

  const handleAppRouteNavigation = (event: React.MouseEvent<HTMLAnchorElement>, href: RoutePath) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.altKey ||
      event.ctrlKey ||
      event.shiftKey
    ) {
      return;
    }

    event.preventDefault();
    setIsMobileMenuOpen(false);
    navigate(href);
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
    ? 'text-gray-text hover:bg-white/20 hover:text-green'
    : 'text-gray-nav hover:bg-green/5 hover:text-green';

  const mobileMenu = isMobileMenuOpen && typeof document !== 'undefined'
    ? createPortal(
        <div className="public-mobile-menu-root fixed inset-0 z-[105] overflow-hidden lg:hidden">
          <div
            className="public-mobile-menu-overlay absolute inset-0"
            aria-hidden="true"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="public-mobile-menu-positioner fixed inset-x-0 bottom-0 z-[110] flex justify-center px-3">
            <section
              ref={mobileMenuPanelRef}
              id={mobileMenuId}
              role="dialog"
              aria-modal="true"
              aria-labelledby={mobileMenuTitleId}
              aria-describedby={mobileMenuDescriptionId}
              className="public-mobile-menu public-mobile-menu-sheet w-full max-w-[420px]"
              onKeyDown={handleMobileMenuKeyDown}
            >
              <div className="public-mobile-menu-handle" aria-hidden="true" />
              <div className="public-mobile-menu-header">
                <div>
                  <h2 id={mobileMenuTitleId} className="public-mobile-menu-title">
                    Reflections
                  </h2>
                  <p className="public-mobile-menu-subtitle">Explore the journal.</p>
                </div>
                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="public-mobile-menu-close"
                  aria-label="Close menu"
                >
                  <CloseIcon className="h-5 w-5" />
                </button>
              </div>
              <p id={mobileMenuDescriptionId} className="sr-only">
                Use this menu to explore public Reflections pages and close it when you are ready to return to the page.
              </p>

              <nav aria-label="Mobile public navigation" className="public-mobile-menu-list">
                {mobileMenuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = isPublicRouteActive(item.href);

                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={(event) => handleAppRouteNavigation(event, item.href)}
                      className="public-mobile-menu-link"
                      data-active={isActive ? 'true' : undefined}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <span className="public-mobile-menu-link-leading">
                        <span className="public-mobile-menu-link-icon">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span>{item.label}</span>
                      </span>
                      <ChevronRightIcon className="public-mobile-menu-link-chevron h-4 w-4" />
                    </a>
                  );
                })}
              </nav>

              <div className="public-mobile-menu-compact">
                <a
                  href={mobileCompactAction.href}
                  onClick={(event) => handleAppRouteNavigation(event, mobileCompactAction.href)}
                  className="public-mobile-menu-compact-action"
                >
                  <span>{mobileCompactAction.label}</span>
                  <ChevronRightIcon className="h-4 w-4" />
                </a>
              </div>

              {shouldShowMobileMenuFooter && (
                <div className="public-mobile-menu-secondary-actions">
                  {shouldShowInstallAction && (
                    <button
                      type="button"
                      onClick={async () => {
                        await triggerInstall();
                        setIsMobileMenuOpen(false);
                      }}
                      aria-label="Add Reflections to your home screen"
                      className="public-mobile-menu-secondary-action"
                    >
                      <span>Install app</span>
                    </button>
                  )}
                  {shouldShowSecondarySignIn && (
                    <a
                      href={RoutePath.LOGIN}
                      onClick={(event) => handleAppRouteNavigation(event, RoutePath.LOGIN)}
                      className="public-mobile-menu-footer-link"
                    >
                      <span>Already writing?</span>
                      <span>Sign in</span>
                    </a>
                  )}
                </div>
              )}
            </section>
          </div>
        </div>,
        document.body,
      )
    : null;

  return (
    <>
      <header className={`public-header ${isLandingRoute ? 'public-header--landing landing-nav-scrim' : 'public-header--standard'}`}>
        <div className="mx-auto flex h-14 w-full max-w-[1440px] items-center justify-between gap-2.5 px-4 md:px-8 xl:px-10">
          <a
            href={homeHref}
            onClick={(event) => handleAppRouteNavigation(event, homeHref)}
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
              const isActive = isPublicRouteActive(item.href);

              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={(event) => handleAppRouteNavigation(event, item.href)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`inline-flex min-h-11 items-center rounded-xl border px-3 py-2 text-[12px] font-extrabold transition-colors duration-200 hover:border-green/20 hover:bg-green/5 hover:text-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-1 xl:px-4 xl:text-[13px] ${
                    isActive ? 'border-green/20 bg-green/[0.025] text-green' : 'border-transparent text-gray-nav'
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
            <span className="mx-2 h-6 w-px bg-border" aria-hidden="true" />
            <a
              href={RoutePath.LOGIN}
              onClick={(event) => handleAppRouteNavigation(event, RoutePath.LOGIN)}
              className="inline-flex min-h-11 items-center rounded-xl px-3 py-2 text-[13px] font-extrabold text-gray-nav transition-colors hover:bg-green/5 hover:text-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green"
            >
              Sign in
            </a>
            <a
              href={RoutePath.SIGNUP}
              onClick={(event) => handleAppRouteNavigation(event, RoutePath.SIGNUP)}
              className="inline-flex min-h-11 items-center rounded-xl bg-green px-4 py-2 text-[13px] font-extrabold text-white shadow-sm shadow-green/10 transition-colors hover:bg-green-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2"
            >
              Sign up
            </a>
          </nav>

          <div className="flex shrink-0 items-center gap-1.5 lg:hidden">
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

import React, { useEffect, useId, useRef, useState } from 'react';
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

const LeafIcon: React.FC<IconProps> = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none">
    <path
      d="M18.8 4.2C11.4 4.6 6.6 8.7 6 15.8c6.9-.4 11.8-4.6 12.8-11.6Z"
      fill="currentColor"
      opacity="0.95"
    />
    <path
      d="M6 15.8c2.9-3.7 5.9-5.8 9.8-7.4M6 15.8c-.9 1.4-1.2 2.7-1.2 4"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
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

export const PublicHeader: React.FC<PublicHeaderProps> = ({ isLandingRoute = false }) => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuId = useId();
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };

    const focusTimer = window.setTimeout(() => closeButtonRef.current?.focus(), 40);

    document.documentElement.classList.add('no-scroll');
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
      document.documentElement.classList.remove('no-scroll');
    };
  }, [isMobileMenuOpen]);

  const controlTone = isLandingRoute
    ? 'text-gray-text hover:bg-white/20 hover:text-green'
    : 'text-gray-nav hover:bg-green/5 hover:text-green';

  return (
    <header className={`public-header ${isLandingRoute ? 'public-header--landing landing-nav-scrim' : 'public-header--standard'}`}>
      <div className="mx-auto flex h-14 w-full max-w-[1440px] items-center justify-between gap-3 px-4 md:px-8 xl:px-10">
        <a
          href={RoutePath.HOME}
          className="group flex min-h-11 min-w-0 items-center gap-2"
          aria-label="Reflections - go to home"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green text-white shadow-sm transition-transform duration-300 group-hover:-rotate-12 group-hover:scale-105">
            <LeafIcon className="h-6 w-6" />
          </span>
          <span className="max-w-[150px] truncate font-serif text-[22px] italic tracking-normal text-green sm:max-w-none sm:text-[26px]">
            Reflections
          </span>
        </a>

        <nav aria-label="Public navigation" className="hidden items-center gap-1.5 lg:flex xl:gap-2">
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

        <button
          type="button"
          className={`inline-flex h-11 w-11 items-center justify-center rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green lg:hidden ${controlTone}`}
          aria-label="Toggle menu"
          aria-expanded={isMobileMenuOpen}
          aria-controls={mobileMenuId}
          onClick={() => setIsMobileMenuOpen((isOpen) => !isOpen)}
        >
          <MenuIcon className="h-6 w-6" />
        </button>
      </div>

      {isMobileMenuOpen ? (
        <div className="lg:hidden">
          <button
            type="button"
            className="public-mobile-menu-scrim fixed inset-0 z-[105]"
            aria-label="Close navigation backdrop"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <aside
            id={mobileMenuId}
            className="public-mobile-menu mobile-sidebar-shell fixed bottom-0 right-0 top-0 z-[110] h-[100dvh]"
            style={{ width: 'min(86vw, 352px)' }}
            aria-label="Mobile public navigation"
          >
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
        </div>
      ) : null}
    </header>
  );
};

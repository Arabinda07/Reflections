import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate, useOutlet } from 'react-router-dom';

import { Link } from 'react-router-dom';
import { House } from '@phosphor-icons/react/House';
import { Notebook } from '@phosphor-icons/react/Notebook';
import { PencilSimpleLine } from '@phosphor-icons/react/PencilSimpleLine';
import { Question } from '@phosphor-icons/react/Question';
import { Sparkle } from '@phosphor-icons/react/Sparkle';
import { Heart } from '@phosphor-icons/react/Heart';
import { SignIn } from '@phosphor-icons/react/SignIn';
import { UserCircle } from '@phosphor-icons/react/UserCircle';
import { UserPlus } from '@phosphor-icons/react/UserPlus';
import { RoutePath } from '../types';
import { useAuthStore } from '../hooks/useAuthStore';
import { useUserMode } from '../context/UserModeContext';
import { useKeyboardShortcut } from '../src/hooks/useKeyboardShortcut';
import { referralService } from '../services/referralService';
import { useAndroidBackHandler } from '../src/native/useAndroidBackHandler';

import { useSurfaceScope } from './SurfaceScope';
import { NavigationBar } from './NavigationBar';
import type { SidebarNavItem } from './MobileSidebar';

const ModalSheet = React.lazy(() => import('../components/ui/ModalSheet').then(m => ({ default: m.ModalSheet })));
const ReferralInvitePanel = React.lazy(() => import('../components/ui/ReferralInvitePanel').then(m => ({ default: m.ReferralInvitePanel })));
const SyncBanner = React.lazy(() => import('../components/ui/SyncBanner').then(m => ({ default: m.SyncBanner })));
const MobileSidebar = React.lazy(() => import('./MobileSidebar').then(m => ({ default: m.MobileSidebar })));
const NoteSearchPalette = React.lazy(() => import('../components/ui/NoteSearchPalette').then(m => ({ default: m.NoteSearchPalette })));
const BugReportFlow = React.lazy(() => import('./BugReportFlow').then(m => ({ default: m.BugReportFlow })));
const AuthenticatedMobileNav = React.lazy(() => import('./AuthenticatedMobileNav').then(m => ({ default: m.AuthenticatedMobileNav })));

const GUEST_NAV_ITEMS: SidebarNavItem[] = [
  { label: 'Homepage', path: RoutePath.HOME, icon: House, description: 'Start from the opening page.' },
  { label: 'FAQ', path: RoutePath.FAQ, icon: Question, description: 'Answers about privacy, writing, and care.' },
];

const AUTH_NAV_ITEMS: SidebarNavItem[] = [
  { label: 'My notes', path: RoutePath.NOTES, icon: Notebook, description: 'Return to your saved reflections.' },
  { label: 'Create note', path: RoutePath.CREATE_NOTE, icon: PencilSimpleLine, description: 'Open a fresh writing surface.' },
  { label: 'Insights', path: RoutePath.INSIGHTS, icon: Sparkle, description: 'See patterns drawn from your writing.', requireMode: 'reflective' },
  { label: 'Relationships', path: RoutePath.RELATIONSHIPS, icon: Heart, description: 'Tend people, hooks, and weekly care.' },
  { label: 'Account', path: RoutePath.ACCOUNT, icon: UserCircle, description: 'Manage your profile and plan.' },
  { label: 'FAQ', path: RoutePath.FAQ, icon: Question, description: 'Read how Reflections works.' },
];

const GUEST_SIDEBAR_NAV_ITEMS: SidebarNavItem[] = [
  ...GUEST_NAV_ITEMS,
  { label: 'Sign In', path: RoutePath.LOGIN, icon: SignIn, description: 'Enter your private journal.' },
  { label: 'Sign Up', path: RoutePath.SIGNUP, icon: UserPlus, description: 'Create a writing space.' },
];

const footerLinkClass =
  'inline-flex min-h-11 min-w-11 items-center justify-center text-ui-xs font-black uppercase tracking-widest text-gray-nav transition-colors hover:text-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2';

export const DashboardLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const outlet = useOutlet();
  const { isAuthenticated } = useAuthStore();
  const { userMode } = useUserMode();
  const routeSurfaceScopeClass = useSurfaceScope();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isBugReportOpen, setIsBugReportOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useAndroidBackHandler();

  // Keyboard shortcut: Ctrl/Cmd + N → new reflection
  useKeyboardShortcut(
    { key: 'n', ctrlOrCmd: true },
    (e) => {
      e.preventDefault();
      navigate(RoutePath.CREATE_NOTE);
    },
    [navigate],
  );

  // Keyboard shortcut: Ctrl/Cmd + K → search notes (signed-in only)
  useKeyboardShortcut(
    { key: 'k', ctrlOrCmd: true },
    (e) => {
      e.preventDefault();
      if (isAuthenticated) setIsSearchOpen(true);
    },
    [isAuthenticated],
  );

  // Capture referral codes from URL params
  useEffect(() => {
    referralService.captureReferralCode(location.search);
  }, [location.search]);

  // Scroll the main content container to the top on route change.
  // React Router's <ScrollRestoration /> targets window.scrollTo(), which has
  // no effect because #main-content (overflow-y-auto) is the actual scroller.
  useEffect(() => {
    document.getElementById('main-content')?.scrollTo(0, 0);
  }, [location.pathname]);

  // Derived route flags
  const isNoteEditRoute =
    location.pathname.startsWith(`${RoutePath.NOTES}/`) && location.pathname.endsWith('/edit');

  const isWritingRoute =
    location.pathname === RoutePath.CREATE_NOTE ||
    isNoteEditRoute;

  const isMobileNavSuppressedRoute =
    location.pathname === RoutePath.INSIGHTS ||
    location.pathname.startsWith(RoutePath.SANCTUARY);

  const shouldShowAuthenticatedMobileNav = isAuthenticated && !isWritingRoute;
  const isLandingRoute = location.pathname === RoutePath.HOME && !isAuthenticated;
  const routeTransitionClass = isWritingRoute ? '' : 'animate-in fade-in duration-300 ease-out-expo';
  const homePath = isAuthenticated ? RoutePath.DASHBOARD : RoutePath.HOME;

  const navItems = isAuthenticated ? AUTH_NAV_ITEMS.filter(i => !i.requireMode || i.requireMode === userMode) : GUEST_NAV_ITEMS;
  const sidebarNavItems = isAuthenticated ? AUTH_NAV_ITEMS.filter(i => !i.requireMode || i.requireMode === userMode) : GUEST_SIDEBAR_NAV_ITEMS;

  return (
    <div
      className={`${routeSurfaceScopeClass} page-wash app-shell--fixed-scroll relative flex h-[100dvh] min-h-[100dvh] flex-col overflow-hidden bg-body font-sans selection:bg-green/30 selection:text-green`}
    >
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>

      {/* Navigation Bar — hidden on writing routes */}
      {!isWritingRoute && (
        <NavigationBar
          navItems={navItems}
          isLandingRoute={isLandingRoute}
          isMobileNavSuppressed={isAuthenticated ? true : isMobileNavSuppressedRoute}
          isMobileMenuOpen={isMobileMenuOpen}
          onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          onInvite={() => setIsInviteModalOpen(true)}
          onSearch={isAuthenticated ? () => setIsSearchOpen(true) : undefined}
        />
      )}

      {/* Mobile Sidebar */}
      {!isAuthenticated && (
        <React.Suspense fallback={null}>
          <MobileSidebar
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
            navItems={sidebarNavItems}
            onBugReport={() => {
              setIsMobileMenuOpen(false);
              setIsBugReportOpen(true);
            }}
            onInvite={() => setIsInviteModalOpen(true)}
          />
        </React.Suspense>
      )}

      {/* Main Content — sole scroll container in the shell */}
      <main
        id="main-content"
        tabIndex={-1}
        className={`relative flex min-h-0 w-full flex-1 flex-col overflow-y-auto custom-scrollbar ${shouldShowAuthenticatedMobileNav ? 'auth-mobile-scroll-space' : ''}`.trim()}
      >
        <React.Suspense fallback={null}>
          <SyncBanner />
        </React.Suspense>
        <div className="w-full flex-1 flex flex-col">
          <div
            key={location.pathname}
            className={`flex-1 flex flex-col w-full ${routeTransitionClass}`.trim()}
          >
            {outlet}
          </div>
        </div>

        {/* Global Footer - Positioned for full-width background with centered content */}
        {!isWritingRoute && (
          <footer className="screen-scrim screen-scrim--strong mt-auto w-full border-t border-border py-12 transition-colors duration-300">
            <div className="max-w-[1440px] mx-auto px-6 md:px-16 flex flex-col sm:flex-row items-center justify-between gap-8">
              <nav
                aria-label="Footer navigation"
                className="flex flex-wrap items-center justify-center gap-x-6 gap-y-4 sm:gap-10"
              >
                <Link to={homePath} className={footerLinkClass}>
                  Home
                </Link>
                <Link to={RoutePath.FAQ} className={footerLinkClass}>
                  FAQ
                </Link>
                <Link to={RoutePath.ABOUT} className={footerLinkClass}>
                  About
                </Link>
                <Link to={RoutePath.PRIVACY} className={footerLinkClass}>
                  Privacy
                </Link>
              </nav>

              <div className="text-ui-xs font-black uppercase tracking-widest text-gray-nav/60">
                © 2026{' '}
                <a
                  href="https://arabinda07.github.io/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center transition-colors duration-300 hover:text-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2"
                  aria-label="Arabinda's portfolio (opens in new tab)"
                >
                  Arabinda
                </a>
              </div>
            </div>
          </footer>
        )}
      </main>

      {shouldShowAuthenticatedMobileNav && (
        <React.Suspense fallback={null}>
          <AuthenticatedMobileNav
            onBugReport={() => setIsBugReportOpen(true)}
            onInvite={() => setIsInviteModalOpen(true)}
          />
        </React.Suspense>
      )}

      {/* Bug Report Flow — self-contained with floating trigger + modal */}
      {!isWritingRoute && (
        <React.Suspense fallback={null}>
          <BugReportFlow isOpen={isBugReportOpen} onOpenChange={setIsBugReportOpen} />
        </React.Suspense>
      )}

      {/* Invite Modal */}
      <React.Suspense fallback={null}>
        <ModalSheet
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          title="Invite someone"
          description="Share Reflections with someone who might want a space to write."
          tone="paper"
          size="md"
          panelClassName="modal-sheet-panel--compact"
          bodyClassName="modal-sheet-body--compact"
        >
          <ReferralInvitePanel compact />
        </ModalSheet>
      </React.Suspense>

      {/* Note search palette (⌘K) */}
      {isAuthenticated && (
        <React.Suspense fallback={null}>
          <NoteSearchPalette isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        </React.Suspense>
      )}
    </div>
  );
};

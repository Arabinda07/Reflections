import React, { useEffect, useId, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Book } from '@phosphor-icons/react/Book';
import { Bug } from '@phosphor-icons/react/Bug';
import { CaretRight } from '@phosphor-icons/react/CaretRight';
import { DotsThreeVertical } from '@phosphor-icons/react/DotsThreeVertical';
import { DownloadSimple } from '@phosphor-icons/react/DownloadSimple';
import { EnvelopeSimple } from '@phosphor-icons/react/EnvelopeSimple';
import { House } from '@phosphor-icons/react/House';
import { Heart } from '@phosphor-icons/react/Heart';
import { Notebook } from '@phosphor-icons/react/Notebook';
import { PaperPlaneTilt } from '@phosphor-icons/react/PaperPlaneTilt';
import { PencilSimpleLine } from '@phosphor-icons/react/PencilSimpleLine';
import { Question } from '@phosphor-icons/react/Question';
import { SignOut } from '@phosphor-icons/react/SignOut';
import { Sparkle } from '@phosphor-icons/react/Sparkle';
import { UserCircle } from '@phosphor-icons/react/UserCircle';

import { ModalSheet } from '../components/ui/ModalSheet';
import { usePWAInstall } from '../context/PWAInstallContext';
import { useAuthStore } from '../hooks/useAuthStore';
import { RoutePath } from '../types';

interface MobileTabItem {
  label: 'Home' | 'Write' | 'Notes' | 'More';
  path?: RoutePath;
  icon: React.ElementType;
  matches: (pathname: string) => boolean;
}

interface MoreNavItem {
  label: string;
  path: RoutePath;
  icon: React.ElementType;
  aliases?: RoutePath[];
}

interface MoreNavGroup {
  label: string;
  items: MoreNavItem[];
}

interface AuthenticatedMobileNavProps {
  onBugReport: () => void;
  onInvite: () => void;
}

const isNoteEditRoute = (pathname: string) =>
  pathname.startsWith(`${RoutePath.NOTES}/`) && pathname.endsWith('/edit');

const isNoteRoute = (pathname: string) =>
  pathname === RoutePath.NOTES ||
  (pathname.startsWith(`${RoutePath.NOTES}/`) &&
    pathname !== RoutePath.CREATE_NOTE &&
    !isNoteEditRoute(pathname));

const isMoreRoute = (pathname: string) =>
  pathname === RoutePath.INSIGHTS ||
  pathname === RoutePath.FUTURE_LETTERS ||
  pathname === RoutePath.RELATIONSHIPS ||
  pathname.startsWith(`${RoutePath.RELATIONSHIPS}/`) ||
  pathname === RoutePath.ACCOUNT ||
  pathname === RoutePath.FAQ ||
  pathname === RoutePath.WIKI ||
  pathname === RoutePath.SANCTUARY ||
  pathname.startsWith(`${RoutePath.SANCTUARY}/`);

export const AUTHENTICATED_MOBILE_TABS: MobileTabItem[] = [
  {
    label: 'Home',
    path: RoutePath.DASHBOARD,
    icon: House,
    matches: (pathname) =>
      pathname === RoutePath.DASHBOARD || pathname === RoutePath.DASHBOARD_ALIAS,
  },
  {
    label: 'Write',
    path: RoutePath.CREATE_NOTE,
    icon: PencilSimpleLine,
    matches: (pathname) => pathname === RoutePath.CREATE_NOTE || isNoteEditRoute(pathname),
  },
  {
    label: 'Notes',
    path: RoutePath.NOTES,
    icon: Notebook,
    matches: isNoteRoute,
  },
  {
    label: 'More',
    icon: DotsThreeVertical,
    matches: isMoreRoute,
  },
];

export const MORE_NAV_GROUPS: MoreNavGroup[] = [
  {
    label: 'Reflect',
    items: [
      { label: 'Insights', path: RoutePath.INSIGHTS, icon: Sparkle },
      { label: 'Relationships', path: RoutePath.RELATIONSHIPS, icon: Heart },
      { label: 'Future Letters', path: RoutePath.FUTURE_LETTERS, icon: EnvelopeSimple },
      {
        label: 'Life Wiki',
        path: RoutePath.SANCTUARY,
        icon: Book,
        aliases: [RoutePath.WIKI, RoutePath.SANCTUARY_ARTICLE],
      },
    ],
  },
  {
    label: 'Account',
    items: [
      { label: 'Account', path: RoutePath.ACCOUNT, icon: UserCircle },
      { label: 'Help', path: RoutePath.FAQ, icon: Question },
    ],
  },
];

const isMoreNavItemActive = (item: MoreNavItem, pathname: string) =>
  pathname === item.path ||
  item.aliases?.some((alias) => {
    if (alias === RoutePath.SANCTUARY_ARTICLE) {
      return pathname.startsWith(`${RoutePath.SANCTUARY}/`);
    }

    return pathname === alias;
  });

const tabBaseClass =
  'auth-mobile-tab relative flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 overflow-hidden rounded-[0.875rem] px-2 py-1 text-[12px] font-bold leading-none transition-[background-color,border-color,color,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2';

const moreLinkClass =
  'auth-mobile-more-link flex min-h-11 w-full items-center justify-between gap-3 rounded-[0.9rem] border border-transparent px-2.5 py-1.5 text-left text-[14px] font-bold text-gray-text transition-colors hover:border-green/15 hover:bg-green/5 hover:text-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2';

const neutralIconTileClass =
  'auth-mobile-more-icon-tile flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.8rem] bg-green/10 text-green';

const signOutIconTileClass =
  'auth-mobile-more-icon-tile auth-mobile-more-icon-tile--danger flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.8rem] bg-clay/10 text-clay';

const prefetchCreateNoteRoute = () => {
  void import('@/pages/dashboard/CreateNote');
};

export const AuthenticatedMobileNav: React.FC<AuthenticatedMobileNavProps> = ({
  onBugReport,
  onInvite,
}) => {
  const location = useLocation();
  const { logout } = useAuthStore();
  const { canInstall, isInstalled, triggerInstall } = usePWAInstall();

  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const moreSheetId = useId();

  const closeMore = () => setIsMoreOpen(false);

  useEffect(() => {
    setIsMoreOpen(false);
  }, [location.pathname]);

  const handleInvite = () => {
    closeMore();
    onInvite();
  };

  const handleBugReport = () => {
    closeMore();
    onBugReport();
  };

  const handleInstall = async () => {
    await triggerInstall();
    closeMore();
  };

  const handleSignOut = () => {
    logout();
    closeMore();
  };

  return (
    <>
      <nav
        aria-label="Signed-in mobile navigation"
        className="auth-mobile-bottom-nav fixed inset-x-0 bottom-0 z-[95] px-3 pb-[calc(0.45rem+env(safe-area-inset-bottom))] lg:hidden"
      >
        <div className="mx-auto flex min-h-[3.625rem] max-w-[23rem] items-center gap-1 rounded-[1.45rem] border border-border/70 bg-surface/95 p-1 shadow-[0_-10px_28px_-24px_oklch(from_var(--green-shadow)_l_c_h_/_0.28)] backdrop-blur-sm">
          {AUTHENTICATED_MOBILE_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.matches(location.pathname);
            const tabClass = `${tabBaseClass} ${
              isActive
                ? 'text-green'
                : 'text-gray-nav hover:bg-green/5 hover:text-green'
            }`;

            if (tab.label === 'More') {
              return (
                <button
                  key={tab.label}
                  type="button"
                  className={tabClass}
                  data-active={isActive ? 'true' : undefined}
                  aria-current={isActive ? 'page' : undefined}
                  aria-label="Open more navigation"
                  aria-haspopup="dialog"
                  aria-expanded={isMoreOpen}
                  aria-controls={moreSheetId}
                  onClick={() => setIsMoreOpen(true)}
                >
                  <Icon size={22} weight={isActive ? 'fill' : 'regular'} aria-hidden="true" />
                  <span className="auth-mobile-tab-label">{tab.label}</span>
                </button>
              );
            }

            return (
              <Link
                key={tab.label}
                to={tab.path ?? RoutePath.DASHBOARD}
                onPointerEnter={tab.path === RoutePath.CREATE_NOTE ? prefetchCreateNoteRoute : undefined}
                onFocus={tab.path === RoutePath.CREATE_NOTE ? prefetchCreateNoteRoute : undefined}
                className={tabClass}
                data-active={isActive ? 'true' : undefined}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon size={22} weight={isActive ? 'fill' : 'regular'} aria-hidden="true" />
                <span className="auth-mobile-tab-label">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <ModalSheet
        isOpen={isMoreOpen}
        onClose={closeMore}
        title="Navigation"
        size="sm"
        mobilePlacement="bottom"
        closeLabel="Close more navigation"
        backdropClassName="auth-mobile-more-backdrop"
        bodyClassName="auth-mobile-more-sheet-body"
        panelClassName="auth-mobile-more-sheet-panel"
        panelId={moreSheetId}
      >
        <div className="auth-mobile-more-sheet-content space-y-3">
          <nav aria-label="More navigation" className="space-y-3">
            {MORE_NAV_GROUPS.map((group, groupIndex) => (
              <section
                key={group.label}
                className={`space-y-1.5 ${groupIndex > 0 ? 'border-t border-border/60 pt-3' : ''}`.trim()}
              >
                <h3 className="px-1 text-[10px] font-black uppercase tracking-[0.16em] text-gray-nav">
                  {group.label}
                </h3>
                <div className="space-y-1">
                  {group.items.map((item, itemIndex) => {
                    const Icon = item.icon;
                    const isActive = isMoreNavItemActive(item, location.pathname);

                    return (
                      <Link
                        key={item.label}
                        to={item.path}
                        onClick={closeMore}
                        data-autofocus={groupIndex === 0 && itemIndex === 0 ? 'true' : undefined}
                        data-active={isActive ? 'true' : undefined}
                        aria-current={isActive ? 'page' : undefined}
                        className={moreLinkClass}
                      >
                        <span className="auth-mobile-more-link-content">
                          <span className={neutralIconTileClass}>
                            <Icon size={19} weight={isActive ? 'fill' : 'regular'} aria-hidden="true" />
                          </span>
                          <span>{item.label}</span>
                        </span>
                        <CaretRight
                          size={16}
                          weight="bold"
                          aria-hidden="true"
                          className="auth-mobile-more-link-chevron"
                        />
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))}
          </nav>

          <section
            aria-label="Share actions"
            className="auth-mobile-more-actions space-y-1.5 border-t border-border/60 pt-3"
          >
            <h3 className="px-1 text-[10px] font-black uppercase tracking-[0.16em] text-gray-nav">
              Share
            </h3>
            <div className="space-y-1">
              <button type="button" onClick={handleInvite} className={moreLinkClass}>
                <span className="auth-mobile-more-link-content">
                  <span className={neutralIconTileClass}>
                    <PaperPlaneTilt size={19} weight="regular" aria-hidden="true" />
                  </span>
                  <span>Invite</span>
                </span>
              </button>

              <button type="button" onClick={handleBugReport} className={moreLinkClass}>
                <span className="auth-mobile-more-link-content">
                  <span className={neutralIconTileClass}>
                    <Bug size={18} weight="regular" aria-hidden="true" />
                  </span>
                  <span>Report a bug</span>
                </span>
              </button>

              {canInstall && !isInstalled ? (
                <button type="button" onClick={handleInstall} className={moreLinkClass}>
                  <span className="auth-mobile-more-link-content">
                    <span className={neutralIconTileClass}>
                      <DownloadSimple size={18} weight="regular" aria-hidden="true" />
                    </span>
                    <span>Install app</span>
                  </span>
                </button>
              ) : null}
            </div>
          </section>

          <section
            aria-label="Session"
            className="auth-mobile-more-session space-y-1.5 border-t border-border/70 pt-3"
          >
            <div className="space-y-1">
              <button
                type="button"
                onClick={handleSignOut}
                className={`${moreLinkClass} auth-mobile-more-signout text-clay hover:border-clay/20 hover:bg-clay/5 hover:text-clay`}
              >
                <span className="auth-mobile-more-link-content">
                  <span className={signOutIconTileClass}>
                    <SignOut size={19} weight="regular" aria-hidden="true" />
                  </span>
                  <span>Sign out</span>
                </span>
              </button>
            </div>
          </section>
        </div>
      </ModalSheet>
    </>
  );
};

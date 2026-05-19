import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

describe('signed-in mobile navigation contract', () => {
  it('uses hybrid bottom tabs plus a More sheet for authenticated mobile routes', () => {
    const layout = read('layouts/DashboardLayout.tsx');
    const mobileNav = read('layouts/AuthenticatedMobileNav.tsx');

    expect(layout).toContain('AuthenticatedMobileNav');
    expect(layout).toContain('shouldShowAuthenticatedMobileNav');
    expect(layout).toContain('isAuthenticated ? true : isMobileNavSuppressedRoute');
    expect(layout).toContain('!isAuthenticated && (');

    expect(mobileNav).toContain('aria-label="Signed-in mobile navigation"');
    expect(mobileNav).toContain('AUTHENTICATED_MOBILE_TABS');
    expect(mobileNav).toContain("label: 'Home'");
    expect(mobileNav).toContain("label: 'Write'");
    expect(mobileNav).toContain("label: 'Notes'");
    expect(mobileNav).toContain("label: 'More'");
    expect(mobileNav).toContain('auth-mobile-tab-label');
    expect(mobileNav).toContain('RoutePath.DASHBOARD');
    expect(mobileNav).toContain('RoutePath.CREATE_NOTE');
    expect(mobileNav).toContain('RoutePath.NOTES');
    expect(mobileNav).toContain("aria-current={isActive ? 'page' : undefined}");
    expect(mobileNav).toContain('aria-label="Open more navigation"');
    expect(mobileNav).toContain('aria-haspopup="dialog"');
    expect(mobileNav).toContain('aria-expanded={isMoreOpen}');
    expect(mobileNav).toContain('aria-controls={moreSheetId}');
    expect(mobileNav).not.toContain('<span>{tab.label}</span>');
    expect(mobileNav).toContain('<span className="auth-mobile-tab-label">{tab.label}</span>');
    expect(mobileNav).toContain('title="Navigation"');
    expect(mobileNav).not.toContain('title="More"');
    expect(mobileNav).not.toContain('More places inside Reflections.');
    expect(mobileNav).not.toContain('description=');
    expect(mobileNav).toContain('mobilePlacement="bottom"');
    expect(mobileNav).toContain('panelId={moreSheetId}');
    expect(mobileNav).toContain('data-autofocus');
    expect(mobileNav).toContain('useEffect(() =>');
    expect(mobileNav).toContain('[location.pathname]');
  });

  it('puts only distinct secondary routes plus account/support actions in More', () => {
    const layout = read('layouts/DashboardLayout.tsx');
    const mobileNav = read('layouts/AuthenticatedMobileNav.tsx');

    expect(mobileNav).toContain('MORE_NAV_GROUPS');
    expect(mobileNav).toMatch(
      /label: 'Insights'[\s\S]*label: 'Future Letters'[\s\S]*label: 'Life Wiki'/,
    );
    expect(mobileNav).toContain('RoutePath.INSIGHTS');
    expect(mobileNav).toContain('RoutePath.SANCTUARY');
    expect(mobileNav).toContain('RoutePath.WIKI');
    expect(mobileNav).toContain('RoutePath.FUTURE_LETTERS');
    expect(mobileNav).not.toContain("label: 'Release Mode'");
    expect(mobileNav).not.toContain('path: RoutePath.RELEASE');
    expect(layout).toContain('location.pathname === RoutePath.RELEASE');
    expect(mobileNav).toContain("label: 'Account'");
    expect(mobileNav).not.toContain('Account / Settings');
    expect(mobileNav).not.toContain("label: 'Settings'");
    expect(mobileNav).toContain('RoutePath.ACCOUNT');
    expect(mobileNav).toContain("label: 'Help'");
    expect(mobileNav).toContain('RoutePath.FAQ');
    expect(mobileNav).toContain('onInvite');
    expect(mobileNav).toContain('logout()');
    expect(mobileNav).toContain('Sign out');
  });

  it('separates More sheet navigation from support and session actions', () => {
    const mobileNav = read('layouts/AuthenticatedMobileNav.tsx');

    expect(mobileNav).toContain('<nav aria-label="More navigation"');
    expect(mobileNav).toContain('aria-label="Share actions"');
    expect(mobileNav).toContain('auth-mobile-more-actions');
    expect(mobileNav).toContain('auth-mobile-more-session');
    expect(mobileNav).toContain('auth-mobile-more-signout');
    expect(mobileNav).toMatch(
      /auth-mobile-more-session[\s\S]*<button[\s\S]*type="button"[\s\S]*auth-mobile-more-signout/,
    );
    expect(mobileNav).toContain('data-active={isActive ? \'true\' : undefined}');
    expect(mobileNav).toContain("aria-current={isActive ? 'page' : undefined}");
    expect(mobileNav).toContain('const neutralIconTileClass');
    expect(mobileNav).toContain('auth-mobile-more-link-content');
    expect(mobileNav).toContain('auth-mobile-more-link-chevron');
    expect(mobileNav).toContain("import { CaretRight } from '@phosphor-icons/react/CaretRight';");
    expect(mobileNav).not.toContain('bg-honey/10 text-honey');
    expect(mobileNav).not.toContain('bg-sky/10 text-sky');
  });

  it('scopes the stronger sheet surface and backdrop to authenticated More', () => {
    const mobileNav = read('layouts/AuthenticatedMobileNav.tsx');
    const modalSheet = read('components/ui/ModalSheet.tsx');
    const css = read('index.css');

    expect(mobileNav).toContain('backdropClassName="auth-mobile-more-backdrop"');
    expect(mobileNav).not.toContain('icon={<DotsThreeCircle');
    expect(modalSheet).toContain('backdropClassName?: string');
    expect(modalSheet).toContain('panelId?: string');
    expect(modalSheet).toContain("backdropClassName = ''");
    expect(modalSheet).toContain('id={panelId}');
    expect(modalSheet).toContain('modal-sheet-backdrop ${backdropClassName}');
    expect(css).toContain('.auth-mobile-more-backdrop');
    expect(css).toContain('.surface-bezel-inner.modal-sheet-panel.auth-mobile-more-sheet-panel');
    expect(css).toContain('.auth-mobile-more-sheet-panel .modal-sheet-title');
    expect(css).toContain('.auth-mobile-more-link[data-active="true"]');
    expect(css).toContain('.auth-mobile-more-link-chevron');
    expect(css).toContain('.auth-mobile-more-sheet-body');
    expect(css).toContain('.auth-mobile-more-sheet-body::-webkit-scrollbar');
    expect(css).toMatch(/\.auth-mobile-more-sheet-body\s*{[\s\S]*scrollbar-width: none;/);
    expect(css).toContain('-webkit-overflow-scrolling: touch;');
    expect(css).toContain('env(safe-area-inset-bottom)');
    expect(css).toContain('--mobile-bottom-nav-height: 5.25rem;');
    expect(css).toContain('--mobile-bottom-nav-reserved-space');
    expect(css).toContain('scroll-padding-bottom: calc(var(--mobile-bottom-nav-reserved-space) + env(safe-area-inset-bottom));');
  });

  it('keeps ModalSheet dismissal and focus behavior available to More', () => {
    const modalSheet = read('components/ui/ModalSheet.tsx');

    expect(modalSheet).toContain("event.key === 'Escape'");
    expect(modalSheet).toContain("event.key === 'Tab'");
    expect(modalSheet).toContain('previousFocusRef.current?.focus()');
    expect(modalSheet).toContain('onClick={onClose}');
    expect(modalSheet).toContain('registerAndroidBackAction');
  });

  it('keeps writing routes distraction-free while letting note detail use Notes navigation', () => {
    const layout = read('layouts/DashboardLayout.tsx');

    expect(layout).toContain('const isNoteEditRoute');
    expect(layout).toContain('location.pathname === RoutePath.CREATE_NOTE');
    expect(layout).toContain('isNoteEditRoute');
    expect(layout).toContain('location.pathname === RoutePath.RELEASE');
    expect(layout).not.toContain("location.pathname.startsWith('/notes/') && location.pathname !== '/notes/'");
    expect(layout).toContain('auth-mobile-scroll-space');
  });

  it('uses page-owned back buttons for the intended mobile route flow', () => {
    const insights = read('pages/dashboard/Insights.tsx');
    const lifeWiki = read('pages/dashboard/LifeWiki.tsx');

    expect(insights).toContain('onClick={() => navigate(RoutePath.DASHBOARD)}');
    expect(lifeWiki).toContain('onClick={() => navigate(RoutePath.INSIGHTS)}');
    expect(lifeWiki).toContain('onClick={() => navigate(RoutePath.SANCTUARY)}');
  });
});

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

const cssBlock = (css: string, selector: string) => {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = css.match(new RegExp(`${escapedSelector}\\s*{[^}]*}`, 's'));

  return match?.[0] ?? '';
};

describe('public header regression fixes', () => {
  it('keeps the original app leaf mark without importing the icon vendor', () => {
    const header = read('components/ui/PublicHeader.tsx');

    expect(header).not.toContain('@phosphor-icons/react');
    expect(header).not.toContain('M18.8 4.2C11.4 4.6 6.6 8.7 6 15.8');
    expect(header).toContain(
      'M223.45,40.07a8,8,0,0,0-7.52-7.52C139.8,28.08,78.82,51,52.82,94',
    );
  });

  it('renders a public theme switcher in desktop, mobile header, and mobile menu', () => {
    const header = read('components/ui/PublicHeader.tsx');

    expect(header).toContain('const ThemeModeButton');
    expect(header).toContain("aria-label={isDarkMode ? 'Use light mode' : 'Use dark mode'}");
    expect(header).toContain("document.documentElement.classList.toggle('dark', isDarkMode)");
    expect(header).toContain("const PUBLIC_THEME_STORAGE_KEY = 'reflections-theme';");
    expect(header).toContain('public-theme-toggle public-theme-toggle--desktop');
    expect(header).toContain('public-theme-toggle public-theme-toggle--mobile-header');
    expect(header).toContain('public-theme-toggle public-theme-toggle--mobile-menu');
    expect(header).not.toContain('reflections.public-theme');
    expect(header).not.toContain('motion/');
  });

  it('keeps the active public nav item quieter than the primary signup action', () => {
    const header = read('components/ui/PublicHeader.tsx');
    const indexHtml = read('index.html');
    const activeCriticalRule = cssBlock(
      indexHtml,
      '.public-header nav[aria-label="Public navigation"] a[aria-current="page"]',
    );

    expect(header).toContain("isActive ? 'border-green/20 bg-green/[0.025] text-green'");
    expect(header).not.toContain("isActive ? 'border-green bg-green/5 text-green shadow-sm shadow-green/5'");
    expect(activeCriticalRule).toContain('border-color: oklch(from var(--green) l c h / 0.2);');
    expect(activeCriticalRule).toContain('background: oklch(from var(--green) l c h / 0.025);');
    expect(activeCriticalRule).toContain('box-shadow: none;');
    expect(activeCriticalRule).not.toContain('background: oklch(from var(--green) 0.965 0.022 h / 0.92);');
  });

  it('portals the public mobile menu outside the backdrop-filtered header', () => {
    const header = read('components/ui/PublicHeader.tsx');

    expect(header).toContain("import { createPortal } from 'react-dom';");
    expect(header).toContain('createPortal(');
    expect(header).toContain('document.body');
  });

  it('presents the public mobile menu as a modal dialog with managed background focus', () => {
    const header = read('components/ui/PublicHeader.tsx');

    expect(header).toContain('role="dialog"');
    expect(header).toContain('aria-modal="true"');
    expect(header).toContain('aria-labelledby={mobileMenuTitleId}');
    expect(header).toContain('aria-describedby={mobileMenuDescriptionId}');
    expect(header).toContain('mobileMenuPanelRef');
    expect(header).toContain('handleMobileMenuKeyDown');
  });

  it('keeps the public mobile overlay from blurring the header', () => {
    const css = read('index.css');
    const publicScrim = cssBlock(css, '.public-mobile-menu-scrim');
    const publicPanel = cssBlock(css, '.public-mobile-menu.mobile-sidebar-shell');

    expect(publicScrim).not.toContain('backdrop-filter');
    expect(publicScrim).not.toContain('-webkit-backdrop-filter');
    expect(publicPanel).not.toContain('backdrop-filter');
    expect(publicPanel).not.toContain('-webkit-backdrop-filter');
  });
});

describe('auth route shell contract', () => {
  it('keeps auth routes out of the authenticated dashboard shell', () => {
    const app = read('App.tsx');

    expect(existsSync(path.resolve(process.cwd(), 'layouts/AuthAppShell.tsx'))).toBe(true);
    expect(app).toContain("const AuthAppShell = lazy(() => import('./layouts/AuthAppShell')");
    expect(app).toContain('<Route element={withRouteFallback(<AuthAppShell />)} errorElement={<RouteErrorBoundary />}>');

    const authShellRoute = app.match(
      /<Route element={withRouteFallback\(<AuthAppShell \/>[^>]*>[\s\S]*?<\/Route>/,
    )?.[0] ?? '';
    const dashboardShellRoute = app.match(
      /<Route element={withRouteFallback\(<AuthenticatedAppShell \/>[^>]*>[\s\S]*?<\/Route>/,
    )?.[0] ?? '';

    expect(authShellRoute).toContain('path={RoutePath.LOGIN}');
    expect(authShellRoute).toContain('path={RoutePath.SIGNUP}');
    expect(authShellRoute).toContain('path={RoutePath.RESET_PASSWORD}');
    expect(authShellRoute).toContain('path={RoutePath.AUTH_CALLBACK}');
    expect(dashboardShellRoute).not.toContain('path={RoutePath.LOGIN}');
    expect(dashboardShellRoute).not.toContain('path={RoutePath.SIGNUP}');
    expect(dashboardShellRoute).not.toContain('path={RoutePath.RESET_PASSWORD}');
    expect(dashboardShellRoute).not.toContain('path={RoutePath.AUTH_CALLBACK}');
  });
});

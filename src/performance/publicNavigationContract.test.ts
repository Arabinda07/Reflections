import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

describe('public navigation shell contract', () => {
  it('routes public pages through the lightweight public shell only', () => {
    const app = read('App.tsx');

    expect(app).toContain("import { PublicAppShell } from './layouts/PublicAppShell';");
    expect(app).not.toContain("const PublicAppShell = lazy(() => import('./layouts/PublicAppShell')");
    expect(app).toContain('<Route element={withRouteFallback(<PublicAppShell />)} errorElement={<RouteErrorBoundary />}>');
    expect(app).toContain("import { LandingRoute } from './pages/dashboard/LandingRoute';");
    expect(app).toContain('path={RoutePath.HOME} element={<LandingRoute />}');
    expect(app).toContain('path={RoutePath.FAQ} element={withRouteFallback(<FAQ />)}');
    expect(app).toContain('path={RoutePath.ABOUT} element={withRouteFallback(<AboutArabinda />)}');
    expect(app).toContain('path={RoutePath.PRIVACY} element={withRouteFallback(<PrivacyPolicy />)}');
    expect(app).toContain("const AuthenticatedAppShell = lazy(() => import('./layouts/AuthenticatedAppShell')");
    expect(app).not.toContain("import { DashboardLayout } from './layouts/DashboardLayout';");
  });

  it('keeps public header and menu out of dashboard-only vendor chunks', () => {
    const shell = read('layouts/PublicAppShell.tsx');
    const header = read('components/ui/PublicHeader.tsx');

    for (const source of [shell, header]) {
      expect(source).not.toContain('DashboardLayout');

      expect(source).not.toContain('PWAInstallProvider');
      expect(source).not.toContain('motion/');
      expect(source).not.toContain('@phosphor-icons/react');
      expect(source).not.toContain('@emailjs/browser');
      expect(source).not.toContain('@vercel/');
      expect(source).not.toContain('supabase');
      expect(source).not.toContain('useSync');
    }

    expect(header).toContain('aria-label="Toggle menu"');
    expect(header).toContain('aria-expanded={isMobileMenuOpen}');
    expect(header).toContain('aria-label="Close menu"');
    expect(header).toContain('aria-current={isActive ? \'page\' : undefined}');
    expect(header).toContain('href={item.href}');
    expect(header).toContain('const homeHref = usePublicHomePath();');
    expect(header).not.toContain('const hasAuthHint = homeHref === RoutePath.DASHBOARD;');
    expect(header).toContain('href={RoutePath.LOGIN}');
    expect(header).toContain('href={RoutePath.SIGNUP}');
    expect(header).toContain('const MenuIcon');
    expect(header).toContain('const CloseIcon');
    expect(header).toContain('const AppLeafIcon');
    expect(header).toContain('const HomeLineIcon');
    expect(header).toContain('const HelpBubbleIcon');
    expect(header).toContain('const ShieldLeafIcon');
    expect(header).toContain("import { createPortal } from 'react-dom';");
    expect(header).toContain('public-mobile-menu-sheet');
    expect(header).toContain('public-mobile-menu-link');
    expect(header).toContain('public-mobile-menu-link-icon');
    expect(header).toContain('public-mobile-menu-link-chevron');
    expect(header).toContain("label: 'Home', href: RoutePath.HOME, icon: HomeLineIcon");
    expect(header).toContain("label: 'Begin writing'");
    expect(header).toContain('public-theme-toggle public-theme-toggle--mobile-header');
    expect(header).not.toContain('public-theme-toggle public-theme-toggle--mobile-sheet');
    expect(header).not.toContain('public-mobile-menu-section-title">Display');
    expect(header).toContain('public-mobile-menu-secondary-actions');
    expect(header).not.toContain("label: hasAuthHint ? 'Go to dashboard' : 'Home'");
    expect(header).not.toContain("label: 'Account'");
    expect(header).not.toContain('href: RoutePath.ACCOUNT');
    expect(header).not.toContain("label: 'Sign in'");
    expect(header).not.toContain('const PublicMenuIcon');
    expect(header).not.toContain("description: 'Quick answers'");
    expect(header).not.toContain("description: 'Start writing'");
    expect(header).not.toContain('mobile-sidebar-link');
    expect(header).not.toContain('Return to the opening page.');
    expect(header).not.toContain('Open ${item.label.toLowerCase()}');
  });

  it('keeps static public content pages off the shared icon vendor', () => {
    for (const filePath of [
      'pages/dashboard/FAQ.tsx',
      'pages/dashboard/AboutArabinda.tsx',
      'pages/dashboard/PrivacyPolicy.tsx',
    ]) {
      const source = read(filePath);

      expect(source).not.toContain('@phosphor-icons/react');
      expect(source).not.toContain("import { Button } from '../../components/ui/Button';");
    }
  });

  it('provides stable public shell spacing without hiding landing media controls', () => {
    const shell = read('layouts/PublicAppShell.tsx');
    const landing = read('pages/dashboard/Landing.tsx');
    const css = read('index.css');

    expect(shell).toContain('const isLandingRoute = location.pathname === RoutePath.HOME;');
    expect(shell).toContain("isLandingRoute ? 'public-shell public-shell--landing'");
    expect(shell).toContain('{!isLandingRoute && <PublicFooter />}');
    expect(shell).not.toContain('sr-only');
    expect(landing).toContain('var(--header-height)');
    expect(landing).toContain('aria-label={isMuted ? \'Unmute video\' : \'Mute video\'}');
    expect(css).toContain('.public-header');
    expect(css).toContain('.public-mobile-menu');
  });
});

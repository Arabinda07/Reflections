import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

describe('entrypoint vendor loading contract', () => {
  it('keeps third-party telemetry out of the root and app shells', () => {
    const packageJson = read('package.json');
    const index = read('index.tsx');
    const app = read('App.tsx');
    const authShell = read('layouts/AuthAppShell.tsx');
    const authenticatedShell = read('layouts/AuthenticatedAppShell.tsx');
    const routeErrorBoundary = read('pages/RouteErrorBoundary.tsx');

    for (const telemetryReference of [
      '@posthog/react',
      'posthog-js',
      '@sentry/react',
      '@sentry/vite-plugin',
      '@vercel/analytics',
      '@vercel/speed-insights',
      'src/instrument',
      'captureReactRootError',
      'captureAppError',
      'scheduleSentryInitialization',
      'DeferredVercelVitals',
      'SpeedInsights',
    ]) {
      expect(packageJson).not.toContain(telemetryReference);
      expect(index).not.toContain(telemetryReference);
      expect(app).not.toContain(telemetryReference);
      expect(authShell).not.toContain(telemetryReference);
      expect(authenticatedShell).not.toContain(telemetryReference);
      expect(routeErrorBoundary).not.toContain(telemetryReference);
    }

    expect(index).toContain('console.error("React root error.", error, errorInfo);');
    expect(index).not.toContain('PostHogProvider');
    expect(index).not.toContain('reactErrorHandler');
  });

  it('removes product analytics route and event wiring', () => {
    const index = read('index.tsx');
    const app = read('App.tsx');
    const authBootstrapper = read('hooks/useAuthBootstrapper.ts');
    const dashboardLayout = read('layouts/DashboardLayout.tsx');
    const nativeOauthHook = read('hooks/useNativeOAuthListener.ts');
    const signIn = read('pages/auth/SignIn.tsx');
    const signUp = read('pages/auth/SignUp.tsx');
    const notePublisher = read('services/notePublishingOrchestrator.ts');
    const lifeWiki = read('pages/dashboard/LifeWiki.tsx');
    const moodPicker = read('pages/dashboard/MoodPicker.tsx');
    const proUpgrade = read('components/ui/ProUpgradeCTA.tsx');

    for (const file of [
      index,
      app,
      authBootstrapper,
      dashboardLayout,
      nativeOauthHook,
      signIn,
      signUp,
      notePublisher,
      lifeWiki,
      moodPicker,
      proUpgrade,
    ]) {
      expect(file).not.toContain('src/analytics');
      expect(file).not.toContain('AnalyticsRouteTracker');
      expect(file).not.toContain('trackGoogleAuth');
      expect(file).not.toContain('trackNoteSaved');
      expect(file).not.toContain('trackLifeWikiRefreshed');
      expect(file).not.toContain('trackMood');
      expect(file).not.toContain('trackPaywall');
      expect(file).not.toContain('trackPlanSelected');
      expect(file).not.toContain('trackTrialStarted');
      expect(file).not.toContain('trackCheckoutFailed');
      expect(file).not.toContain('identifyAnalyticsUser');
      expect(file).not.toContain('resetAnalyticsUser');
    }

    expect(app).not.toContain("from './src/auth/AuthContext'");
    expect(app).not.toContain('<AuthProvider>');
  });

  it('keeps auth wiring out of the public root while auth shells stay live', () => {
    const app = read('App.tsx');
    const authShell = read('layouts/AuthAppShell.tsx');
    const authenticatedShell = read('layouts/AuthenticatedAppShell.tsx');
    const authBootstrapper = read('hooks/useAuthBootstrapper.ts');
    const publicShell = read('layouts/PublicAppShell.tsx');

    expect(app).not.toContain('<AppBootstrapper>\n      <RouterProvider router={router} />\n    </AppBootstrapper>');
    expect(app).not.toContain("import { AppBootstrapper } from './components/ui/AppBootstrapper';");
    expect(app).not.toContain("import { useNativeOAuthListener } from './hooks/useNativeOAuthListener';");
    expect(app).not.toContain('useNativeOAuthListener();');
    expect(app).not.toContain('withBootstrappedShell');
    expect(app).toContain("import { PublicAppShell } from './layouts/PublicAppShell';");
    expect(app).not.toContain("const PublicAppShell = lazy(() => import('./layouts/PublicAppShell')");
    expect(app).toContain("const AuthAppShell = lazy(() => import('./layouts/AuthAppShell')");
    expect(app).toContain("const AuthenticatedAppShell = lazy(() => import('./layouts/AuthenticatedAppShell')");
    expect(app).toContain('<Route element={withRouteFallback(<PublicAppShell />)} errorElement={<RouteErrorBoundary />}>');
    expect(app).toContain('<Route element={withRouteFallback(<AuthAppShell />, authRouteFallback)} errorElement={<RouteErrorBoundary />}>');
    expect(app).toContain('<Route element={withRouteFallback(<AuthenticatedAppShell />)} errorElement={<RouteErrorBoundary />}>');
    expect(authShell).toContain("import { useAuthBootstrapper } from '../hooks/useAuthBootstrapper';");
    expect(authShell).toContain("import { useNativeOAuthListener } from '../hooks/useNativeOAuthListener';");
    expect(authShell).toContain('useAuthBootstrapper();');
    expect(authShell).toContain('useNativeOAuthListener();');
    expect(authShell).not.toContain('AppBootstrapper');
    expect(authenticatedShell).toContain("import { AppBootstrapper } from '../components/ui/AppBootstrapper';");
    expect(authenticatedShell).toContain("import { useNativeOAuthListener } from '../hooks/useNativeOAuthListener';");
    expect(authenticatedShell).toContain('useNativeOAuthListener();');
    expect(authenticatedShell).toContain('<AppBootstrapper>');
    expect(publicShell).not.toContain('AppBootstrapper');
    expect(publicShell).not.toContain('supabaseClient');
    expect(authBootstrapper).toContain('const markAuthCheckComplete = () => {');
    expect(authBootstrapper).toContain('getAuthAdapter().onAuthChange');
    expect(authBootstrapper).not.toContain('if (!hasStoredAuthSessionHint()) {');
  });

  it('does not mount analytics route tracking', () => {
    const layout = read('layouts/DashboardLayout.tsx');

    expect(layout).not.toContain('AnalyticsRouteTracker');
  });

  it('keeps public routes out of dashboard-only shell work', () => {
    const publicShell = read('layouts/PublicAppShell.tsx');

    expect(publicShell).not.toContain('DashboardLayout');
    expect(publicShell).not.toContain('SyncBanner');
    expect(publicShell).not.toContain('ReferralInvitePanel');
    expect(publicShell).not.toContain('PWAInstallProvider');
    expect(publicShell).toContain('<PublicHeader isLandingRoute={isLandingRoute} />');
    expect(publicShell).toContain('{!isLandingRoute && <PublicFooter />}');
  });

  it('keeps route-error Lottie outside the app shell', () => {
    const routeErrorBoundary = read('pages/RouteErrorBoundary.tsx');

    expect(routeErrorBoundary).not.toContain('lottie-react');
    expect(routeErrorBoundary).not.toContain("from '@/src/lottie/error-404.json'");
    expect(routeErrorBoundary).toContain("lazy(() => import('../components/ui/LottieAnimation')");

    expect(existsSync(path.resolve(process.cwd(), 'components/ui/LottieAnimation.tsx'))).toBe(true);
    const lottieAnimation = read('components/ui/LottieAnimation.tsx');
    expect(lottieAnimation).toContain("from 'lottie-react'");
  });

  it('keeps heavy async vendors out of the PWA precache manifest', () => {
    const viteConfig = read('vite.config.ts');

    expect(viteConfig).toContain('globIgnores');
    expect(viteConfig).toContain('manifestTransforms');
    expect(viteConfig).toContain('keepLeanPrecacheEntry');
    expect(viteConfig).toContain('**/vendor-lottie-*.js');
    expect(viteConfig).not.toContain('**/vendor-analytics-*.js');
    expect(viteConfig).not.toContain('**/vendor-sentry-*.js');
    expect(viteConfig).toContain('**/*.mp4');
    expect(viteConfig).toContain('**/*.webm');
    expect(viteConfig).toContain('app-route-chunks');
    expect(viteConfig).not.toContain("return 'vendor-icons'");
  });

  it('keeps the Vite preload helper out of the native vendor chunk', () => {
    const viteConfig = read('vite.config.ts');

    expect(viteConfig).toContain("id.includes('vite/preload-helper')");
    expect(viteConfig).toContain("return 'vendor-core'");
    expect(viteConfig).toContain("if (id.includes('@capacitor')) return 'vendor-native';");
  });

  it('pins the Vite dev server root to this repo', () => {
    const viteConfig = read('vite.config.ts');

    expect(viteConfig).toContain('root: __dirname');
    expect(viteConfig).toContain("path.resolve(__dirname, '.')");
  });
});

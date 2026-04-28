import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

describe('entrypoint vendor loading contract', () => {
  it('keeps heavy observability vendors out of the root entrypoint', () => {
    const index = read('index.tsx');
    const app = read('App.tsx');

    expect(index).not.toContain('PostHogProvider');
    expect(index).not.toContain('@posthog/react');
    expect(index).not.toContain('@sentry/react');
    expect(index).not.toContain('reactErrorHandler');
    expect(index).not.toContain('import "./src/instrument"');

    expect(index).toContain('scheduleSentryInitialization');
    expect(index).toContain('captureReactRootError');

    expect(app).not.toContain("from '@vercel/analytics/react'");
    expect(app).not.toContain("from '@vercel/speed-insights/react'");
    expect(app).toContain('DeferredVercelVitals');
    expect(app).toContain("import('@vercel/analytics/react')");
    expect(app).toContain("import('@vercel/speed-insights/react')");
  });

  it('loads PostHog only from async event-time helpers', () => {
    const events = read('src/analytics/events.ts');
    const index = read('index.tsx');
    const app = read('App.tsx');
    const authContext = read('context/AuthContext.tsx');
    const routeTracker = read('src/analytics/AnalyticsRouteTracker.tsx');

    expect(index).not.toContain('getPostHogBootstrapConfig');
    expect(app).not.toContain("from './src/analytics/events'");
    expect(authContext).not.toContain("from '../src/analytics/events'");
    expect(routeTracker).not.toContain("from './events'");
    expect(routeTracker).toContain('captureAnalyticsEventDeferred');
    expect(events).not.toContain("import posthog from 'posthog-js'");
    expect(events).toContain("import('posthog-js')");
    expect(events).toContain('posthog.init');
  });

  it('keeps route-error Lottie outside the app shell', () => {
    const routeErrorBoundary = read('pages/RouteErrorBoundary.tsx');

    expect(routeErrorBoundary).not.toContain('@lottiefiles/dotlottie-react');
    expect(routeErrorBoundary).not.toContain("from '@/src/lottie/error-404.json'");
    expect(routeErrorBoundary).toContain("lazy(() => import('../components/ui/LottieAnimation')");

    expect(existsSync(path.resolve(process.cwd(), 'components/ui/LottieAnimation.tsx'))).toBe(true);
    const lottieAnimation = read('components/ui/LottieAnimation.tsx');
    expect(lottieAnimation).toContain("from '@lottiefiles/dotlottie-react'");
  });

  it('keeps heavy async vendors out of the PWA precache manifest', () => {
    const viteConfig = read('vite.config.ts');

    expect(viteConfig).toContain('globIgnores');
    expect(viteConfig).toContain('**/vendor-lottie-*.js');
    expect(viteConfig).toContain('**/vendor-analytics-*.js');
    expect(viteConfig).toContain('**/vendor-sentry-*.js');
  });

  it('pins the Vite dev server root to this repo', () => {
    const viteConfig = read('vite.config.ts');

    expect(viteConfig).toContain('root: __dirname');
    expect(viteConfig).toContain("path.resolve(__dirname, '.')");
  });
});

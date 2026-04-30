import path from 'node:path';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

describe('PostHog integration contract', () => {
  it('keeps PostHog bootstrap optional and outside the root entrypoint', () => {
    const index = read('index.tsx');
    const events = read('src/analytics/events.ts');

    expect(index).not.toContain('PostHogProvider');
    expect(index).not.toContain('@posthog/react');
    expect(index).not.toContain('getPostHogBootstrapConfig');

    expect(events).toContain('getPostHogBootstrapConfig');
    expect(events).toContain('VITE_PUBLIC_POSTHOG_PROJECT_TOKEN');
    expect(events).toContain('VITE_PUBLIC_POSTHOG_HOST');
    expect(events).toContain("import('posthog-js')");
  });

  it('wires the agreed analytics events into the auth, note, wiki, and auth-state seams', () => {
    const signIn = read('pages/auth/SignIn.tsx');
    const signUp = read('pages/auth/SignUp.tsx');
    const app = read('App.tsx');
    const oauthHook = read('hooks/useNativeOAuthListener.ts');
    const createNote = read('pages/dashboard/CreateNote.tsx');
    const lifeWiki = read('pages/dashboard/LifeWiki.tsx');
    const authContext = read('context/AuthContext.tsx');
    const routeTracker = read('src/analytics/AnalyticsRouteTracker.tsx');

    expect(signIn).toContain('trackGoogleAuthStarted');
    expect(signUp).toContain('trackGoogleAuthStarted');
    expect(app).not.toContain("from './src/analytics/events'");
    expect(app).toContain('useNativeOAuthListener');
    expect(oauthHook).toContain('trackGoogleAuthSucceededDeferred');
    expect(oauthHook).toContain('trackGoogleAuthFailedDeferred');
    expect(createNote).toContain('trackNoteSaved');
    expect(lifeWiki).toContain('trackLifeWikiRefreshed');
    expect(authContext).not.toContain("from '../src/analytics/events'");
    expect(authContext).toContain('identifyAnalyticsUserDeferred');
    expect(authContext).toContain('resetAnalyticsUserDeferred');
    expect(routeTracker).not.toContain("from './events'");
    expect(routeTracker).toContain('captureAnalyticsEventDeferred');
  });

  it('keeps analytics events off the startup shell path', () => {
    const deferredEvents = read('src/analytics/deferredEvents.ts');

    expect(deferredEvents).toContain("import('./events')");
    expect(deferredEvents).toContain('Deferred event skipped');
    expect(deferredEvents).toContain('analyticsEventsPromise = null');
    expect(deferredEvents).toContain('captureAnalyticsEventDeferred');
  });
});

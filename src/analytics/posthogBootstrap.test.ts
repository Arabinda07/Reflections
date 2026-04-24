import { describe, expect, it } from 'vitest';
import { getPostHogBootstrapConfig } from './posthogBootstrap';

describe('getPostHogBootstrapConfig', () => {
  it('returns null when the PostHog token is missing', () => {
    expect(
      getPostHogBootstrapConfig({
        VITE_PUBLIC_POSTHOG_PROJECT_TOKEN: '',
        VITE_PUBLIC_POSTHOG_HOST: 'https://us.i.posthog.com',
      }),
    ).toBeNull();
  });

  it('returns null when the PostHog host is missing', () => {
    expect(
      getPostHogBootstrapConfig({
        VITE_PUBLIC_POSTHOG_PROJECT_TOKEN: 'phc_test',
        VITE_PUBLIC_POSTHOG_HOST: '',
      }),
    ).toBeNull();
  });

  it('returns the recommended provider config when both env vars are present', () => {
    expect(
      getPostHogBootstrapConfig({
        VITE_PUBLIC_POSTHOG_PROJECT_TOKEN: 'phc_test',
        VITE_PUBLIC_POSTHOG_HOST: 'https://us.i.posthog.com',
      }),
    ).toEqual({
      apiKey: 'phc_test',
      options: {
        api_host: 'https://us.i.posthog.com',
        defaults: '2026-01-30',
        capture_pageview: false,
      },
    });
  });
});

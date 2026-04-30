type PostHogPublicEnv = Partial<
  Record<'VITE_PUBLIC_POSTHOG_PROJECT_TOKEN' | 'VITE_PUBLIC_POSTHOG_HOST', string | undefined>
>;

const hasValue = (value?: string) => Boolean(value?.trim());

export const getPostHogBootstrapConfig = (env: PostHogPublicEnv) => {
  const apiKey = env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN?.trim();
  const apiHost = env.VITE_PUBLIC_POSTHOG_HOST?.trim();

  if (!hasValue(apiKey) || !hasValue(apiHost)) {
    return null;
  }

  return {
    apiKey,
    options: {
      api_host: apiHost,
      defaults: '2026-01-30' as const,
      capture_pageview: false,
      autocapture: false,
      capture_pageleave: false,
      disable_session_recording: true,
    },
  };
};

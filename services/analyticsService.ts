import {
  ONBOARDING_FUNNEL_BROWSER_EVENT,
  type OnboardingFunnelEventDetail,
} from './onboardingFunnelService';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const SENSITIVE_QUERY_PARAMS = new Set([
  'access_token',
  'refresh_token',
  'token',
  'code',
  'password',
  'key',
  'secret',
  'auth',
]);

const SENSITIVE_PARAM_KEYS = new Set([
  'content',
  'body',
  'notes',
  'note',
  'title',
  'password',
  'passphrase',
  'secret',
  'token',
  'key',
  'email',
  'phone',
  'prompt',
]);

let isInitialized = false;
let boundOnboardingListener: ((event: Event) => void) | null = null;

export const getMeasurementId = (): string => {
  return (import.meta.env.VITE_GA_MEASUREMENT_ID ?? '').trim();
};

export const isAnalyticsInitialized = (): boolean => isInitialized;

export const sanitizePath = (path: string): string => {
  try {
    const url = new URL(path, 'https://reflections-app.local');
    const paramsToDelete: string[] = [];

    url.searchParams.forEach((_, key) => {
      if (SENSITIVE_QUERY_PARAMS.has(key.toLowerCase())) {
        paramsToDelete.push(key);
      }
    });

    paramsToDelete.forEach((key) => url.searchParams.delete(key));
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return path.split('?')[0] ?? '/';
  }
};

export const sanitizeParams = (params?: Record<string, unknown>): Record<string, unknown> => {
  if (!params) return {};

  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(params)) {
    if (SENSITIVE_PARAM_KEYS.has(key.toLowerCase())) {
      continue;
    }

    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      clean[key] = value;
    }
  }

  return clean;
};

export const initAnalytics = (overrideId?: string): boolean => {
  if (typeof window === 'undefined') return false;

  const measurementId = overrideId ?? getMeasurementId();
  if (!measurementId) {
    return false;
  }

  if (isInitialized) {
    return true;
  }

  window.dataLayer = window.dataLayer || [];
  if (!window.gtag) {
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer?.push(args);
    };
  }

  const scriptId = 'google-analytics-gtag';
  if (!document.getElementById(scriptId)) {
    const script = document.createElement('script');
    script.id = scriptId;
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    document.head.appendChild(script);
  }

  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    send_page_view: false,
    anonymize_ip: true,
  });

  if (!boundOnboardingListener) {
    boundOnboardingListener = (event: Event) => {
      const customEvent = event as CustomEvent<OnboardingFunnelEventDetail>;
      if (customEvent.detail) {
        trackEvent(`funnel_${customEvent.detail.event}`, customEvent.detail.properties as Record<string, unknown>);
      }
    };
    window.addEventListener(ONBOARDING_FUNNEL_BROWSER_EVENT, boundOnboardingListener);
  }

  isInitialized = true;
  return true;
};

export const trackPageView = (path?: string, title?: string): void => {
  if (typeof window === 'undefined' || !isInitialized) return;

  const currentPath = path ?? (window.location.pathname + window.location.search);
  const safePath = sanitizePath(currentPath);

  window.gtag?.('event', 'page_view', {
    page_path: safePath,
    page_title: title || document.title,
    page_location: `${window.location.origin}${safePath}`,
  });
};

export const trackEvent = (eventName: string, params?: Record<string, unknown>): void => {
  if (typeof window === 'undefined' || !isInitialized) return;

  const cleanParams = sanitizeParams(params);
  window.gtag?.('event', eventName, cleanParams);
};

export const resetAnalyticsForTesting = (): void => {
  if (typeof window !== 'undefined' && boundOnboardingListener) {
    window.removeEventListener(ONBOARDING_FUNNEL_BROWSER_EVENT, boundOnboardingListener);
    boundOnboardingListener = null;
  }
  const script = typeof document !== 'undefined' ? document.getElementById('google-analytics-gtag') : null;
  if (script?.parentNode) {
    script.parentNode.removeChild(script);
  }
  isInitialized = false;
};

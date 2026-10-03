import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  initAnalytics,
  isAnalyticsInitialized,
  resetAnalyticsForTesting,
  sanitizeParams,
  sanitizePath,
  trackEvent,
  trackPageView,
} from './analyticsService';
import { recordOnboardingFunnelEvent } from './onboardingFunnelService';

const createMockDocument = () => {
  const elements = new Map<string, any>();
  return {
    title: 'Reflections - Encrypted Private Journal',
    getElementById: vi.fn((id: string) => elements.get(id) ?? null),
    createElement: vi.fn((tag: string) => {
      const el: any = {
        tagName: tag.toUpperCase(),
        parentNode: null,
      };
      return el;
    }),
    head: {
      appendChild: vi.fn((el: any) => {
        el.parentNode = {
          removeChild: vi.fn(() => {
            if (el.id) elements.delete(el.id);
          }),
        };
        if (el.id) elements.set(el.id, el);
      }),
    },
  };
};

const createMockWindow = () => {
  const listeners: Record<string, ((e: any) => void)[]> = {};
  return {
    location: {
      origin: 'https://www.reflections-sanctuary.space',
      pathname: '/',
      search: '',
    },
    addEventListener: vi.fn((event: string, cb: any) => {
      listeners[event] = listeners[event] || [];
      listeners[event].push(cb);
    }),
    removeEventListener: vi.fn((event: string, cb: any) => {
      if (listeners[event]) {
        listeners[event] = listeners[event].filter((l) => l !== cb);
      }
    }),
    dispatchEvent: vi.fn((event: any) => {
      const cbs = listeners[event.type] || [];
      cbs.forEach((cb) => cb(event));
      return true;
    }),
  };
};

describe('analyticsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as any).window = createMockWindow();
    (globalThis as any).document = createMockDocument();
    resetAnalyticsForTesting();
  });

  afterEach(() => {
    resetAnalyticsForTesting();
  });

  describe('sanitizePath', () => {
    it('removes sensitive query parameters like access_token and password', () => {
      const input = '/auth/callback?access_token=secret123&refresh_token=secret456&type=signup';
      const output = sanitizePath(input);
      expect(output).toContain('/auth/callback?type=signup');
      expect(output).not.toContain('secret123');
      expect(output).not.toContain('secret456');
    });

    it('leaves safe parameters and paths unchanged', () => {
      const input = '/notes?filter=all&sort=desc#top';
      const output = sanitizePath(input);
      expect(output).toBe('/notes?filter=all&sort=desc#top');
    });
  });

  describe('sanitizeParams', () => {
    it('strips private journal fields and sensitive tokens', () => {
      const params = {
        step: 1,
        source: 'landing_hero',
        content: 'Dear diary, today I felt...',
        body: 'Private journal entry',
        title: 'My Deep Secrets',
        password: 'super-secret-password',
        token: 'auth-token-123',
        key: 'aes-gcm-key',
      };

      const sanitized = sanitizeParams(params);
      expect(sanitized).toEqual({
        step: 1,
        source: 'landing_hero',
      });
      expect(sanitized).not.toHaveProperty('content');
      expect(sanitized).not.toHaveProperty('body');
      expect(sanitized).not.toHaveProperty('title');
      expect(sanitized).not.toHaveProperty('password');
      expect(sanitized).not.toHaveProperty('token');
      expect(sanitized).not.toHaveProperty('key');
    });
  });

  describe('initAnalytics', () => {
    it('returns false when measurement ID is missing', () => {
      const initialized = initAnalytics('');
      expect(initialized).toBe(false);
      expect(isAnalyticsInitialized()).toBe(false);
      expect(document.getElementById('google-analytics-gtag')).toBeNull();
    });

    it('initializes gtag script and configures GA4 without auto-pageview', () => {
      const initialized = initAnalytics('G-TESTMEASURE1');
      expect(initialized).toBe(true);
      expect(isAnalyticsInitialized()).toBe(true);

      expect(document.head.appendChild).toHaveBeenCalled();
      expect(window.dataLayer).toBeDefined();

      const pushSpy = vi.spyOn(window, 'gtag');
      trackPageView('/faq', 'FAQ - Reflections');

      expect(pushSpy).toHaveBeenCalledWith('event', 'page_view', {
        page_path: '/faq',
        page_title: 'FAQ - Reflections',
        page_location: 'https://www.reflections-sanctuary.space/faq',
      });
    });

    it('is idempotent and does not inject multiple scripts', () => {
      initAnalytics('G-TESTMEASURE1');
      initAnalytics('G-TESTMEASURE1');
      expect((document.head.appendChild as any).mock.calls.length).toBe(1);
    });
  });

  describe('trackEvent', () => {
    it('does not send events when analytics is not initialized', () => {
      trackEvent('user_signup', { method: 'email' });
      expect((window as any).gtag).toBeUndefined();
    });

    it('sanitizes and forwards safe events when initialized', () => {
      initAnalytics('G-TESTMEASURE1');
      const gtagSpy = vi.spyOn(window, 'gtag');

      trackEvent('feature_interacted', {
        feature: 'audio_player',
        volume: 80,
        content: 'sensitive private audio description',
      });

      expect(gtagSpy).toHaveBeenCalledWith('event', 'feature_interacted', {
        feature: 'audio_player',
        volume: 80,
      });
    });
  });

  describe('onboarding funnel integration', () => {
    it('automatically tracks onboarding funnel events when analytics is initialized', () => {
      initAnalytics('G-TESTMEASURE1');
      const gtagSpy = vi.spyOn(window, 'gtag');

      recordOnboardingFunnelEvent('private_writing_unlock_method_selected', {
        method: 'account_password',
      });

      expect(gtagSpy).toHaveBeenCalledWith(
        'event',
        'funnel_private_writing_unlock_method_selected',
        { method: 'account_password' },
      );
    });
  });
});

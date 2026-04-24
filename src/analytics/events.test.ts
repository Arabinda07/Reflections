import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import posthog from 'posthog-js';
import { RoutePath } from '../../types';
import {
  identifyAnalyticsUser,
  resetAnalyticsUser,
  trackGoogleAuthFailed,
  trackGoogleAuthStarted,
  trackGoogleAuthSucceeded,
  trackLifeWikiRefreshed,
  trackNoteSaved,
} from './events';

vi.mock('posthog-js', () => ({
  default: {
    capture: vi.fn(),
    identify: vi.fn(),
    reset: vi.fn(),
  },
}));

const mockCapture = vi.mocked(posthog.capture);
const mockIdentify = vi.mocked(posthog.identify);
const mockReset = vi.mocked(posthog.reset);

const enablePostHogEnv = () => {
  vi.stubEnv('VITE_PUBLIC_POSTHOG_PROJECT_TOKEN', 'phc_test');
  vi.stubEnv('VITE_PUBLIC_POSTHOG_HOST', 'https://us.i.posthog.com');
};

const disablePostHogEnv = () => {
  vi.stubEnv('VITE_PUBLIC_POSTHOG_PROJECT_TOKEN', '');
  vi.stubEnv('VITE_PUBLIC_POSTHOG_HOST', '');
};

describe('analytics events', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('stays quiet when PostHog is not configured', () => {
    disablePostHogEnv();

    trackNoteSaved({
      mode: 'new',
      attachmentCount: 0,
      tagCount: 0,
      taskCount: 0,
    });

    expect(mockCapture).not.toHaveBeenCalled();
  });

  it('captures Google auth start without freeform data', () => {
    enablePostHogEnv();

    trackGoogleAuthStarted({
      sourcePath: RoutePath.LOGIN,
      redirectPath: RoutePath.HOME,
      isNative: true,
    });

    expect(mockCapture).toHaveBeenCalledWith('auth_google_started', {
      source_path: RoutePath.LOGIN,
      has_redirect_path: false,
      is_native: true,
    });
  });

  it('captures Google auth success with the redirect hint', () => {
    enablePostHogEnv();

    trackGoogleAuthSucceeded({
      sourcePath: RoutePath.SIGNUP,
      redirectPath: RoutePath.NOTES,
      isNative: true,
    });

    expect(mockCapture).toHaveBeenCalledWith('auth_google_succeeded', {
      source_path: RoutePath.SIGNUP,
      has_redirect_path: true,
      is_native: true,
    });
  });

  it('captures Google auth failures with a sanitized error code', () => {
    enablePostHogEnv();

    trackGoogleAuthFailed({
      sourcePath: RoutePath.LOGIN,
      isNative: true,
      errorCode: 'access_denied',
    });

    expect(mockCapture).toHaveBeenCalledWith('auth_google_failed', {
      source_path: RoutePath.LOGIN,
      is_native: true,
      error_code: 'access_denied',
    });
  });

  it('captures note saves as counts only', () => {
    enablePostHogEnv();

    trackNoteSaved({
      mode: 'edit',
      attachmentCount: 2,
      tagCount: 3,
      taskCount: 4,
    });

    expect(mockCapture).toHaveBeenCalledWith('note_saved', {
      mode: 'edit',
      attachment_count: 2,
      tag_count: 3,
      task_count: 4,
    });
  });

  it('captures Life Wiki refreshes without theme or note text', () => {
    enablePostHogEnv();

    trackLifeWikiRefreshed({
      planTier: 'free',
      entryCount: 5,
      pageCount: 4,
      source: 'notes',
      usedFreeRefresh: true,
    });

    expect(mockCapture).toHaveBeenCalledWith('life_wiki_refreshed', {
      plan_tier: 'free',
      entry_count: 5,
      page_count: 4,
      source: 'notes',
      used_free_refresh: true,
    });
  });

  it('identifies and resets the authenticated analytics user', () => {
    enablePostHogEnv();

    identifyAnalyticsUser({
      id: 'user-123',
      email: 'hello@example.com',
      name: 'Arabinda',
    });
    resetAnalyticsUser();

    expect(mockIdentify).toHaveBeenCalledWith('user-123', {
      email: 'hello@example.com',
      name: 'Arabinda',
    });
    expect(mockReset).toHaveBeenCalled();
  });
});

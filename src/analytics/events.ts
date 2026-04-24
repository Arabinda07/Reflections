import posthog from 'posthog-js';
import type { User, PlanTier } from '../../types';
import { RoutePath } from '../../types';
import { getPostHogBootstrapConfig } from './posthogBootstrap';

type GoogleAuthSourcePath = RoutePath.LOGIN | RoutePath.SIGNUP;
type WikiRefreshSource = 'themes' | 'notes' | 'none';

const getAnalyticsConfig = () =>
  getPostHogBootstrapConfig({
    VITE_PUBLIC_POSTHOG_PROJECT_TOKEN: import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN,
    VITE_PUBLIC_POSTHOG_HOST: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
  });

const hasAnalytics = () => Boolean(getAnalyticsConfig());

const hasRedirectPath = (redirectPath?: string) =>
  Boolean(redirectPath && redirectPath !== RoutePath.HOME);

export const sanitizeAnalyticsErrorCode = (value?: string | null) => {
  const normalized = value
    ?.trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 64);

  return normalized || 'unknown_error';
};

export const captureAnalyticsEvent = (
  eventName: string,
  properties: Record<string, unknown>,
) => {
  if (!hasAnalytics()) {
    return false;
  }

  posthog.capture(eventName, properties);
  return true;
};

export const trackGoogleAuthStarted = ({
  sourcePath,
  redirectPath,
  isNative,
}: {
  sourcePath: GoogleAuthSourcePath;
  redirectPath?: string;
  isNative: boolean;
}) =>
  captureAnalyticsEvent('auth_google_started', {
    source_path: sourcePath,
    has_redirect_path: hasRedirectPath(redirectPath),
    is_native: isNative,
  });

export const trackGoogleAuthSucceeded = ({
  sourcePath,
  redirectPath,
  isNative,
}: {
  sourcePath: GoogleAuthSourcePath;
  redirectPath?: string;
  isNative: boolean;
}) =>
  captureAnalyticsEvent('auth_google_succeeded', {
    source_path: sourcePath,
    has_redirect_path: hasRedirectPath(redirectPath),
    is_native: isNative,
  });

export const trackGoogleAuthFailed = ({
  sourcePath,
  isNative,
  errorCode,
}: {
  sourcePath: GoogleAuthSourcePath;
  isNative: boolean;
  errorCode?: string | null;
}) =>
  captureAnalyticsEvent('auth_google_failed', {
    source_path: sourcePath,
    is_native: isNative,
    error_code: sanitizeAnalyticsErrorCode(errorCode),
  });

export const trackNoteSaved = ({
  mode,
  attachmentCount,
  tagCount,
  taskCount,
}: {
  mode: 'new' | 'edit';
  attachmentCount: number;
  tagCount: number;
  taskCount: number;
}) =>
  captureAnalyticsEvent('note_saved', {
    mode,
    attachment_count: attachmentCount,
    tag_count: tagCount,
    task_count: taskCount,
  });

export const trackLifeWikiRefreshed = ({
  planTier,
  entryCount,
  pageCount,
  source,
  usedFreeRefresh,
}: {
  planTier: PlanTier;
  entryCount: number;
  pageCount: number;
  source: WikiRefreshSource;
  usedFreeRefresh: boolean;
}) =>
  captureAnalyticsEvent('life_wiki_refreshed', {
    plan_tier: planTier,
    entry_count: entryCount,
    page_count: pageCount,
    source,
    used_free_refresh: usedFreeRefresh,
  });

export const identifyAnalyticsUser = (user: Pick<User, 'id' | 'email' | 'name'>) => {
  if (!hasAnalytics()) {
    return false;
  }

  posthog.identify(user.id, {
    email: user.email,
    name: user.name,
  });
  return true;
};

export const resetAnalyticsUser = () => {
  if (!hasAnalytics()) {
    return false;
  }

  posthog.reset();
  return true;
};

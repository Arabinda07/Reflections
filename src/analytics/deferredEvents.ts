import type { User } from '../../types';

type AnalyticsEventsModule = typeof import('./events');
type GoogleAuthFailedPayload = Parameters<AnalyticsEventsModule['trackGoogleAuthFailed']>[0];
type GoogleAuthSucceededPayload = Parameters<AnalyticsEventsModule['trackGoogleAuthSucceeded']>[0];

let analyticsEventsPromise: Promise<AnalyticsEventsModule> | null = null;

const loadAnalyticsEvents = () => {
  analyticsEventsPromise ??= import('./events').catch((error) => {
    analyticsEventsPromise = null;
    throw error;
  });

  return analyticsEventsPromise;
};

const queueDeferredAnalytics = (
  action: (events: AnalyticsEventsModule) => void,
) => {
  void loadAnalyticsEvents()
    .then(action)
    .catch((error) => {
      console.warn('[analytics] Deferred event skipped.', error);
    });
};

export const captureAnalyticsEventDeferred = (
  eventName: string,
  properties: Record<string, unknown>,
) => {
  queueDeferredAnalytics(({ captureAnalyticsEvent }) => {
    captureAnalyticsEvent(eventName, properties);
  });
};

export const identifyAnalyticsUserDeferred = (
  user: Pick<User, 'id'>,
) => {
  queueDeferredAnalytics(({ identifyAnalyticsUser }) => {
    identifyAnalyticsUser(user);
  });
};

export const resetAnalyticsUserDeferred = () => {
  queueDeferredAnalytics(({ resetAnalyticsUser }) => {
    resetAnalyticsUser();
  });
};

export const trackGoogleAuthFailedDeferred = (payload: GoogleAuthFailedPayload) => {
  queueDeferredAnalytics(({ trackGoogleAuthFailed }) => {
    trackGoogleAuthFailed(payload);
  });
};

export const trackGoogleAuthSucceededDeferred = (payload: GoogleAuthSucceededPayload) => {
  queueDeferredAnalytics(({ trackGoogleAuthSucceeded }) => {
    trackGoogleAuthSucceeded(payload);
  });
};

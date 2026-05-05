import type { User } from '../../types';

type AnalyticsEventsModule = typeof import('./events');
type GoogleAuthFailedPayload = Parameters<AnalyticsEventsModule['trackGoogleAuthFailed']>[0];
type GoogleAuthStartedPayload = Parameters<AnalyticsEventsModule['trackGoogleAuthStarted']>[0];
type GoogleAuthSucceededPayload = Parameters<AnalyticsEventsModule['trackGoogleAuthSucceeded']>[0];
type LifeWikiRefreshedPayload = Parameters<AnalyticsEventsModule['trackLifeWikiRefreshed']>[0];
type NoteSavedPayload = Parameters<AnalyticsEventsModule['trackNoteSaved']>[0];

let analyticsEventsPromise: Promise<AnalyticsEventsModule> | null = null;

const loadAnalyticsEvents = () => {
  if (!analyticsEventsPromise) {
    analyticsEventsPromise = new Promise((resolve, reject) => {
      const idleWindow = window as Window & {
        requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
      };
      
      const doImport = () => {
        import('./events').then(resolve).catch(reject);
      };

      if (idleWindow.requestIdleCallback) {
        idleWindow.requestIdleCallback(doImport, { timeout: 5000 });
      } else {
        setTimeout(doImport, 2000);
      }
    }).catch((error) => {
      analyticsEventsPromise = null;
      throw error;
    }) as Promise<AnalyticsEventsModule>;
  }

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

export const trackGoogleAuthStartedDeferred = (payload: GoogleAuthStartedPayload) => {
  queueDeferredAnalytics(({ trackGoogleAuthStarted }) => {
    trackGoogleAuthStarted(payload);
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

export const trackNoteSavedDeferred = (payload: NoteSavedPayload) => {
  queueDeferredAnalytics(({ trackNoteSaved }) => {
    trackNoteSaved(payload);
  });
};

export const trackLifeWikiRefreshedDeferred = (payload: LifeWikiRefreshedPayload) => {
  queueDeferredAnalytics(({ trackLifeWikiRefreshed }) => {
    trackLifeWikiRefreshed(payload);
  });
};

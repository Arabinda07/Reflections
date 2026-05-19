import type { User } from '../../types';

type AnalyticsEventsModule = typeof import('./events');
type GoogleAuthFailedPayload = Parameters<AnalyticsEventsModule['trackGoogleAuthFailed']>[0];
type GoogleAuthStartedPayload = Parameters<AnalyticsEventsModule['trackGoogleAuthStarted']>[0];
type GoogleAuthSucceededPayload = Parameters<AnalyticsEventsModule['trackGoogleAuthSucceeded']>[0];
type LifeWikiRefreshedPayload = Parameters<AnalyticsEventsModule['trackLifeWikiRefreshed']>[0];
type CheckoutFailedPayload = Parameters<AnalyticsEventsModule['trackCheckoutFailed']>[0];
type ModalDismissedPayload = Parameters<AnalyticsEventsModule['trackModalDismissed']>[0];
type MoodFamilySelectedPayload = Parameters<AnalyticsEventsModule['trackMoodFamilySelected']>[0];
type MoodSelectedPayload = Parameters<AnalyticsEventsModule['trackMoodSelected']>[0];
type NoteSavedPayload = Parameters<AnalyticsEventsModule['trackNoteSaved']>[0];
type PaywallViewedPayload = Parameters<AnalyticsEventsModule['trackPaywallViewed']>[0];
type PlanSelectedPayload = Parameters<AnalyticsEventsModule['trackPlanSelected']>[0];
type TrialStartedPayload = Parameters<AnalyticsEventsModule['trackTrialStarted']>[0];

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

export const trackPaywallViewedDeferred = (payload: PaywallViewedPayload) => {
  queueDeferredAnalytics(({ trackPaywallViewed }) => {
    trackPaywallViewed(payload);
  });
};

export const trackPlanSelectedDeferred = (payload: PlanSelectedPayload) => {
  queueDeferredAnalytics(({ trackPlanSelected }) => {
    trackPlanSelected(payload);
  });
};

export const trackTrialStartedDeferred = (payload: TrialStartedPayload) => {
  queueDeferredAnalytics(({ trackTrialStarted }) => {
    trackTrialStarted(payload);
  });
};

export const trackCheckoutFailedDeferred = (payload: CheckoutFailedPayload) => {
  queueDeferredAnalytics(({ trackCheckoutFailed }) => {
    trackCheckoutFailed(payload);
  });
};

export const trackMoodFamilySelectedDeferred = (payload: MoodFamilySelectedPayload) => {
  queueDeferredAnalytics(({ trackMoodFamilySelected }) => {
    trackMoodFamilySelected(payload);
  });
};

export const trackMoodSelectedDeferred = (payload: MoodSelectedPayload) => {
  queueDeferredAnalytics(({ trackMoodSelected }) => {
    trackMoodSelected(payload);
  });
};

export const trackModalDismissedDeferred = (payload: ModalDismissedPayload) => {
  queueDeferredAnalytics(({ trackModalDismissed }) => {
    trackModalDismissed(payload);
  });
};

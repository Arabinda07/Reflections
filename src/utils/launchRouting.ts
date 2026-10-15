// The app opens onto a blank page once per session, but only when the session
// starts on Today. Opening any other screen first (a deep link, /notes) spends it.
const LAUNCH_ROUTED_KEY = 'reflections-launch-routed';

export const isSessionLaunch = () => {
  try {
    return !window.sessionStorage.getItem(LAUNCH_ROUTED_KEY);
  } catch {
    return false;
  }
};

export const markLaunchRouted = () => {
  try {
    window.sessionStorage.setItem(LAUNCH_ROUTED_KEY, '1');
  } catch {
    // Best-effort: without storage, Today simply shows.
  }
};

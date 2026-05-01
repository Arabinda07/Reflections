import { StrictMode, type ErrorInfo } from "react";
import { createRoot } from "react-dom/client";
import { getMissingClientEnvNames } from "./src/bootstrapEnv";
import { captureReactRootError, scheduleSentryInitialization } from "./src/instrument";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const handleReactRootError = (error: unknown, errorInfo: ErrorInfo) => {
  console.error("React root error.", error);
  void captureReactRootError(error, errorInfo);
};

const root = createRoot(rootElement, {
  onUncaughtError: handleReactRootError,
  onCaughtError: handleReactRootError,
  onRecoverableError: handleReactRootError,
});

const STALE_APP_SHELL_RECOVERY_KEY = 'app_recovered_from_import_error';
const LEGACY_IMPORT_ERROR_RELOAD_KEY = 'app_reloaded_from_import_error';

const isDynamicImportFailure = (detail: string) =>
  detail.includes("Failed to fetch dynamically imported module");

const reloadWithCacheBust = () => {
  const currentUrl = new URL(window.location.href);
  currentUrl.searchParams.set('t', Date.now().toString());
  window.location.replace(currentUrl.toString());
};

const clearBrowserManagedAppCaches = async () => {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  }

  if (typeof caches !== 'undefined') {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
  }
};

const recoverFromStaleAppShell = async (detail: string) => {
  console.warn("Detected stale app shell. Clearing browser-managed app caches before reloading.", detail);
  sessionStorage.setItem(STALE_APP_SHELL_RECOVERY_KEY, 'true');

  try {
    await clearBrowserManagedAppCaches();
  } catch (recoveryError) {
    console.warn("Could not clear all browser-managed app caches before reloading.", recoveryError);
  } finally {
    reloadWithCacheBust();
  }
};

const renderBootstrapState = (
  title: string,
  body: string,
  detail?: string,
  action?: { label: string; onClick: () => void },
) => {
  root.render(
    <StrictMode>
      <div className="flex min-h-[100dvh] items-center justify-center bg-body px-6 py-12 text-gray-text">
        <div className="surface-floating surface-floating--strong w-full max-w-xl rounded-[28px] p-8 sm:p-10">
          <p className="label-caps text-gray-nav">App startup</p>
          <h1 className="mt-4 text-[clamp(2rem,4vw,3rem)] font-black tracking-[-0.03em] text-gray-text">
            {title}
          </h1>
          <p className="mt-4 font-serif text-[1rem] leading-[1.75] text-gray-light">
            {body}
          </p>
          {detail ? (
            <p className="mt-4 text-[0.8rem] font-semibold uppercase tracking-[0.16em] text-gray-nav/75">
              {detail}
            </p>
          ) : null}
          {action ? (
            <button
              type="button"
              onClick={action.onClick}
              className="mt-6 inline-flex min-h-11 items-center justify-center rounded-[var(--radius-control)] bg-green px-5 text-sm font-bold text-white transition-transform duration-200 ease-out-expo active:translate-y-px"
            >
              {action.label}
            </button>
          ) : null}
        </div>
      </div>
    </StrictMode>,
  );
};

const bootstrapApp = async () => {
  const missingClientEnv = getMissingClientEnvNames(import.meta.env);
  if (missingClientEnv.length > 0) {
    renderBootstrapState(
      "Reflections is missing its public app config.",
      "Add the required Vercel frontend environment variables and redeploy so the landing page can boot normally.",
      `Missing: ${missingClientEnv.join(", ")}`,
    );
    return;
  }

  try {
    const { default: App } = await import('./App');
    sessionStorage.removeItem(STALE_APP_SHELL_RECOVERY_KEY);
    sessionStorage.removeItem(LEGACY_IMPORT_ERROR_RELOAD_KEY);

    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
    scheduleSentryInitialization();
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown startup error";

    // Detect dynamic import failures which usually indicate a version mismatch 
    // due to service worker caching or rapid redeployments.
    if (isDynamicImportFailure(detail)) {
      const hasRecovered = sessionStorage.getItem(STALE_APP_SHELL_RECOVERY_KEY);

      if (!hasRecovered) {
        renderBootstrapState(
          "Updating Reflections.",
          "A newer version is available. Reflections is refreshing its local app shell so the latest files can load.",
          detail,
        );
        await recoverFromStaleAppShell(detail);
        return;
      }

      sessionStorage.removeItem(STALE_APP_SHELL_RECOVERY_KEY);
      console.error("Dynamic import failed after stale app-shell recovery.", error);
      renderBootstrapState(
        "Refresh needed.",
        "Reflections updated while this tab had an older app shell. Tap reload to fetch the newest files.",
        detail,
        { label: "Reload Reflections", onClick: reloadWithCacheBust },
      );
      return;
    }

    console.error("App bootstrap failed.", error);
    renderBootstrapState(
      "Reflections couldn't start.",
      "Something interrupted the app before the landing page could render. Check the deployment config and refresh the app once the fix is live.",
      detail,
    );
  }
};

void bootstrapApp();

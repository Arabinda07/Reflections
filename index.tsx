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

const renderBootstrapState = (title: string, body: string, detail?: string) => {
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
    sessionStorage.removeItem('app_reloaded_from_import_error');

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
    if (detail.includes("Failed to fetch dynamically imported module")) {
      const isReloaded = sessionStorage.getItem('app_reloaded_from_import_error');
      
      if (!isReloaded) {
        console.warn("Detected dynamic import failure. Force-reloading the app to fetch the latest bundle.");
        sessionStorage.setItem('app_reloaded_from_import_error', 'true');
        
        // Cache bust the URL to force the browser to fetch the new index.html
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set('t', Date.now().toString());
        window.location.href = currentUrl.toString();
        return;
      } else {
        sessionStorage.removeItem('app_reloaded_from_import_error');
        console.error("Dynamic import failed even after cache-busted reload. Manual cache clear required.");
        renderBootstrapState(
          "Update available.",
          "We've updated Reflections. Please clear your browser cache or try opening the app in an incognito window to load the latest version.",
          detail,
        );
        return;
      }
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

import "./src/instrument"; // ← MUST be first — Sentry init before any other code

import { PostHogProvider } from "@posthog/react";
import { reactErrorHandler } from "@sentry/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { getPostHogBootstrapConfig } from "./src/analytics/posthogBootstrap";
import { getMissingClientEnvNames } from "./src/bootstrapEnv";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = createRoot(rootElement, {
  // React 19 error handlers — route uncaught/caught/recoverable errors to Sentry
  onUncaughtError: reactErrorHandler(),
  onCaughtError: reactErrorHandler(),
  onRecoverableError: reactErrorHandler(),
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
    const posthogConfig = getPostHogBootstrapConfig({
      VITE_PUBLIC_POSTHOG_PROJECT_TOKEN: import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN,
      VITE_PUBLIC_POSTHOG_HOST: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
    });

    root.render(
      <StrictMode>
        {posthogConfig ? (
          <PostHogProvider apiKey={posthogConfig.apiKey} options={posthogConfig.options}>
            <App />
          </PostHogProvider>
        ) : (
          <App />
        )}
      </StrictMode>,
    );
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown startup error";

    console.error("App bootstrap failed.", error);
    renderBootstrapState(
      "Reflections couldn't start.",
      "Something interrupted the app before the landing page could render. Check the deployment config and refresh the app once the fix is live.",
      detail,
    );
  }
};

void bootstrapApp();

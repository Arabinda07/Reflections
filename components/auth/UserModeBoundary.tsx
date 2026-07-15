import React, { useState } from 'react';
import { useUserMode } from '../../context/UserModeContext';
import { RouteLoadingFrame } from '../ui/RouteLoadingFrame';

const panelClassName =
  'surface-scope-paper page-wash flex min-h-[100dvh] items-center justify-center bg-body px-4 py-10 text-primary';
const cardClassName =
  'w-full max-w-lg rounded-2xl border border-border bg-surface/95 p-6 shadow-card';
const buttonClassName =
  'mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-green bg-green px-4 py-3 text-sm font-semibold text-on-accent transition hover:bg-green-hover disabled:cursor-not-allowed disabled:border-border disabled:bg-surface-muted disabled:text-gray-nav disabled:opacity-100';

/**
 * Gates the authenticated app on the user's privacy mode being resolvable.
 *
 * `UserModeContext` deliberately refuses to guess a mode when the profile fetch
 * fails (an encrypted user misclassified as reflective could attempt plaintext
 * writes). But that leaves `userMode` null forever, which keeps `CryptoContext`
 * in `loading` and `PrivateDataGate` spinning indefinitely. This boundary is the
 * missing consumer of that error: it turns the silent deadlock into a visible,
 * recoverable retry instead of an infinite spinner.
 */
export const UserModeBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userModeError, refreshUserMode } = useUserMode();
  const [isRetrying, setIsRetrying] = useState(false);

  if (!userModeError) return <>{children}</>;

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await refreshUserMode();
    } finally {
      setIsRetrying(false);
    }
  };

  if (isRetrying) {
    return <RouteLoadingFrame className="surface-scope-paper page-wash min-h-[100dvh] bg-body" />;
  }

  return (
    <div className={panelClassName}>
      <section className={cardClassName} aria-labelledby="user-mode-error-title">
        <p className="label-caps mb-3 text-gray-nav">Reconnecting</p>
        <h1 id="user-mode-error-title" className="text-2xl font-semibold text-primary">
          We couldn&apos;t load your account
        </h1>
        <p className="mt-2 text-sm leading-6 text-gray-text">
          Your privacy settings couldn&apos;t be reached just now. This usually means a brief
          connection hiccup. Check your connection and try again — nothing has been lost.
        </p>
        <button className={buttonClassName} onClick={handleRetry} disabled={isRetrying}>
          Try again
        </button>
      </section>
    </div>
  );
};

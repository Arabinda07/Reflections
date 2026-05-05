import React, { useEffect, useState } from 'react';
import { StartupScreen } from './StartupScreen';
import { useAuthBootstrapper } from '../../hooks/useAuthBootstrapper';
import { useAuthStore } from '../../hooks/useAuthStore';
import { NATIVE_STARTUP_FADE_MS, NATIVE_STARTUP_MIN_MS } from '../../src/native/appLaunch';
import { hasStoredAuthSessionHint } from '../../src/utils/authHints';

const STARTUP_EXIT_ANIMATION_MS = 350;

export const AppBootstrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useAuthBootstrapper();
  const { isInitialCheckDone, isHydrated } = useAuthStore();

  const [showStartup, setShowStartup] = useState(() => {
    if (!hasStoredAuthSessionHint()) return false;
    return !sessionStorage.getItem('startup_shown');
  });
  const [minTimeReached, setMinTimeReached] = useState(false);
  const [startupExitDone, setStartupExitDone] = useState(!showStartup);

  useEffect(() => {
    if (showStartup) {
      const timer = setTimeout(() => {
        setMinTimeReached(true);
      }, NATIVE_STARTUP_MIN_MS);
      return () => clearTimeout(timer);
    }
  }, [showStartup]);

  useEffect(() => {
    const loading = !isInitialCheckDone;
    if (!loading && minTimeReached && showStartup && isHydrated) {
      const fadeOutTimer = setTimeout(() => {
        setShowStartup(false);
        sessionStorage.setItem('startup_shown', 'true');
      }, NATIVE_STARTUP_FADE_MS);
      return () => clearTimeout(fadeOutTimer);
    }
  }, [isInitialCheckDone, minTimeReached, showStartup, isHydrated]);

  useEffect(() => {
    if (showStartup) {
      setStartupExitDone(false);
      return;
    }

    const timer = setTimeout(() => {
      setStartupExitDone(true);
    }, STARTUP_EXIT_ANIMATION_MS);

    return () => clearTimeout(timer);
  }, [showStartup]);

  const isStartupBlocking = showStartup || !startupExitDone;

  return (
    <>
      <StartupScreen isVisible={showStartup} />
      <div
        className="flex min-h-0 flex-1 flex-col"
        aria-hidden={isStartupBlocking}
        style={{
          pointerEvents: isStartupBlocking ? 'none' : 'auto',
        }}
      >
        {children}
      </div>
    </>
  );
};

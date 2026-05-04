import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { RouteLoadingFrame } from '../../components/ui/RouteLoadingFrame';
import { useAuthStore } from '../../hooks/useAuthStore';
import { RoutePath } from '../../types';

const Landing = React.lazy(() => import('./Landing').then((module) => ({ default: module.Landing })));

const renderLanding = () => (
  <React.Suspense fallback={<RouteLoadingFrame />}>
    <Landing />
  </React.Suspense>
);

/**
 * Switcher for the root '/' route.
 * Redirects authenticated users to '/home' and shows Landing to guests.
 */
export const Home: React.FC = () => {
  const { isAuthenticated, isInitialCheckDone, isHydrated: isAuthStoreHydrated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isInitialCheckDone && isAuthenticated) {
      navigate(RoutePath.DASHBOARD, { replace: true });
    }
  }, [isAuthenticated, isInitialCheckDone, navigate]);

  if (!isInitialCheckDone && isAuthStoreHydrated && !isAuthenticated) {
    return renderLanding();
  }

  if (!isInitialCheckDone) {
    return <RouteLoadingFrame />;
  }

  if (!isAuthenticated) {
    return renderLanding();
  }

  return <RouteLoadingFrame />;
};

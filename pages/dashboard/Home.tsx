import React, { Suspense, lazy } from 'react';

import { RouteLoadingFrame } from '../../components/ui/RouteLoadingFrame';
import { useAuth } from '../../context/AuthContext';
import { Landing } from './Landing';

const HomeAuthenticated = lazy(() =>
  import('./HomeAuthenticated').then((module) => ({ default: module.HomeAuthenticated })),
);

export const Home: React.FC = () => {
  const { isAuthenticated, isInitialCheckDone, isAuthStoreHydrated } = useAuth();

  if (!isInitialCheckDone && isAuthStoreHydrated && !isAuthenticated) {
    return <Landing />;
  }

  if (!isInitialCheckDone) {
    return <RouteLoadingFrame />;
  }

  if (!isAuthenticated) {
    return <Landing />;
  }

  return (
    <Suspense fallback={<RouteLoadingFrame />}>
      <HomeAuthenticated />
    </Suspense>
  );
};

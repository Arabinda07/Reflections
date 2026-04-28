import { CircleNotch } from '@phosphor-icons/react';
import React, { Suspense, lazy } from 'react';

import { useAuth } from '../../context/AuthContext';
import { Landing } from './Landing';

const HomeAuthenticated = lazy(() =>
  import('./HomeAuthenticated').then((module) => ({ default: module.HomeAuthenticated })),
);

const HomeFallback: React.FC = () => (
  <div className="flex min-h-[60dvh] items-center justify-center bg-body">
    <CircleNotch size={28} className="animate-spin text-green" weight="bold" />
  </div>
);

export const Home: React.FC = () => {
  const { isAuthenticated, isInitialCheckDone, isAuthStoreHydrated } = useAuth();

  if (!isInitialCheckDone && isAuthStoreHydrated && !isAuthenticated) {
    return <Landing />;
  }

  if (!isInitialCheckDone) {
    return <HomeFallback />;
  }

  if (!isAuthenticated) {
    return <Landing />;
  }

  return (
    <Suspense fallback={<HomeFallback />}>
      <HomeAuthenticated />
    </Suspense>
  );
};

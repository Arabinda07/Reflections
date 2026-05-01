import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { RouteLoadingFrame } from '../../components/ui/RouteLoadingFrame';
import { useAuth } from '../../context/AuthContext';
import { RoutePath } from '../../types';
import { Landing } from './Landing';

/**
 * Switcher for the root '/' route.
 * Redirects authenticated users to '/home' and shows Landing to guests.
 */
export const Home: React.FC = () => {
  const { isAuthenticated, isInitialCheckDone, isAuthStoreHydrated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isInitialCheckDone && isAuthenticated) {
      navigate(RoutePath.DASHBOARD, { replace: true });
    }
  }, [isAuthenticated, isInitialCheckDone, navigate]);

  if (!isInitialCheckDone && isAuthStoreHydrated && !isAuthenticated) {
    return <Landing />;
  }

  if (!isInitialCheckDone) {
    return <RouteLoadingFrame />;
  }

  if (!isAuthenticated) {
    return <Landing />;
  }

  return <RouteLoadingFrame />;
};

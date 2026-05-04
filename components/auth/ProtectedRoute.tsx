import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../hooks/useAuthStore';
import { RoutePath } from '../../types';
import { RouteLoadingFrame } from '../ui/RouteLoadingFrame';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isInitialCheckDone } = useAuthStore();
  const location = useLocation();

  if (!isInitialCheckDone) {
    return <RouteLoadingFrame />;
  }

  if (!isAuthenticated) {
    return <Navigate to={RoutePath.LOGIN} state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

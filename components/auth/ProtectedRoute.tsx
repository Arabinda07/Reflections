import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../hooks/useAuthStore';
import { RoutePath } from '../../types';
import { RouteLoadingFrame } from '../ui/RouteLoadingFrame';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  fallback = <RouteLoadingFrame />,
}) => {
  const { isAuthenticated, isInitialCheckDone } = useAuthStore();
  const location = useLocation();

  if (!isInitialCheckDone) {
    return <>{fallback}</>;
  }

  if (!isAuthenticated) {
    return <Navigate to={RoutePath.LOGIN} state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

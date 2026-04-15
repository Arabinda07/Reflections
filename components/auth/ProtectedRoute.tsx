import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { RoutePath } from '../../types';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isInitialCheckDone } = useAuth();
  const location = useLocation();

  if (!isInitialCheckDone) {
    // Wait until we know for sure if they are logged in or not.
    // The StartupScreen is covering this visually.
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to={RoutePath.LOGIN} state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
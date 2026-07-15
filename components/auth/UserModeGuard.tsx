import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUserMode } from '@/context/UserModeContext';
import { RoutePath } from '@/types';
import { RouteLoadingFrame } from '../ui/RouteLoadingFrame';

interface UserModeGuardProps {
  children: React.ReactNode;
  requireMode: 'reflective' | 'encrypted';
  fallbackPath?: string;
}

export const UserModeGuard: React.FC<UserModeGuardProps> = ({ 
  children, 
  requireMode, 
  fallbackPath = RoutePath.DASHBOARD 
}) => {
  const { userMode, isUserModeLoading } = useUserMode();

  if (isUserModeLoading) {
    return <RouteLoadingFrame />;
  }

  if (!userMode || userMode !== requireMode) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};

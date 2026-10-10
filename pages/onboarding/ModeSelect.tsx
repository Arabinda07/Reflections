import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RoutePath } from '@/types';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { RouteLoadingFrame } from '@/components/ui/RouteLoadingFrame';

/**
 * ModeSelect (Retired under ADR 0004).
 * All users operate in unified client-side encrypted mode with seamless account password wrapping.
 * Direct visits to /onboarding/mode-select automatically redirect to the dashboard.
 */
export const ModeSelect: React.FC = () => {
  useDocumentMeta({
    title: 'Redirecting... - Reflections',
    description: 'Transitioning to your dashboard.',
    path: RoutePath.ONBOARDING_MODE_SELECT,
  });

  const navigate = useNavigate();

  useEffect(() => {
    navigate(RoutePath.DASHBOARD, { replace: true });
  }, [navigate]);

  return <RouteLoadingFrame />;
};

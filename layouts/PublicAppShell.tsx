import React from 'react';
import { MotionConfig } from 'motion/react';

import { PWAInstallProvider } from '../context/PWAInstallContext';
import { ToastProvider } from '../components/ui/Toast';
import { DashboardLayout } from './DashboardLayout';

export const PublicAppShell: React.FC = () => {
  return (
    <PWAInstallProvider>

        <ToastProvider>
          <MotionConfig reducedMotion="user">
            <DashboardLayout />
          </MotionConfig>
        </ToastProvider>

    </PWAInstallProvider>
  );
};

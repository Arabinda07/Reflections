import React from 'react';
import { MotionConfig } from 'motion/react';
import { AuthProvider } from '../context/AuthContext';
import { PWAInstallProvider } from '../context/PWAInstallContext';
import { ToastProvider } from '../components/ui/Toast';
import { DashboardLayout } from './DashboardLayout';

export const PublicAppShell: React.FC = () => {
  return (
    <PWAInstallProvider>
      <AuthProvider>
        <ToastProvider>
          <MotionConfig reducedMotion="user">
            <DashboardLayout />
          </MotionConfig>
        </ToastProvider>
      </AuthProvider>
    </PWAInstallProvider>
  );
};

import React from 'react';

import { PWAInstallProvider } from '../context/PWAInstallContext';
import { ToastProvider } from '../components/ui/Toast';
import { DashboardLayout } from './DashboardLayout';

export const PublicAppShell: React.FC = () => {
  return (
    <PWAInstallProvider>
        <ToastProvider>
          <DashboardLayout />
        </ToastProvider>
    </PWAInstallProvider>
  );
};

import React from 'react';
<<<<<<< HEAD
import { Outlet, useLocation } from 'react-router-dom';
import { PublicHeader } from '../components/ui/PublicHeader';
import { PublicFooter } from '../components/ui/PublicFooter';
import { RoutePath } from '../types';
=======

import { PWAInstallProvider } from '../context/PWAInstallContext';
import { ToastProvider } from '../components/ui/Toast';
import { DashboardLayout } from './DashboardLayout';
>>>>>>> 469888e60fe1cba2bb55b6f60ebe25945057e112

export const PublicAppShell: React.FC = () => {
  const location = useLocation();
  const isLandingRoute = location.pathname === RoutePath.HOME;

  return (
<<<<<<< HEAD
    <div className={isLandingRoute ? 'public-shell public-shell--landing' : 'bg-green-dark text-green-light flex min-h-screen flex-col'}>
      <PublicHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      {!isLandingRoute && <PublicFooter />}
    </div>
=======
    <PWAInstallProvider>
        <ToastProvider>
          <DashboardLayout />
        </ToastProvider>
    </PWAInstallProvider>
>>>>>>> 469888e60fe1cba2bb55b6f60ebe25945057e112
  );
};

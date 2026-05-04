import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { PublicHeader } from '../components/ui/PublicHeader';
import { PublicFooter } from '../components/ui/PublicFooter';
import { RoutePath } from '../types';

export const PublicAppShell: React.FC = () => {
  const location = useLocation();
  const isLandingRoute = location.pathname === RoutePath.HOME;

  return (
    <div className={isLandingRoute ? 'public-shell public-shell--landing' : 'bg-green-dark text-green-light flex min-h-screen flex-col'}>
      <PublicHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      {!isLandingRoute && <PublicFooter />}
    </div>
  );
};

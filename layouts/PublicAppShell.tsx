import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import { PublicFooter } from '../components/ui/PublicFooter';
import { PublicHeader } from '../components/ui/PublicHeader';
import { RoutePath } from '../types';

export const PublicAppShell: React.FC = () => {
  const location = useLocation();
  const isLandingRoute = location.pathname === RoutePath.HOME;

  return (
    <div
      className={`${isLandingRoute ? 'public-shell public-shell--landing' : 'public-shell public-shell--page'} page-wash flex min-h-[100dvh] flex-col bg-body text-gray-text`}
    >
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <PublicHeader isLandingRoute={isLandingRoute} />
      <main id="main-content" className="flex min-h-0 flex-1 flex-col">
        <Outlet />
      </main>
      {!isLandingRoute && <PublicFooter />}
    </div>
  );
};

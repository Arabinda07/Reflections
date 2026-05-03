import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { PublicFooter } from '../components/ui/PublicFooter';
import { PublicHeader } from '../components/ui/PublicHeader';
import { RoutePath } from '../types';

export const PublicAppShell: React.FC = () => {
  const location = useLocation();
  const isLandingRoute = location.pathname === RoutePath.HOME;

  return (
    <div className={isLandingRoute ? 'public-shell public-shell--landing' : 'public-shell public-shell--standard surface-scope-paper page-wash bg-body text-gray-text'}>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <PublicHeader isLandingRoute={isLandingRoute} />
      <main id="main-content" className={isLandingRoute ? 'min-h-[100dvh]' : 'min-h-[calc(100dvh-var(--header-height))] pt-[calc(env(safe-area-inset-top)+var(--header-height))]'}>
        <Outlet />
      </main>
      {!isLandingRoute && <PublicFooter />}
    </div>
  );
};

import React from 'react';
import { Outlet } from 'react-router-dom';
import { useNativeStatusBar } from '../hooks/useNativeStatusBar';

export const AuthAppShell: React.FC = () => {
  useNativeStatusBar();

  return (
    <div className="surface-scope-paper page-wash min-h-[100dvh] bg-body text-gray-text">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <main id="main-content" className="flex min-h-[100dvh] flex-col pt-[env(safe-area-inset-top)]">
        <Outlet />
      </main>
    </div>
  );
};

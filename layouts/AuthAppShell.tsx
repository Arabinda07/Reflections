import React from 'react';
import { MotionConfig } from 'motion/react';
import { Outlet } from 'react-router-dom';


import { useNativeStatusBar } from '../hooks/useNativeStatusBar';
import { useNativeOAuthListener } from '../hooks/useNativeOAuthListener';

export const AuthAppShell: React.FC = () => {
  useNativeStatusBar();
  useNativeOAuthListener();

  return (
    <MotionConfig reducedMotion="user">
      <div className="surface-scope-paper page-wash min-h-[100dvh] bg-body text-gray-text">
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <main id="main-content" className="flex min-h-[100dvh] flex-col pt-[env(safe-area-inset-top)]">
          <Outlet />
        </main>
      </div>
    </MotionConfig>  );
};

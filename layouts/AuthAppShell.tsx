import React from 'react';
import { MotionConfig } from 'motion/react';
import { Outlet } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';

export const AuthAppShell: React.FC = () => (
  <AuthProvider>
    <MotionConfig reducedMotion="user">
      <div className="surface-scope-paper page-wash min-h-[100dvh] bg-body text-gray-text">
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <main id="main-content" className="min-h-[100dvh]">
          <Outlet />
        </main>
      </div>
    </MotionConfig>
  </AuthProvider>
);

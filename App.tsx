import React, { Suspense, lazy, useEffect } from 'react';
import { Route, RouterProvider, createHashRouter, createRoutesFromElements } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PWAInstallProvider } from './context/PWAInstallContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Home } from './pages/dashboard/Home';
import { RoutePath } from './types';
import { useSync } from './hooks/useSync';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import {
  consumeNativeGoogleOAuthCallback,
  getPendingGoogleAuthPath,
  redirectToAppRoute,
  stashGoogleAuthError,
} from './src/auth/googleOAuth';

// Lazy load non-critical routes to reduce initial bundle size
const SignIn = lazy(() => import('./pages/auth/SignIn').then(m => ({ default: m.SignIn })));
const SignUp = lazy(() => import('./pages/auth/SignUp').then(m => ({ default: m.SignUp })));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword').then(m => ({ default: m.ResetPassword })));
const MyNotes = lazy(() => import('./pages/dashboard/MyNotes').then(m => ({ default: m.MyNotes })));
const CreateNote = lazy(() => import('./pages/dashboard/CreateNote').then(m => ({ default: m.CreateNote })));
const SingleNote = lazy(() => import('./pages/dashboard/SingleNote').then(m => ({ default: m.SingleNote })));
const Account = lazy(() => import('./pages/dashboard/Account').then(m => ({ default: m.Account })));
const Insights = lazy(() => import('./pages/dashboard/Insights').then(m => ({ default: m.Insights })));
const FAQ = lazy(() => import('./pages/dashboard/FAQ').then(m => ({ default: m.FAQ })));
const PrivacyPolicy = lazy(() => import('./pages/dashboard/PrivacyPolicy').then(m => ({ default: m.PrivacyPolicy })));
const NotFound = lazy(() => import('./pages/NotFound').then(m => ({ default: m.NotFound })));

// Loading fallback for Suspense
const PageLoader = () => (
  <div className="flex-1 flex items-center justify-center min-h-[50vh]">
    <div className="h-8 w-8 rounded-full border-2 border-border border-t-green animate-spin" />
  </div>
);

const router = createHashRouter(
  createRoutesFromElements(
    <Route element={<DashboardLayout />}>
      <Route path={RoutePath.HOME} element={<Home />} />
      <Route path={RoutePath.FAQ} element={<FAQ />} />
      <Route path={RoutePath.PRIVACY} element={<PrivacyPolicy />} />

      <Route path={RoutePath.LOGIN} element={<SignIn />} />
      <Route path={RoutePath.SIGNUP} element={<SignUp />} />
      <Route path={RoutePath.RESET_PASSWORD} element={<ResetPassword />} />

      <Route
        path={RoutePath.NOTES}
        element={
          <ProtectedRoute>
            <MyNotes />
          </ProtectedRoute>
        }
      />
      <Route
        path={RoutePath.CREATE_NOTE}
        element={
          <ProtectedRoute>
            <CreateNote />
          </ProtectedRoute>
        }
      />
      <Route
        path={RoutePath.EDIT_NOTE}
        element={
          <ProtectedRoute>
            <CreateNote />
          </ProtectedRoute>
        }
      />
      <Route
        path={RoutePath.NOTE_DETAIL}
        element={
          <ProtectedRoute>
            <SingleNote />
          </ProtectedRoute>
        }
      />
      <Route
        path={RoutePath.ACCOUNT}
        element={
          <ProtectedRoute>
            <Account />
          </ProtectedRoute>
        }
      />
      <Route
        path={RoutePath.INSIGHTS}
        element={
          <ProtectedRoute>
            <Insights />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Route>,
  ),
);

// Wrapper to initialize hooks inside Context and handle preloading
const SyncWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useSync();
  
  useEffect(() => {
    // Optimistically preload critical routes after initial paint
    const preloadRoutes = () => {
      import('./pages/dashboard/CreateNote');
      import('./pages/dashboard/FAQ');
    };
    
    // Defer preloading until the main thread is idle
    if (window.requestIdleCallback) {
      window.requestIdleCallback(preloadRoutes);
    } else {
      setTimeout(preloadRoutes, 2000);
    }
  }, []);

  return <>{children}</>;
};

function App() {
  useEffect(() => {
    let isActive = true;
    let nativeUrlListenerPromise: Promise<{ remove: () => Promise<void> }> | null = null;
    let lastHandledNativeUrl: string | null = null;

    const handleNativeOAuthUrl = async (url: string) => {
      if (!url || url === lastHandledNativeUrl) {
        return;
      }

      lastHandledNativeUrl = url;
      const result = await consumeNativeGoogleOAuthCallback(url);

      if (!isActive || !result.handled) {
        return;
      }

      if ('error' in result) {
        stashGoogleAuthError(result.error);
      }

      redirectToAppRoute(getPendingGoogleAuthPath() || RoutePath.LOGIN);
    };

    if (Capacitor.isNativePlatform()) {
      nativeUrlListenerPromise = CapacitorApp.addListener('appUrlOpen', ({ url }) => {
        void handleNativeOAuthUrl(url);
      });

      void CapacitorApp.getLaunchUrl().then((launchData) => {
        if (launchData?.url) {
          void handleNativeOAuthUrl(launchData.url);
        }
      });
    }

    return () => {
      isActive = false;
      void nativeUrlListenerPromise?.then((listener) => listener.remove());
    };
  }, []);

  return (
    <PWAInstallProvider>
      <AuthProvider>
        <Analytics />
        <SpeedInsights />
        <SyncWrapper>
          <Suspense fallback={<PageLoader />}>
            <RouterProvider router={router} />
          </Suspense>
        </SyncWrapper>
      </AuthProvider>
    </PWAInstallProvider>
  );
}

export default App;

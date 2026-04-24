import React, { Suspense, lazy, useEffect } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Route, RouterProvider, createHashRouter, createRoutesFromElements } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PWAInstallProvider } from './context/PWAInstallContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Home } from './pages/dashboard/Home';
import { RouteErrorBoundary } from './pages/RouteErrorBoundary';
import { RoutePath } from './types';
import { useSync } from './hooks/useSync';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import {
  trackGoogleAuthFailed,
  trackGoogleAuthSucceeded,
} from './src/analytics/events';

// Lazy load non-critical routes to reduce initial bundle size
const SignIn = lazy(() => import('./pages/auth/SignIn').then(m => ({ default: m.SignIn })));
const SignUp = lazy(() => import('./pages/auth/SignUp').then(m => ({ default: m.SignUp })));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword').then(m => ({ default: m.ResetPassword })));
const MyNotes = lazy(() => import('./pages/dashboard/MyNotes').then(m => ({ default: m.MyNotes })));
const CreateNote = lazy(() => import('./pages/dashboard/CreateNote').then(m => ({ default: m.CreateNote })));
const SingleNote = lazy(() => import('./pages/dashboard/SingleNote').then(m => ({ default: m.SingleNote })));
const Account = lazy(() => import('./pages/dashboard/Account').then(m => ({ default: m.Account })));
const Insights = lazy(() => import('./pages/dashboard/Insights').then(m => ({ default: m.Insights })));
const Sanctuary = lazy(() => import('./pages/dashboard/Sanctuary').then(m => ({ default: m.Sanctuary })));
const FAQ = lazy(() => import('./pages/dashboard/FAQ').then(m => ({ default: m.FAQ })));
const PrivacyPolicy = lazy(() => import('./pages/dashboard/PrivacyPolicy').then(m => ({ default: m.PrivacyPolicy })));
const TermsOfService = lazy(() => import('./pages/dashboard/TermsOfService').then(m => ({ default: m.TermsOfService })));
const NotFound = lazy(() => import('./pages/NotFound').then(m => ({ default: m.NotFound })));

// Loading fallback for Suspense
const PageLoader = () => (
  <div className="flex-1 flex items-center justify-center min-h-[50vh]">
    <div className="h-8 w-8 rounded-full border-2 border-border border-t-green animate-spin" />
  </div>
);

const router = createHashRouter(
  createRoutesFromElements(
    <Route element={<DashboardLayout />} errorElement={<RouteErrorBoundary />}>
      <Route path={RoutePath.HOME} element={<Home />} />
      <Route path={RoutePath.FAQ} element={<FAQ />} />
      <Route path={RoutePath.PRIVACY} element={<PrivacyPolicy />} />
      <Route path={RoutePath.TERMS} element={<TermsOfService />} />

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
      <Route
        path={RoutePath.SANCTUARY}
        element={
          <ProtectedRoute>
            <Sanctuary />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Route>,
  ),
);

// Wrapper to initialize hooks inside Context
const SyncWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useSync();

  return <>{children}</>;
};

function App() {
  useEffect(() => {
    let isActive = true;

    const applyNativeChrome = async () => {
      if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
        return;
      }

      try {
        await StatusBar.setOverlaysWebView({ overlay: false });
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: '#121212' });
        await StatusBar.show();
      } catch (error) {
        console.warn('[native] Failed to align the Android status bar.', error);
      }

      try {
        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => resolve());
          });
        });

        if (!isActive) return;
        await SplashScreen.hide();
      } catch (error) {
        console.warn('[native] Failed to hide the Android splash screen.', error);
      }
    };

    void applyNativeChrome();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;
    let removeNativeUrlListener: (() => Promise<void>) | null = null;
    let lastHandledNativeUrl: string | null = null;
    
    const setupNativeOAuth = async () => {
      if (!isActive || !Capacitor.isNativePlatform()) {
        return;
      }

      const googleOAuth = await import('./src/auth/googleOAuth');

      if (!isActive) {
        return;
      }

      const handleNativeOAuthUrl = async (url: string) => {
        if (!url || url === lastHandledNativeUrl) {
          return;
        }

        lastHandledNativeUrl = url;
        const pendingSourcePath = googleOAuth.getPendingGoogleAuthPath() || RoutePath.LOGIN;
        const pendingRedirectPath = googleOAuth.getPendingGoogleAuthRedirectPath();
        const result = await googleOAuth.consumeNativeGoogleOAuthCallback(url);

        if (!isActive || !result.handled) {
          return;
        }

        if ('error' in result) {
          trackGoogleAuthFailed({
            sourcePath: pendingSourcePath,
            isNative: true,
            errorCode: result.error,
          });
          googleOAuth.stashGoogleAuthError(result.error);
        } else {
          trackGoogleAuthSucceeded({
            sourcePath: pendingSourcePath,
            redirectPath: pendingRedirectPath,
            isNative: true,
          });
        }

        googleOAuth.redirectToAppRoute(
          pendingSourcePath,
        );
      };

      const listener = await CapacitorApp.addListener('appUrlOpen', ({ url }) => {
        void handleNativeOAuthUrl(url);
      });
      removeNativeUrlListener = () => listener.remove();

      const launchData = await CapacitorApp.getLaunchUrl();
      if (launchData?.url) {
        await handleNativeOAuthUrl(launchData.url);
      }
    };

    void setupNativeOAuth();

    return () => {
      isActive = false;
      void removeNativeUrlListener?.();
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

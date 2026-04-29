import React, { Suspense, lazy, useEffect, useState } from 'react';
import { Navigate, Route, RouterProvider, createHashRouter, createRoutesFromElements } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PWAInstallProvider } from './context/PWAInstallContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { RouteLoadingFrame } from './components/ui/RouteLoadingFrame';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Home } from './pages/dashboard/Home';
import { RouteErrorBoundary } from './pages/RouteErrorBoundary';
import { RoutePath } from './types';
import { useSync } from './hooks/useSync';
import { MotionConfig } from 'motion/react';
import { trackGoogleAuthFailedDeferred, trackGoogleAuthSucceededDeferred } from './src/analytics/deferredEvents';

// Lazy load non-critical routes to reduce initial bundle size
const SignIn = lazy(() => import('./pages/auth/SignIn').then(m => ({ default: m.SignIn })));
const SignUp = lazy(() => import('./pages/auth/SignUp').then(m => ({ default: m.SignUp })));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword').then(m => ({ default: m.ResetPassword })));
const MyNotes = lazy(() => import('./pages/dashboard/MyNotes').then(m => ({ default: m.MyNotes })));
const CreateNote = lazy(() => import('./pages/dashboard/CreateNote').then(m => ({ default: m.CreateNote })));
const SingleNote = lazy(() => import('./pages/dashboard/SingleNote').then(m => ({ default: m.SingleNote })));
const ReleaseMode = lazy(() => import('./pages/dashboard/ReleaseMode').then(m => ({ default: m.ReleaseMode })));
const FutureLetters = lazy(() => import('./pages/dashboard/FutureLetters').then(m => ({ default: m.FutureLetters })));
const Account = lazy(() => import('./pages/dashboard/Account').then(m => ({ default: m.Account })));
const Insights = lazy(() => import('./pages/dashboard/Insights').then(m => ({ default: m.Insights })));
const LifeWiki = lazy(() => import('./pages/dashboard/LifeWiki').then(m => ({ default: m.LifeWiki })));
const FAQ = lazy(() => import('./pages/dashboard/FAQ').then(m => ({ default: m.FAQ })));
const AboutArabinda = lazy(() => import('./pages/dashboard/AboutArabinda').then(m => ({ default: m.AboutArabinda })));
const PrivacyPolicy = lazy(() => import('./pages/dashboard/PrivacyPolicy').then(m => ({ default: m.PrivacyPolicy })));
const NotFound = lazy(() => import('./pages/NotFound').then(m => ({ default: m.NotFound })));
const LazyVercelVitals = lazy(async () => {
  const [{ Analytics }, { SpeedInsights }] = await Promise.all([
    import('@vercel/analytics/react'),
    import('@vercel/speed-insights/react'),
  ]);

  return {
    default: () => (
      <>
        <Analytics />
        <SpeedInsights />
      </>
    ),
  };
});

const withRouteFallback = (element: React.ReactNode) => (
  <Suspense fallback={<RouteLoadingFrame />}>{element}</Suspense>
);

const router = createHashRouter(
  createRoutesFromElements(
    <Route element={<DashboardLayout />} errorElement={<RouteErrorBoundary />}>
      <Route path={RoutePath.HOME} element={<Home />} />
      <Route path={RoutePath.FAQ} element={withRouteFallback(<FAQ />)} />
      <Route path={RoutePath.ABOUT} element={withRouteFallback(<AboutArabinda />)} />
      <Route path={RoutePath.PRIVACY} element={withRouteFallback(<PrivacyPolicy />)} />
      <Route path={RoutePath.TERMS} element={<Navigate to={RoutePath.PRIVACY} replace />} />

      <Route path={RoutePath.LOGIN} element={withRouteFallback(<SignIn />)} />
      <Route path={RoutePath.SIGNUP} element={withRouteFallback(<SignUp />)} />
      <Route path={RoutePath.RESET_PASSWORD} element={withRouteFallback(<ResetPassword />)} />

      <Route
        path={RoutePath.NOTES}
        element={
          <ProtectedRoute>
            {withRouteFallback(<MyNotes />)}
          </ProtectedRoute>
        }
      />
      <Route
        path={RoutePath.CREATE_NOTE}
        element={
          <ProtectedRoute>
            {withRouteFallback(<CreateNote />)}
          </ProtectedRoute>
        }
      />
      <Route
        path={RoutePath.EDIT_NOTE}
        element={
          <ProtectedRoute>
            {withRouteFallback(<CreateNote />)}
          </ProtectedRoute>
        }
      />
      <Route
        path={RoutePath.NOTE_DETAIL}
        element={
          <ProtectedRoute>
            {withRouteFallback(<SingleNote />)}
          </ProtectedRoute>
        }
      />
      <Route
        path={RoutePath.RELEASE}
        element={
          <ProtectedRoute>
            {withRouteFallback(<ReleaseMode />)}
          </ProtectedRoute>
        }
      />
      <Route
        path={RoutePath.FUTURE_LETTERS}
        element={
          <ProtectedRoute>
            {withRouteFallback(<FutureLetters />)}
          </ProtectedRoute>
        }
      />
      <Route
        path={RoutePath.ACCOUNT}
        element={
          <ProtectedRoute>
            {withRouteFallback(<Account />)}
          </ProtectedRoute>
        }
      />
      <Route
        path={RoutePath.INSIGHTS}
        element={
          <ProtectedRoute>
            {withRouteFallback(<Insights />)}
          </ProtectedRoute>
        }
      />
      <Route
        path={RoutePath.WIKI}
        element={
          <ProtectedRoute>
            {withRouteFallback(<LifeWiki />)}
          </ProtectedRoute>
        }
      />
      <Route
        path={RoutePath.SANCTUARY}
        element={
          <ProtectedRoute>
            {withRouteFallback(<LifeWiki />)}
          </ProtectedRoute>
        }
      />
      <Route
        path={RoutePath.SANCTUARY_ARTICLE}
        element={
          <ProtectedRoute>
            {withRouteFallback(<LifeWiki />)}
          </ProtectedRoute>
        }
      />

      <Route path="*" element={withRouteFallback(<NotFound />)} />
    </Route>,
  ),
);

// Wrapper to initialize hooks inside Context
const SyncWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useSync();

  return <>{children}</>;
};

const scheduleIdleMount = (callback: () => void) => {
  const idleWindow = window as Window & {
    requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
    cancelIdleCallback?: (handle: number) => void;
  };

  if (idleWindow.requestIdleCallback) {
    const handle = idleWindow.requestIdleCallback(callback, { timeout: 3000 });
    return () => idleWindow.cancelIdleCallback?.(handle);
  }

  const handle = window.setTimeout(callback, 1200);
  return () => window.clearTimeout(handle);
};

const DeferredVercelVitals: React.FC = () => {
  const [shouldMount, setShouldMount] = useState(false);

  useEffect(() => {
    return scheduleIdleMount(() => setShouldMount(true));
  }, []);

  if (!shouldMount) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <LazyVercelVitals />
    </Suspense>
  );
};

function App() {
  useEffect(() => {
    let isActive = true;
    let observer: MutationObserver | null = null;

    const applyNativeChrome = async () => {
      const { Capacitor } = await import('@capacitor/core');

      if (!isActive || !Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
        return;
      }

      const { StatusBar, Style } = await import('@capacitor/status-bar');

      const updateStatusBar = async () => {
        if (!isActive) return;
        const isDark = document.documentElement.classList.contains('dark');
        try {
          await StatusBar.setOverlaysWebView({ overlay: false });
          await StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light });
          await StatusBar.setBackgroundColor({ color: isDark ? '#282a27' : '#f7f8f6' });
          await StatusBar.show();
        } catch (error) {
          console.warn('[native] Failed to align the Android status bar.', error);
        }
      };

      await updateStatusBar();

      observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === 'class') {
            void updateStatusBar();
          }
        });
      });

      observer.observe(document.documentElement, { attributes: true });
    };

    void applyNativeChrome();

    return () => {
      isActive = false;
      if (observer) {
        observer.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    let isActive = true;
    let removeNativeUrlListener: (() => Promise<void>) | null = null;
    let lastHandledNativeUrl: string | null = null;
    
    const setupNativeOAuth = async () => {
      const { Capacitor } = await import('@capacitor/core');

      if (!isActive || !Capacitor.isNativePlatform()) {
        return;
      }

      const { App: CapacitorApp } = await import('@capacitor/app');
      const googleOAuth = await import('./src/auth/googleOAuth');
      const { Browser } = await import('@capacitor/browser');

      if (!isActive) {
        return;
      }

      const handleNativeOAuthUrl = async (url: string) => {
        if (!url || url === lastHandledNativeUrl) {
          return;
        }

        lastHandledNativeUrl = url;
        const pendingSourcePath = googleOAuth.getPendingGoogleAuthPath() || RoutePath.LOGIN;
        const result = await googleOAuth.consumeNativeGoogleOAuthCallback(url);

        if (!isActive || !result.handled) {
          return;
        }

        if ('error' in result) {
          trackGoogleAuthFailedDeferred({
            sourcePath: pendingSourcePath,
            isNative: true,
            errorCode: result.error,
          });
          googleOAuth.stashGoogleAuthError(result.error);
        } else {
          trackGoogleAuthSucceededDeferred({
            sourcePath: pendingSourcePath,
            redirectPath: RoutePath.HOME,
            isNative: true,
          });
        }

        void Browser.close().catch(() => undefined);

        const completionPath =
          'error' in result
            ? pendingSourcePath
            : googleOAuth.consumeNativeGoogleAuthSuccessRedirectPath(pendingSourcePath);

        googleOAuth.redirectToAppRoute(completionPath);
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
        <DeferredVercelVitals />
        <SyncWrapper>
          <MotionConfig reducedMotion="user">
            <RouterProvider router={router} />
          </MotionConfig>
        </SyncWrapper>
      </AuthProvider>
    </PWAInstallProvider>
  );
}

export default App;

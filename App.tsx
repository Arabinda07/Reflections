import React, { Suspense, lazy } from 'react';
import { Navigate, Route, RouterProvider, createBrowserRouter, createRoutesFromElements, ScrollRestoration, Outlet } from 'react-router-dom';
import { RouteLoadingFrame } from './components/ui/RouteLoadingFrame';
import { RouteErrorBoundary } from './pages/RouteErrorBoundary';
import { RoutePath } from './types';
import { useNativeOAuthListener } from './hooks/useNativeOAuthListener';

const AuthenticatedAppShell = lazy(() => import('./layouts/AuthenticatedAppShell').then((m) => ({ default: m.AuthenticatedAppShell })));
const AuthAppShell = lazy(() => import('./layouts/AuthAppShell').then((m) => ({ default: m.AuthAppShell })));
const PublicAppShell = lazy(() => import('./layouts/PublicAppShell').then((m) => ({ default: m.PublicAppShell })));
const ProtectedRoute = lazy(() => import('./components/auth/ProtectedRoute').then((m) => ({ default: m.ProtectedRoute })));
const AppBootstrapper = lazy(() => import('./components/ui/AppBootstrapper').then((m) => ({ default: m.AppBootstrapper })));

const NativeOAuthBridge: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useNativeOAuthListener();
  return <>{children}</>;
};

const Landing = lazy(() => import('@/pages/dashboard/Landing').then((m) => ({ default: m.Landing })));
const SignIn = lazy(() => import('@/pages/auth/SignIn').then((m) => ({ default: m.SignIn })));
const SignUp = lazy(() => import('@/pages/auth/SignUp').then((m) => ({ default: m.SignUp })));
const ResetPassword = lazy(() => import('@/pages/auth/ResetPassword').then((m) => ({ default: m.ResetPassword })));
const MyNotes = lazy(() => import('@/pages/dashboard/MyNotes').then((m) => ({ default: m.MyNotes })));
const CreateNote = lazy(() => import('@/pages/dashboard/CreateNote').then((m) => ({ default: m.CreateNote })));
const SingleNote = lazy(() => import('@/pages/dashboard/SingleNote').then((m) => ({ default: m.SingleNote })));
const ReleaseMode = lazy(() => import('@/pages/dashboard/ReleaseMode').then((m) => ({ default: m.ReleaseMode })));
const FutureLetters = lazy(() => import('@/pages/dashboard/FutureLetters').then((m) => ({ default: m.FutureLetters })));
const Account = lazy(() => import('@/pages/dashboard/Account').then((m) => ({ default: m.Account })));
const Insights = lazy(() => import('@/pages/dashboard/Insights').then((m) => ({ default: m.Insights })));
const LifeWiki = lazy(() => import('@/pages/dashboard/LifeWiki').then((m) => ({ default: m.LifeWiki })));
const FAQ = lazy(() => import('@/pages/dashboard/FAQ').then((m) => ({ default: m.FAQ })));
const AboutArabinda = lazy(() => import('@/pages/dashboard/AboutArabinda').then((m) => ({ default: m.AboutArabinda })));
const PrivacyPolicy = lazy(() => import('@/pages/dashboard/PrivacyPolicy').then((m) => ({ default: m.PrivacyPolicy })));
const AuthCallback = lazy(() => import('@/pages/auth/AuthCallback').then((m) => ({ default: m.AuthCallback })));
const HomeAuthenticated = lazy(() => import('@/pages/dashboard/HomeAuthenticated').then((m) => ({ default: m.HomeAuthenticated })));
const NotFound = lazy(() => import('@/pages/NotFound').then((m) => ({ default: m.NotFound })));

const withRouteFallback = (element: React.ReactNode) => (
  <Suspense fallback={<RouteLoadingFrame />}>{element}</Suspense>
);

const withProtectedRoute = (element: React.ReactNode) =>
  withRouteFallback(<ProtectedRoute>{element}</ProtectedRoute>);

const withBootstrappedShell = (element: React.ReactNode) =>
  withRouteFallback(
    <NativeOAuthBridge>
      <AppBootstrapper>{withRouteFallback(element)}</AppBootstrapper>
    </NativeOAuthBridge>,
  );

const RootLayout = () => (
  <>
    <ScrollRestoration />
    <Outlet />
  </>
);

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<RootLayout />}>
      <Route element={withRouteFallback(<PublicAppShell />)} errorElement={<RouteErrorBoundary />}>
        <Route path={RoutePath.HOME} element={withRouteFallback(<Landing />)} />
        <Route path={RoutePath.FAQ} element={withRouteFallback(<FAQ />)} />
        <Route path={RoutePath.ABOUT} element={withRouteFallback(<AboutArabinda />)} />
        <Route path={RoutePath.PRIVACY} element={withRouteFallback(<PrivacyPolicy />)} />
      </Route>

      <Route
        element={withBootstrappedShell(<AuthAppShell />)}
        errorElement={<RouteErrorBoundary />}
      >
        <Route path="/signin" element={<Navigate to={RoutePath.LOGIN} replace />} />
        <Route path="/sign-in" element={<Navigate to={RoutePath.LOGIN} replace />} />
        <Route path={RoutePath.LOGIN} element={withRouteFallback(<SignIn />)} />
        <Route path={RoutePath.SIGNUP} element={withRouteFallback(<SignUp />)} />
        <Route path={RoutePath.RESET_PASSWORD} element={withRouteFallback(<ResetPassword />)} />
        <Route path={RoutePath.AUTH_CALLBACK} element={withRouteFallback(<AuthCallback />)} />
      </Route>

      <Route
        element={withBootstrappedShell(<AuthenticatedAppShell />)}
        errorElement={<RouteErrorBoundary />}
      >
        <Route path={RoutePath.DASHBOARD_ALIAS} element={<Navigate to={RoutePath.DASHBOARD} replace />} />
        <Route path={RoutePath.DASHBOARD} element={withProtectedRoute(withRouteFallback(<HomeAuthenticated />))} />
        <Route path={RoutePath.NOTES} element={withProtectedRoute(withRouteFallback(<MyNotes />))} />
        <Route path={RoutePath.CREATE_NOTE} element={withProtectedRoute(withRouteFallback(<CreateNote />))} />
        <Route path={RoutePath.EDIT_NOTE} element={withProtectedRoute(withRouteFallback(<CreateNote />))} />
        <Route path={RoutePath.NOTE_DETAIL} element={withProtectedRoute(withRouteFallback(<SingleNote />))} />
        <Route path={RoutePath.RELEASE} element={withProtectedRoute(withRouteFallback(<ReleaseMode />))} />
        <Route path={RoutePath.FUTURE_LETTERS} element={withProtectedRoute(withRouteFallback(<FutureLetters />))} />
        <Route path={RoutePath.ACCOUNT} element={withProtectedRoute(withRouteFallback(<Account />))} />
        <Route path={RoutePath.INSIGHTS} element={withProtectedRoute(withRouteFallback(<Insights />))} />
        <Route path={RoutePath.WIKI} element={withProtectedRoute(withRouteFallback(<LifeWiki />))} />
        <Route path={RoutePath.SANCTUARY} element={withProtectedRoute(withRouteFallback(<LifeWiki />))} />
        <Route path={RoutePath.SANCTUARY_ARTICLE} element={withProtectedRoute(withRouteFallback(<LifeWiki />))} />

        <Route path="*" element={withRouteFallback(<NotFound />)} />
      </Route>
    </Route>,
  ),
);

function App() {
  return <RouterProvider router={router} />;
}

export default App;

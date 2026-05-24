import React, { Suspense, lazy } from 'react';
import { Navigate, Route, RouterProvider, createBrowserRouter, createRoutesFromElements, ScrollRestoration, Outlet } from 'react-router-dom';
import { RouteLoadingFrame } from './components/ui/RouteLoadingFrame';
import { PublicAppShell } from './layouts/PublicAppShell';
import { RouteErrorBoundary } from './pages/RouteErrorBoundary';
import { LandingRoute } from './pages/dashboard/LandingRoute';
import { RoutePath } from './types';

const AuthenticatedAppShell = lazy(() => import('./layouts/AuthenticatedAppShell').then((m) => ({ default: m.AuthenticatedAppShell })));
const AuthAppShell = lazy(() => import('./layouts/AuthAppShell').then((m) => ({ default: m.AuthAppShell })));
const ProtectedRoute = lazy(() => import('./components/auth/ProtectedRoute').then((m) => ({ default: m.ProtectedRoute })));
const PrivateDataGate = lazy(() => import('./components/auth/PrivateDataGate').then((m) => ({ default: m.PrivateDataGate })));

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

const defaultRouteFallback = <RouteLoadingFrame />;
const authRouteFallback = (
  <div
    aria-hidden="true"
    className="surface-scope-paper page-wash min-h-[100dvh] bg-body"
  />
);
const writingRouteFallback = (
  <RouteLoadingFrame className="surface-scope-paper page-wash min-h-[100dvh] bg-body" />
);

const withRouteFallback = (
  element: React.ReactNode,
  fallback: React.ReactNode = defaultRouteFallback,
) => (
  <Suspense fallback={fallback}>{element}</Suspense>
);

const withProtectedRoute = (
  element: React.ReactNode,
  fallback: React.ReactNode = defaultRouteFallback,
) =>
  withRouteFallback(<ProtectedRoute fallback={fallback}>{element}</ProtectedRoute>, fallback);

const withPrivateRoute = (
  element: React.ReactNode,
  fallback: React.ReactNode = defaultRouteFallback,
) =>
  withProtectedRoute(
    withRouteFallback(<PrivateDataGate>{element}</PrivateDataGate>, fallback),
    fallback,
  );

const withAuthRouteFallback = (element: React.ReactNode) =>
  withRouteFallback(element, authRouteFallback);

const withWritingProtectedRoute = (element: React.ReactNode) =>
  withPrivateRoute(withRouteFallback(element, writingRouteFallback), writingRouteFallback);

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
        <Route path={RoutePath.HOME} element={<LandingRoute />} />
        <Route path={RoutePath.FAQ} element={withRouteFallback(<FAQ />)} />
        <Route path={RoutePath.ABOUT} element={withRouteFallback(<AboutArabinda />)} />
        <Route path={RoutePath.PRIVACY} element={withRouteFallback(<PrivacyPolicy />)} />
      </Route>

      <Route element={withRouteFallback(<AuthAppShell />, authRouteFallback)} errorElement={<RouteErrorBoundary />}>
        <Route path="/signin" element={<Navigate to={RoutePath.LOGIN} replace />} />
        <Route path="/sign-in" element={<Navigate to={RoutePath.LOGIN} replace />} />
        <Route path={RoutePath.LOGIN} element={withAuthRouteFallback(<SignIn />)} />
        <Route path={RoutePath.SIGNUP} element={withAuthRouteFallback(<SignUp />)} />
        <Route path={RoutePath.RESET_PASSWORD} element={withAuthRouteFallback(<ResetPassword />)} />
        <Route path={RoutePath.AUTH_CALLBACK} element={withAuthRouteFallback(<AuthCallback />)} />
      </Route>

      <Route element={withRouteFallback(<AuthenticatedAppShell />)} errorElement={<RouteErrorBoundary />}>
        <Route path={RoutePath.DASHBOARD_ALIAS} element={<Navigate to={RoutePath.DASHBOARD} replace />} />
        <Route path={RoutePath.DASHBOARD} element={withPrivateRoute(withRouteFallback(<HomeAuthenticated />))} />
        <Route path={RoutePath.NOTES} element={withPrivateRoute(withRouteFallback(<MyNotes />))} />
        <Route path={RoutePath.CREATE_NOTE} element={withWritingProtectedRoute(<CreateNote />)} />
        <Route path={RoutePath.EDIT_NOTE} element={withWritingProtectedRoute(<CreateNote />)} />
        <Route path={RoutePath.NOTE_DETAIL} element={withPrivateRoute(withRouteFallback(<SingleNote />))} />
        <Route path={RoutePath.RELEASE} element={withPrivateRoute(withRouteFallback(<ReleaseMode />))} />
        <Route path={RoutePath.FUTURE_LETTERS} element={withPrivateRoute(withRouteFallback(<FutureLetters />))} />
        <Route path={RoutePath.ACCOUNT} element={withProtectedRoute(withRouteFallback(<Account />))} />
        <Route path={RoutePath.INSIGHTS} element={withPrivateRoute(withRouteFallback(<Insights />))} />
        <Route path={RoutePath.WIKI} element={withPrivateRoute(withRouteFallback(<LifeWiki />))} />
        <Route path={RoutePath.SANCTUARY} element={withPrivateRoute(withRouteFallback(<LifeWiki />))} />
        <Route path={RoutePath.SANCTUARY_ARTICLE} element={withPrivateRoute(withRouteFallback(<LifeWiki />))} />

        <Route path="*" element={withRouteFallback(<NotFound />)} />
      </Route>
    </Route>,
  ),
);

function App() {
  return <RouterProvider router={router} />;
}

export default App;

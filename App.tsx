import React, { Suspense, lazy } from 'react';
import { Navigate, Route, RouterProvider, createBrowserRouter, createRoutesFromElements } from 'react-router-dom';
import { RouteLoadingFrame } from './components/ui/RouteLoadingFrame';
import { RouteErrorBoundary } from './pages/RouteErrorBoundary';
import { Landing } from './pages/dashboard/Landing';
import { RoutePath } from './types';

const AuthenticatedAppShell = lazy(() => import('./layouts/AuthenticatedAppShell').then((m) => ({ default: m.AuthenticatedAppShell })));
const ProtectedRoute = lazy(() => import('./components/auth/ProtectedRoute').then((m) => ({ default: m.ProtectedRoute })));

const SignIn = lazy(() => import('@/pages/auth/SignIn.tsx').then((m) => ({ default: m.SignIn })));
const SignUp = lazy(() => import('@/pages/auth/SignUp.tsx').then((m) => ({ default: m.SignUp })));
const ResetPassword = lazy(() => import('@/pages/auth/ResetPassword.tsx').then((m) => ({ default: m.ResetPassword })));
const MyNotes = lazy(() => import('@/pages/dashboard/MyNotes.tsx').then((m) => ({ default: m.MyNotes })));
const CreateNote = lazy(() => import('@/pages/dashboard/CreateNote.tsx').then((m) => ({ default: m.CreateNote })));
const SingleNote = lazy(() => import('@/pages/dashboard/SingleNote.tsx').then((m) => ({ default: m.SingleNote })));
const ReleaseMode = lazy(() => import('@/pages/dashboard/ReleaseMode.tsx').then((m) => ({ default: m.ReleaseMode })));
const FutureLetters = lazy(() => import('@/pages/dashboard/FutureLetters.tsx').then((m) => ({ default: m.FutureLetters })));
const Account = lazy(() => import('@/pages/dashboard/Account.tsx').then((m) => ({ default: m.Account })));
const Insights = lazy(() => import('@/pages/dashboard/Insights.tsx').then((m) => ({ default: m.Insights })));
const LifeWiki = lazy(() => import('@/pages/dashboard/LifeWiki.tsx').then((m) => ({ default: m.LifeWiki })));
const FAQ = lazy(() => import('@/pages/dashboard/FAQ.tsx').then((m) => ({ default: m.FAQ })));
const AboutArabinda = lazy(() => import('@/pages/dashboard/AboutArabinda.tsx').then((m) => ({ default: m.AboutArabinda })));
const PrivacyPolicy = lazy(() => import('@/pages/dashboard/PrivacyPolicy.tsx').then((m) => ({ default: m.PrivacyPolicy })));
const AuthCallback = lazy(() => import('@/pages/auth/AuthCallback.tsx').then((m) => ({ default: m.AuthCallback })));
const HomeAuthenticated = lazy(() => import('@/pages/dashboard/HomeAuthenticated.tsx').then((m) => ({ default: m.HomeAuthenticated })));
const NotFound = lazy(() => import('@/pages/NotFound.tsx').then((m) => ({ default: m.NotFound })));

const withRouteFallback = (element: React.ReactNode) => (
  <Suspense fallback={<RouteLoadingFrame />}>{element}</Suspense>
);

const withProtectedRoute = (element: React.ReactNode) =>
  withRouteFallback(<ProtectedRoute>{element}</ProtectedRoute>);

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route errorElement={<RouteErrorBoundary />}>
        <Route path={RoutePath.HOME} element={<Landing />} />
        <Route path={RoutePath.FAQ} element={withRouteFallback(<FAQ />)} />
        <Route path={RoutePath.ABOUT} element={withRouteFallback(<AboutArabinda />)} />
        <Route path={RoutePath.PRIVACY} element={withRouteFallback(<PrivacyPolicy />)} />
        <Route path={RoutePath.TERMS} element={<Navigate to={RoutePath.PRIVACY} replace />} />
      </Route>

      <Route element={withRouteFallback(<AuthenticatedAppShell />)} errorElement={<RouteErrorBoundary />}>
        <Route path={RoutePath.LOGIN} element={withRouteFallback(<SignIn />)} />
        <Route path={RoutePath.SIGNUP} element={withRouteFallback(<SignUp />)} />
        <Route path={RoutePath.RESET_PASSWORD} element={withRouteFallback(<ResetPassword />)} />
        <Route path={RoutePath.AUTH_CALLBACK} element={withRouteFallback(<AuthCallback />)} />

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
    </>,
  ),
);

function App() {
  return <RouterProvider router={router} />;
}

export default App;

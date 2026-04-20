import React, { Suspense, lazy, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PWAInstallProvider } from './context/PWAInstallContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Home } from './pages/dashboard/Home';
import { RoutePath } from './types';
import { useSync } from './hooks/useSync';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { supabase } from './src/supabaseClient';

// Lazy load non-critical routes to reduce initial bundle size
const SignIn = lazy(() => import('./pages/auth/SignIn').then(m => ({ default: m.SignIn })));
const SignUp = lazy(() => import('./pages/auth/SignUp').then(m => ({ default: m.SignUp })));
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
    <div className="w-8 h-8 rounded-full border-2 border-border border-t-blue animate-spin" />
  </div>
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
    // Detect if this is an OAuth popup callback
    const isPopup = window.opener && window.opener !== window;
    const hasAuthParams = window.location.hash.includes('access_token=') || 
                         window.location.hash.includes('error=') ||
                         window.location.search.includes('code=') ||
                         window.location.search.includes('error=');
    
    if (isPopup && hasAuthParams) {
      // Small delay fallback in case auth state doesn't trigger
      let timer: number;
      
      // Subscribe to auth state changes to ensure session is saved before closing
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'SIGNED_IN') {
          window.close();
        }
      });
      
      timer = window.setTimeout(() => {
        window.close();
      }, 2000);
      
      return () => {
        clearTimeout(timer);
        subscription.unsubscribe();
      };
    }
  }, []);

  return (
    <PWAInstallProvider>
      <AuthProvider>
        <Analytics />
        <SpeedInsights />
        <Router>
          <SyncWrapper>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Dashboard Layout (Shared by Guest and Auth users) */}
                <Route element={<DashboardLayout />}>
                  {/* Public Home Page (Handles both Guest and Auth states internally) */}
                  <Route path={RoutePath.HOME} element={<Home />} />
                  <Route path={RoutePath.FAQ} element={<FAQ />} />
                  <Route path={RoutePath.PRIVACY} element={<PrivacyPolicy />} />
                  
                  {/* Public Auth Routes - Guest only effectively via navigation logic */}
                  <Route path={RoutePath.LOGIN} element={<SignIn />} />
                  <Route path={RoutePath.SIGNUP} element={<SignUp />} />
                  
                  {/* Protected Routes - Redirect to Login if Guest */}
                  <Route path={RoutePath.NOTES} element={<ProtectedRoute><MyNotes /></ProtectedRoute>} />
                  <Route path={RoutePath.CREATE_NOTE} element={<ProtectedRoute><CreateNote /></ProtectedRoute>} />
                  <Route path={RoutePath.EDIT_NOTE} element={<ProtectedRoute><CreateNote /></ProtectedRoute>} />
                  <Route path={RoutePath.NOTE_DETAIL} element={<ProtectedRoute><SingleNote /></ProtectedRoute>} />
                  <Route path={RoutePath.ACCOUNT} element={<ProtectedRoute><Account /></ProtectedRoute>} />
                  <Route path={RoutePath.INSIGHTS} element={<ProtectedRoute><Insights /></ProtectedRoute>} />
                  
                  {/* Fallback inside layout */}
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </Suspense>
          </SyncWrapper>
        </Router>
      </AuthProvider>
    </PWAInstallProvider>
  );
}

export default App;
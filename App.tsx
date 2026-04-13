import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { DashboardLayout } from './layouts/DashboardLayout';
import { SignIn } from './pages/auth/SignIn';
import { SignUp } from './pages/auth/SignUp';
import { Home } from './pages/dashboard/Home';
import { MyNotes } from './pages/dashboard/MyNotes';
import { CreateNote } from './pages/dashboard/CreateNote';
import { SingleNote } from './pages/dashboard/SingleNote';
import { Account } from './pages/dashboard/Account';
import { Insights } from './pages/dashboard/Insights';
import { FAQ } from './pages/dashboard/FAQ';
import { RoutePath } from './types';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Auth Routes (Moved inside DashboardLayout for universal nav) */}


          {/* Dashboard Layout (Shared by Guest and Auth users) */}
          <Route element={<DashboardLayout />}>
            {/* Public Home Page (Handles both Guest and Auth states internally) */}
            <Route path={RoutePath.HOME} element={<Home />} />
            <Route path={RoutePath.FAQ} element={<FAQ />} />
            
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
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to={RoutePath.HOME} replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
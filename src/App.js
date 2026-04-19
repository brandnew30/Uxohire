import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import UXOHire from './UXOHire';
import TechDashboard from './TechDashboard';
import EmployerDashboard from './EmployerDashboard';
import ResetPasswordPage from './pages/ResetPasswordPage';
import EmployerOnboarding from './pages/EmployerOnboarding';

export default function App() {
  const [user, setUser] = useState(undefined); // undefined = loading
  const [accountType, setAccountType] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Fetch account type when user changes
  useEffect(() => {
    if (!user) { setAccountType(null); return; }
    supabase.from('user_accounts').select('account_type').eq('user_id', user.id).single()
      .then(({ data }) => setAccountType(data?.account_type || null));
  }, [user]);

  // Wait for auth to resolve before rendering
  if (user === undefined) return null;

  return (
    <BrowserRouter>
      <Routes>
        {/* Tech dashboard — protected, tech accounts only */}
        <Route
          path="/dashboard"
          element={
            !user
              ? <Navigate to="/login" replace state={{ returnTo: '/dashboard' }} />
              : accountType === 'employer'
                ? <Navigate to="/employer-dashboard" replace />
                : <TechDashboard user={user} />
          }
        />
        {/* Employer hub — protected, employer accounts only */}
        <Route
          path="/employer-dashboard"
          element={
            !user
              ? <Navigate to="/login" replace state={{ returnTo: '/employer-dashboard' }} />
              : accountType === 'technician'
                ? <Navigate to="/dashboard" replace />
                : <EmployerDashboard user={user} />
          }
        />
        {/* Employer onboarding — protected */}
        <Route
          path="/employer-onboarding"
          element={
            !user
              ? <Navigate to="/login" replace state={{ returnTo: '/employer-onboarding' }} />
              : <EmployerOnboarding user={user} />
          }
        />
        {/* Password reset — standalone page (handles Supabase email callback) */}
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        {/* Everything else handled by UXOHire (includes its own routing) */}
        <Route path="/*" element={<UXOHire user={user} />} />
      </Routes>
    </BrowserRouter>
  );
}

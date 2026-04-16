import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import UXOHire from './UXOHire';
import TechDashboard from './TechDashboard';
import EmployerDashboard from './EmployerDashboard';

export default function App() {
  const [user, setUser] = useState(undefined); // undefined = loading

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Wait for auth to resolve before rendering
  if (user === undefined) return null;

  return (
    <BrowserRouter>
      <Routes>
        {/* Tech dashboard — protected */}
        <Route
          path="/dashboard"
          element={
            user
              ? <TechDashboard user={user} />
              : <Navigate to="/login" replace state={{ returnTo: '/dashboard' }} />
          }
        />
        {/* Employer hub — protected */}
        <Route
          path="/employer-dashboard"
          element={
            user
              ? <EmployerDashboard user={user} />
              : <Navigate to="/login" replace state={{ returnTo: '/employer-dashboard' }} />
          }
        />
        {/* Everything else handled by UXOHire (includes its own routing) */}
        <Route path="/*" element={<UXOHire user={user} />} />
      </Routes>
    </BrowserRouter>
  );
}

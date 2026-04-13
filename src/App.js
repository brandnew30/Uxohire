import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import UXOHire from './UXOHire';
import TechDashboard from './TechDashboard';

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
        {/* Dashboard — protected; redirect to /login if not authenticated */}
        <Route
          path="/dashboard"
          element={
            user
              ? <TechDashboard user={user} />
              : <Navigate to="/login" replace state={{ returnTo: '/dashboard' }} />
          }
        />
        {/* Everything else handled by UXOHire (includes its own routing) */}
        <Route path="/*" element={<UXOHire user={user} />} />
      </Routes>
    </BrowserRouter>
  );
}

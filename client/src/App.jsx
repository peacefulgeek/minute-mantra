import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import AppHeader from './components/AppHeader';
import BottomNav from './components/BottomNav';

// Eager imports — no lazy loading, no chunk failures, no blank pages
import Landing from './pages/Landing';
import Enter from './pages/Enter';
import MagicLinkVerify from './pages/MagicLinkVerify';
import Home from './pages/Home';
import History from './pages/History';
import Favorites from './pages/Favorites';
import MantraDetail from './pages/MantraDetail';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Subscription from './pages/Subscription';
import Billing from './pages/Billing';
import About from './pages/About';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Onboarding from './pages/Onboarding';
import Admin from './pages/Admin';
import Library from './pages/Library';
import Sprint from './pages/Sprint';

// Pages that have their own full-screen layout (no shared header/nav)
const STANDALONE_PATHS = ['/enter', '/auth/verify', '/onboarding'];

function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ background: 'linear-gradient(160deg, #fdf8f0 0%, #fef3e2 50%, #fdf0e0 100%)' }}>
      <div className="text-center">
        <img src="/logo-transparent.png" alt="" style={{ width: 64, height: 64, margin: '0 auto 16px' }} />
        <p className="text-sm tracking-widest" style={{ color: '#a07850', fontFamily: 'system-ui, sans-serif' }}>
          MINUTE MANTRA
        </p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/enter" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/enter" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

function AppLayout() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingScreen />;

  const isLanding = location.pathname === '/' && !user;
  const isStandalone = STANDALONE_PATHS.some(p => location.pathname.startsWith(p));
  const isAdmin = location.pathname.startsWith('/admin');

  // Show header on all pages except standalone and the public landing
  const showHeader = !isLanding && !isStandalone;
  // Show bottom nav only for logged-in users on app pages
  const showBottomNav = user && !isStandalone && !isAdmin && !isLanding;

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#fdf8f0' }}>
      {showHeader && <AppHeader />}

      <main
        className="flex-1 overflow-y-auto"
        style={{ paddingTop: showHeader ? '56px' : '0', paddingBottom: showBottomNav ? '72px' : '0' }}
      >
        <Routes>
          {/* ── PUBLIC ── */}
          <Route path="/" element={user ? <Navigate to="/home" replace /> : <Landing />} />
          <Route path="/enter" element={user ? <Navigate to="/home" replace /> : <Enter />} />
          <Route path="/auth/verify" element={<MagicLinkVerify />} />

          {/* Static pages */}
          <Route path="/about" element={<About />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />

          {/* ── ONBOARDING ── */}
          <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />

          {/* ── APP (protected) ── */}
          <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
          <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
          <Route path="/library" element={<ProtectedRoute><Library /></ProtectedRoute>} />
          <Route path="/mantra/:id" element={<ProtectedRoute><MantraDetail /></ProtectedRoute>} />
          <Route path="/sprint" element={<ProtectedRoute><Sprint /></ProtectedRoute>} />

          {/* Settings */}
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/settings/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/settings/subscription" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />
          <Route path="/settings/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
          <Route path="/settings/notifications" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/settings/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />

          {/* ── ADMIN ── */}
          <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
          <Route path="/admin/*" element={<AdminRoute><Admin /></AdminRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to={user ? '/home' : '/'} replace />} />
        </Routes>
      </main>

      {showBottomNav && <BottomNav />}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <AppLayout />
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

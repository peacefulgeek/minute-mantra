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
      <style>{`
        @keyframes omPulse {
          0%, 100% { transform: scale(1); opacity: 0.85; }
          50% { transform: scale(1.08); opacity: 1; }
        }
        @keyframes omGlow {
          0%, 100% { box-shadow: 0 0 30px rgba(184,134,11,0.15), 0 0 60px rgba(184,134,11,0.08); }
          50% { box-shadow: 0 0 50px rgba(184,134,11,0.3), 0 0 100px rgba(184,134,11,0.12); }
        }
        @keyframes ringRotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes ringPulse {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.04); }
        }
        @keyframes dotOrbit {
          0% { transform: rotate(0deg) translateX(68px) rotate(0deg); opacity: 0.6; }
          50% { opacity: 1; }
          100% { transform: rotate(360deg) translateX(68px) rotate(-360deg); opacity: 0.6; }
        }
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div className="text-center" style={{ animation: 'fadeInUp 0.8s ease-out' }}>
        {/* Outer container for the Om symbol */}
        <div style={{ position: 'relative', width: 160, height: 160, margin: '0 auto 24px' }}>
          {/* Rotating ring */}
          <div style={{
            position: 'absolute', inset: 0,
            borderRadius: '50%',
            border: '1.5px solid transparent',
            borderTopColor: 'rgba(184,134,11,0.4)',
            borderRightColor: 'rgba(184,134,11,0.15)',
            animation: 'ringRotate 4s linear infinite',
          }} />
          {/* Pulsing outer ring */}
          <div style={{
            position: 'absolute', inset: 6,
            borderRadius: '50%',
            border: '1px solid rgba(184,134,11,0.12)',
            animation: 'ringPulse 3s ease-in-out infinite',
          }} />
          {/* Inner glow circle */}
          <div style={{
            position: 'absolute', inset: 20,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(184,134,11,0.08) 0%, transparent 70%)',
            animation: 'omGlow 3s ease-in-out infinite',
          }} />
          {/* Om symbol */}
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'omPulse 3s ease-in-out infinite',
          }}>
            <span style={{
              fontSize: '72px',
              lineHeight: 1,
              color: '#b8860b',
              fontFamily: "'Noto Sans Devanagari', 'Cormorant Garamond', Georgia, serif",
              textShadow: '0 0 20px rgba(184,134,11,0.2)',
              userSelect: 'none',
            }}>
              \u0950
            </span>
          </div>
          {/* Orbiting dots */}
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              position: 'absolute',
              top: '50%', left: '50%',
              width: 5, height: 5,
              marginTop: -2.5, marginLeft: -2.5,
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${['#b8860b','#d4a017','#c9941a'][i]}, ${['#d4a017','#e6b422','#b8860b'][i]})`,
              animation: `dotOrbit ${6 + i * 2}s linear infinite`,
              animationDelay: `${i * -2}s`,
            }} />))}
        </div>
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

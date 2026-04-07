import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

export default function AppHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu on outside click
  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Close menu on route change
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  const isAdmin = user?.role === 'admin' || user?.email === 'paul@creativelab.tv';

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-5 py-3"
      style={{
        background: 'rgba(253,248,240,0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(184,134,11,0.12)',
      }}
    >
      {/* Logo */}
      <Link to={user ? '/home' : '/'} className="flex items-center gap-2 no-underline">
        <span className="text-xl" style={{ color: '#b8860b' }}>ॐ</span>
        <span className="tracking-widest text-xs font-light hidden sm:block"
          style={{ fontFamily: 'Georgia, serif', letterSpacing: '0.15em', color: '#7a6050' }}>
          MINUTE MANTRA
        </span>
      </Link>

      {/* Right side */}
      <div className="flex items-center gap-3" ref={menuRef}>
        {!user ? (
          /* Not logged in — show Enter button */
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate('/enter')}
            className="px-5 py-2 rounded-full text-xs tracking-widest font-medium"
            style={{
              background: 'linear-gradient(135deg, #b8860b, #d4a017)',
              color: '#5a3e28',
              fontFamily: 'system-ui, sans-serif',
              boxShadow: '0 0 16px rgba(184,134,11,0.25)',
            }}
          >
            ENTER
          </motion.button>
        ) : (
          /* Logged in — show hamburger menu */
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setMenuOpen(o => !o)}
              className="flex flex-col justify-center items-center w-9 h-9 rounded-full gap-1.5"
              style={{
                background: menuOpen ? 'rgba(184,134,11,0.15)' : 'rgba(160,120,80,0.08)',
                border: `1px solid ${menuOpen ? 'rgba(184,134,11,0.4)' : 'rgba(160,120,80,0.2)'}`,
                transition: 'all 0.2s',
              }}
              aria-label="Menu"
            >
              <motion.span
                animate={menuOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.2 }}
                className="block w-4 h-px rounded-full"
                style={{ background: menuOpen ? '#b8860b' : 'rgba(120,90,60,0.6)' }}
              />
              <motion.span
                animate={menuOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
                transition={{ duration: 0.15 }}
                className="block w-4 h-px rounded-full"
                style={{ background: menuOpen ? '#b8860b' : 'rgba(120,90,60,0.6)' }}
              />
              <motion.span
                animate={menuOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.2 }}
                className="block w-4 h-px rounded-full"
                style={{ background: menuOpen ? '#b8860b' : 'rgba(120,90,60,0.6)' }}
              />
            </motion.button>

            {/* Dropdown */}
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="absolute right-0 mt-2 rounded-2xl overflow-hidden"
                  style={{
                    width: 220,
                    background: 'rgba(253,248,240,0.98)',
                    border: '1px solid rgba(184,134,11,0.2)',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.08), 0 0 0 1px rgba(184,134,11,0.1)',
                    backdropFilter: 'blur(20px)',
                  }}
                >
                  {/* User info */}
                  <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(184,134,11,0.1)' }}>
                    <p className="text-xs mb-0.5" style={{ fontFamily: 'system-ui, sans-serif', color: '#a07850' }}>Signed in as</p>
                    <p className="text-sm truncate" style={{ fontFamily: 'system-ui, sans-serif', color: '#5a3e28' }}>{user.email}</p>
                    {user.subscription_tier === 'platinum' && (
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs" style={{ background: 'rgba(184,134,11,0.2)', color: '#b8860b', fontFamily: 'system-ui, sans-serif' }}>
                        Platinum
                      </span>
                    )}
                  </div>

                  {/* Nav items */}
                  <nav className="py-2">
                    <MenuItem to="/home" icon="🏠" label="Home" />
                    <MenuItem to="/history" icon="📅" label="History" />
                    <MenuItem to="/favorites" icon="♡" label="Favorites" />
                    <MenuItem to="/library" icon="📚" label="Mantra Library" />

                    <div className="mx-3 my-1 h-px" style={{ background: 'rgba(184,134,11,0.1)' }} />

                    <MenuItem to="/settings" icon="⚙" label="Settings" />
                    <MenuItem to="/settings/profile" icon="👤" label="Profile" />
                    <MenuItem to="/settings/subscription" icon="✦" label="Subscription" />
                    <MenuItem to="/settings/notifications" icon="🔔" label="Notifications" />

                    {isAdmin && (
                      <>
                        <div className="mx-3 my-1 h-px" style={{ background: 'rgba(184,134,11,0.2)' }} />
                        <MenuItem to="/admin" icon="⚡" label="Admin Panel" gold />
                      </>
                    )}

                    <div className="mx-3 my-1 h-px" style={{ background: 'rgba(184,134,11,0.1)' }} />

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                      style={{ fontFamily: 'system-ui, sans-serif' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(184,134,11,0.06)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <span className="text-sm opacity-50">↩</span>
                      <span className="text-sm" style={{ color: '#a07850' }}>Sign out</span>
                    </button>
                  </nav>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </header>
  );
}

function MenuItem({ to, icon, label, gold }) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className="flex items-center gap-3 px-4 py-2.5 transition-colors no-underline"
      style={{
        background: isActive ? 'rgba(184,134,11,0.1)' : 'transparent',
        fontFamily: 'system-ui, sans-serif',
      }}
      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(184,134,11,0.06)'; }}
      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
    >
      <span className="text-sm w-5 text-center opacity-60">{icon}</span>
      <span className="text-sm" style={{ color: gold ? '#b8860b' : isActive ? '#5a3e28' : '#7a6050' }}>
        {label}
      </span>
      {isActive && (
        <span className="ml-auto w-1 h-1 rounded-full" style={{ background: '#b8860b' }} />
      )}
    </Link>
  );
}

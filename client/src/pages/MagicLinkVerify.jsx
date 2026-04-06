import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

export default function MagicLinkVerify() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refetch } = useAuth();
  const [status, setStatus] = useState('verifying'); // verifying | success | error
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setErrorMsg('No token found in the link. Please request a new magic link.');
      return;
    }

    async function verify() {
      try {
        const res = await fetch(`/api/auth/magic-link/verify?token=${token}`, {
          method: 'GET',
          credentials: 'include',
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Link expired or invalid');
        setStatus('success');
        await refetch();
        // Redirect: new users → onboarding, returning → home
        setTimeout(() => navigate(data.isNew ? '/onboarding' : '/'), 1200);
      } catch (err) {
        setStatus('error');
        setErrorMsg(err.message);
      }
    }

    verify();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #fdf8f0 0%, #fef3e2 50%, #fdf0e0 100%)', fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* Soft radial glow */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 60% at 50% 40%, rgba(200,134,10,0.08) 0%, transparent 70%)' }} />

      {/* Sacred geometry background — Flower of Life */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none">
        <svg viewBox="0 0 500 500" className="w-full max-w-3xl">
          <circle cx="250" cy="250" r="80" fill="none" stroke="#c8860a" strokeWidth="1.5" />
          {[0,60,120,180,240,300].map((deg,i) => {
            const rad = deg * Math.PI / 180;
            return <circle key={i} cx={250 + 80*Math.cos(rad)} cy={250 + 80*Math.sin(rad)} r="80" fill="none" stroke="#c8860a" strokeWidth="1.5" />;
          })}
          {[0,60,120,180,240,300].map((deg,i) => {
            const rad = deg * Math.PI / 180;
            return <circle key={`o${i}`} cx={250 + 160*Math.cos(rad)} cy={250 + 160*Math.sin(rad)} r="80" fill="none" stroke="#c8860a" strokeWidth="1" />;
          })}
          <circle cx="250" cy="250" r="240" fill="none" stroke="#c8860a" strokeWidth="1" />
        </svg>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-sm relative z-10"
      >
        {status === 'verifying' && (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              style={{ fontSize: 48, marginBottom: 24, color: '#c8860a', fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              ✦
            </motion.div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, fontWeight: 400, color: '#3d2b1f', marginBottom: 8 }}>
              Entering your practice...
            </h2>
            <p style={{ color: '#a07850', fontSize: 13, letterSpacing: '0.06em' }}>One moment of stillness</p>
          </>
        )}

        {status === 'success' && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              style={{ fontSize: 56, marginBottom: 20, color: '#c8860a', fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              ॐ
            </motion.div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 26, fontWeight: 400, color: '#3d2b1f', marginBottom: 8 }}>
              Welcome.
            </h2>
            <p style={{ color: '#a07850', fontSize: 14, letterSpacing: '0.06em' }}>
              Taking you to your practice...
            </p>
          </>
        )}

        {status === 'error' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            style={{
              background: 'rgba(255,255,255,0.75)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(200,134,10,0.18)',
              borderRadius: 24,
              padding: '48px 36px',
              textAlign: 'center',
              boxShadow: '0 8px 40px rgba(200,134,10,0.08), 0 2px 12px rgba(61,43,31,0.06)',
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 20 }}>🪷</div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 24, fontWeight: 400, color: '#3d2b1f', marginBottom: 12 }}>
              This link has expired
            </h2>
            <p style={{ color: '#7a5c3e', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>{errorMsg}</p>
            <motion.button
              onClick={() => navigate('/enter')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              style={{
                padding: '15px 32px', borderRadius: 50, border: 'none',
                background: 'linear-gradient(135deg, #c8860a 0%, #e0a020 100%)',
                color: '#fff8ee', fontSize: 13, fontWeight: 600, letterSpacing: '0.15em',
                cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                boxShadow: '0 4px 20px rgba(200,134,10,0.3)',
              }}
            >
              REQUEST NEW LINK
            </motion.button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

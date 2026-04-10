import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function Enter() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #fdf8f0 0%, #fef3e2 50%, #fdf0e0 100%)', fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* Soft radial glow */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 60% at 50% 40%, rgba(200,134,10,0.08) 0%, transparent 70%)' }} />

      {/* Sacred geometry background — Flower of Life */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none">
        <svg viewBox="0 0 500 500" className="w-full max-w-3xl">
          <circle cx="250" cy="250" r="80" fill="none" stroke="#d4922a" strokeWidth="1.5" />
          {[0,60,120,180,240,300].map((deg,i) => {
            const rad = deg * Math.PI / 180;
            return <circle key={i} cx={250 + 80*Math.cos(rad)} cy={250 + 80*Math.sin(rad)} r="80" fill="none" stroke="#d4922a" strokeWidth="1.5" />;
          })}
          {[0,60,120,180,240,300].map((deg,i) => {
            const rad = deg * Math.PI / 180;
            return <circle key={`o${i}`} cx={250 + 160*Math.cos(rad)} cy={250 + 160*Math.sin(rad)} r="80" fill="none" stroke="#d4922a" strokeWidth="1" />;
          })}
          <circle cx="250" cy="250" r="240" fill="none" stroke="#d4922a" strokeWidth="1" />
        </svg>
      </div>

      {/* Back to landing */}
      <Link to="/" className="absolute top-6 left-6 flex items-center gap-2 transition-colors text-sm"
        style={{ color: '#a07850', fontFamily: "'DM Sans', sans-serif" }}>
        ← Back
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.15, duration: 0.6 }}
            style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}>
            <img src="/logo-transparent.png" alt="Minute Mantra" style={{ width: 72, height: 72 }} />
          </motion.div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, fontWeight: 400, letterSpacing: '0.25em', color: '#3d2b1f', margin: 0 }}>MINUTE MANTRA</h1>
          <p style={{ color: '#a07850', fontSize: 13, marginTop: 6, letterSpacing: '0.08em' }}>One mantra. One minute. Every morning.</p>
        </div>

        <AnimatePresence mode="wait">
          {!sent ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4 }}
              style={{
                background: 'rgba(255,255,255,0.75)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(200,134,10,0.18)',
                borderRadius: 24,
                padding: '40px 36px',
                boxShadow: '0 8px 40px rgba(200,134,10,0.08), 0 2px 12px rgba(61,43,31,0.06)',
              }}
            >
              <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 26, fontWeight: 400, color: '#3d2b1f', textAlign: 'center', margin: '0 0 8px' }}>Enter your practice</h2>
              <p style={{ color: '#a07850', fontSize: 14, textAlign: 'center', marginBottom: 28, lineHeight: 1.6 }}>
                We'll send a magic link to your email —<br />no password needed.
              </p>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  autoFocus
                  style={{
                    width: '100%', padding: '14px 18px', borderRadius: 12,
                    border: '1.5px solid rgba(200,134,10,0.25)',
                    background: 'rgba(253,248,240,0.8)', color: '#3d2b1f',
                    fontSize: 15, outline: 'none', fontFamily: "'DM Sans', sans-serif",
                    transition: 'border-color 0.2s', boxSizing: 'border-box',
                  }}
                  onFocus={e => e.target.style.borderColor = '#d4922a'}
                  onBlur={e => e.target.style.borderColor = 'rgba(200,134,10,0.25)'}
                />

                {error && (
                  <p style={{ color: '#c0392b', fontSize: 13, textAlign: 'center', margin: 0 }}>{error}</p>
                )}

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.97 }}
                  style={{
                    width: '100%', padding: '15px 24px', borderRadius: 50, border: 'none',
                    background: loading ? 'rgba(200,134,10,0.4)' : 'linear-gradient(135deg, #d4922a 0%, #e0a020 100%)',
                    color: '#fff8ee', fontSize: 13, fontWeight: 600, letterSpacing: '0.15em',
                    cursor: loading ? 'wait' : 'pointer', fontFamily: "'DM Sans', sans-serif",
                    boxShadow: loading ? 'none' : '0 4px 20px rgba(200,134,10,0.3)',
                  }}
                >
                  {loading ? 'SENDING...' : 'SEND MAGIC LINK'}
                </motion.button>
              </form>

              <p style={{ textAlign: 'center', fontSize: 12, color: '#c4a882', marginTop: 20 }}>
                New here? We'll create your account automatically.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="sent"
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
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 180, delay: 0.15 }}
                style={{ fontSize: 52, marginBottom: 20 }}
              >
                🪷
              </motion.div>
              <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 28, fontWeight: 400, color: '#3d2b1f', margin: '0 0 12px' }}>Check your inbox</h2>
              <p style={{ color: '#7a5c3e', fontSize: 15, lineHeight: 1.7, marginBottom: 8 }}>We sent a magic link to</p>
              <p style={{ color: '#d4922a', fontSize: 16, fontWeight: 600, marginBottom: 20 }}>{email}</p>
              <p style={{ color: '#b09070', fontSize: 13, lineHeight: 1.7 }}>
                The link expires in 15 minutes.<br />
                Check your spam folder if you don't see it.
              </p>
              <div style={{ margin: '24px auto', width: 40, height: 1, background: 'rgba(200,134,10,0.3)' }} />
              <button
                onClick={() => { setSent(false); setEmail(''); setError(''); }}
                style={{ background: 'none', border: 'none', color: '#b09070', fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
                onMouseEnter={e => e.currentTarget.style.color = '#d4922a'}
                onMouseLeave={e => e.currentTarget.style.color = '#b09070'}
              >
                Try a different email
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

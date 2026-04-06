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
      style={{ background: 'linear-gradient(135deg, #0d0d1a 0%, #1a1a2e 100%)', fontFamily: 'Georgia, serif' }}>

      {/* Background geometry */}
      <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
        <svg viewBox="0 0 400 400" className="w-full max-w-2xl">
          {[100, 66, 134, 128.6, 71.4, 128.6, 71.4].map((cy, i) => {
            const cx = i === 0 ? 200 : i <= 2 ? 200 : i <= 4 ? 200 + (i % 2 === 0 ? 57.2 : -57.2) : 200 + (i % 2 === 0 ? 57.2 : -57.2);
            const actualCy = i === 0 ? 200 : i === 1 ? 132 : i === 2 ? 268 : i === 3 ? 166 : i === 4 ? 166 : 234;
            return <circle key={i} cx={cx} cy={actualCy} r={68} fill="none" stroke="#b8860b" strokeWidth="1" />;
          })}
        </svg>
      </div>

      {/* Back to landing */}
      <Link to="/" className="absolute top-6 left-6 flex items-center gap-2 text-white/30 hover:text-white/60 transition-colors text-sm"
        style={{ fontFamily: 'system-ui, sans-serif' }}>
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
          <div className="text-5xl mb-3" style={{ color: '#b8860b' }}>ॐ</div>
          <h1 className="text-2xl font-light tracking-widest text-white/80">MINUTE MANTRA</h1>
          <p className="text-white/40 text-sm mt-2" style={{ fontFamily: 'system-ui, sans-serif' }}>
            One mantra. One minute. Every morning.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {!sent ? (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-3xl p-8"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(184,134,11,0.2)',
                backdropFilter: 'blur(20px)',
              }}
            >
              <h2 className="text-xl font-light text-white/80 mb-2 text-center">Enter your practice</h2>
              <p className="text-white/40 text-sm text-center mb-8" style={{ fontFamily: 'system-ui, sans-serif' }}>
                We'll send a magic link to your email — no password needed.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    autoFocus
                    className="w-full px-5 py-4 rounded-xl text-white/80 placeholder-white/20 outline-none transition-all"
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      fontFamily: 'system-ui, sans-serif',
                      fontSize: 16,
                    }}
                    onFocus={e => e.target.style.borderColor = 'rgba(184,134,11,0.5)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  />
                </div>

                {error && (
                  <p className="text-red-400 text-sm text-center" style={{ fontFamily: 'system-ui, sans-serif' }}>{error}</p>
                )}

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  className="w-full py-4 rounded-xl text-base tracking-widest font-medium transition-all"
                  style={{
                    background: loading ? 'rgba(184,134,11,0.4)' : 'linear-gradient(135deg, #b8860b, #d4a017)',
                    color: '#1a1a2e',
                    cursor: loading ? 'wait' : 'pointer',
                  }}
                >
                  {loading ? 'SENDING...' : 'SEND MAGIC LINK'}
                </motion.button>
              </form>

              <p className="text-center text-xs text-white/25 mt-6" style={{ fontFamily: 'system-ui, sans-serif' }}>
                New here? We'll create your account automatically.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="sent"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-3xl p-10 text-center"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(184,134,11,0.2)',
              }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                className="text-5xl mb-6"
              >
                ✉️
              </motion.div>
              <h2 className="text-2xl font-light text-white/80 mb-4">Check your inbox</h2>
              <p className="text-white/50 leading-relaxed mb-6" style={{ fontFamily: 'system-ui, sans-serif' }}>
                We sent a magic link to<br />
                <span style={{ color: '#b8860b' }}>{email}</span>
              </p>
              <p className="text-white/30 text-sm" style={{ fontFamily: 'system-ui, sans-serif' }}>
                The link expires in 15 minutes.<br />
                Check your spam folder if you don't see it.
              </p>
              <button
                onClick={() => { setSent(false); setEmail(''); }}
                className="mt-8 text-sm text-white/30 hover:text-white/60 transition-colors"
                style={{ fontFamily: 'system-ui, sans-serif' }}
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

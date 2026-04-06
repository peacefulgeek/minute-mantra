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
    <div className="min-h-screen flex items-center justify-center px-6"
      style={{ background: 'linear-gradient(135deg, #0d0d1a 0%, #1a1a2e 100%)', fontFamily: 'Georgia, serif' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-sm"
      >
        {status === 'verifying' && (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="text-4xl mb-6"
              style={{ color: '#b8860b' }}
            >
              ✦
            </motion.div>
            <h2 className="text-xl font-light text-white/70">Entering your practice...</h2>
          </>
        )}

        {status === 'success' && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="text-5xl mb-6"
            >
              ॐ
            </motion.div>
            <h2 className="text-xl font-light text-white/80">Welcome.</h2>
            <p className="text-white/40 text-sm mt-2" style={{ fontFamily: 'system-ui, sans-serif' }}>Taking you to your practice...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-4xl mb-6">🙏</div>
            <h2 className="text-xl font-light text-white/80 mb-4">This link has expired</h2>
            <p className="text-white/50 text-sm mb-8" style={{ fontFamily: 'system-ui, sans-serif' }}>{errorMsg}</p>
            <button
              onClick={() => navigate('/enter')}
              className="px-8 py-3 rounded-full text-sm tracking-widest"
              style={{ background: 'linear-gradient(135deg, #b8860b, #d4a017)', color: '#1a1a2e' }}
            >
              REQUEST NEW LINK
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}

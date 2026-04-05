import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSent(true);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: 'var(--bg-base)' }}>
      <div className="w-full max-w-sm">
        <h1 className="font-serif text-2xl mb-2 text-center" style={{ color: 'var(--text-primary)' }}>Reset Password</h1>
        {sent ? (
          <div className="text-center">
            <p className="font-sans text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              Check your email for a reset link.
            </p>
            <Link to="/login" className="font-sans text-sm" style={{ color: 'var(--text-accent)' }}>
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-6">
            <input
              type="email"
              placeholder="Your email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3.5 rounded-xl font-sans text-sm outline-none"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            />
            {error && <p className="text-sm text-center" style={{ color: '#FF3B30' }}>{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl font-serif text-base"
              style={{ background: 'var(--text-accent)', color: 'var(--bg-base)', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
            <Link to="/login" className="text-center font-sans text-sm" style={{ color: 'var(--text-secondary)' }}>
              Back to sign in
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 pt-safe" style={{ background: 'var(--bg-base)' }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="font-serif text-4xl mb-2" style={{ color: 'var(--text-accent)' }}>ॐ</h1>
          <h2 className="font-serif text-2xl" style={{ color: 'var(--text-primary)' }}>Minute Mantra</h2>
          <p className="font-sans text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            One mantra. One minute. Every morning.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
            required
            className="w-full px-4 py-3.5 rounded-xl font-sans text-sm outline-none"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
            }}
          />
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
            required
            className="w-full px-4 py-3.5 rounded-xl font-sans text-sm outline-none"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
            }}
          />

          {error && (
            <p className="text-sm text-center" style={{ color: '#FF3B30' }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl font-serif text-lg tracking-wide mt-1"
            style={{
              background: 'var(--text-accent)',
              color: 'var(--bg-base)',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="flex items-center justify-between mt-5">
          <Link
            to="/forgot-password"
            className="font-sans text-sm"
            style={{ color: 'var(--text-secondary)' }}
          >
            Forgot password?
          </Link>
          <Link
            to="/signup"
            className="font-sans text-sm"
            style={{ color: 'var(--text-accent)' }}
          >
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}

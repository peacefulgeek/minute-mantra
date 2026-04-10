import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check } from '@phosphor-icons/react';
import { useAuth } from '../contexts/AuthContext';

const FREE_FEATURES = [
  'Daily mantra + context card',
  '60-second timer with sacred geometry',
  'Audio pronunciation',
  'Morning notifications (email + push)',
  'Streak tracking & calendar',
  'Up to 5 favorites',
  '"Go Deeper" links to PaulWagner.com',
];

const PLATINUM_FEATURES = [
  'Everything in Free',
  'Extended timers (2, 5, 10 minutes)',
  'Mala counter (108 beads)',
  'Unlimited favorites',
  'Full mantra library (browse & filter)',
  'Singing bowl ambient sound',
];

export default function Subscription() {
  const { user, refetch } = useAuth();
  const navigate = useNavigate();
  const isPlatinum = user?.subscription_tier === 'platinum';
  const [plan, setPlan] = useState('annual');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubscribe() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/subscriptions/checkout-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create checkout');

      // Open Square checkout in a new tab
      window.open(data.checkoutUrl, '_blank');
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }

  async function handleCancel() {
    if (!confirm('Cancel your subscription? You\'ll keep Platinum access until the end of your billing period.')) return;
    setLoading(true);
    try {
      const res = await fetch('/api/subscriptions/cancel', { method: 'POST', credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await refetch();
      alert(`Subscription canceled. Platinum access continues until ${data.effective_date || 'end of period'}.`);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen pt-safe px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/settings')} style={{ color: 'var(--text-secondary)' }}>
          <ArrowLeft size={22} />
        </button>
        <h1 className="font-serif text-xl" style={{ color: 'var(--text-primary)' }}>Subscription</h1>
      </div>

      {isPlatinum ? (
        /* Platinum user view */
        <div>
          <div
            className="rounded-xl p-5 mb-6 text-center"
            style={{ background: 'rgba(212,146,42,0.1)', border: '1px solid var(--border-color)' }}
          >
            <p className="font-serif text-xl mb-1" style={{ color: 'var(--text-accent)' }}>✦ Platinum</p>
            <p className="font-sans text-sm" style={{ color: 'var(--text-secondary)' }}>
              Plan: {user?.subscription_plan === 'annual' ? 'Annual ($9.88/yr)' : user?.subscription_plan === 'admin_granted' ? 'Granted by admin' : 'Monthly ($1.08/mo)'}
            </p>
            <p className="font-sans text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
              Status: {user?.subscription_status}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {PLATINUM_FEATURES.map(f => (
              <div key={f} className="flex items-center gap-2">
                <Check size={16} style={{ color: 'var(--text-accent)', flexShrink: 0 }} />
                <span className="font-sans text-sm" style={{ color: 'var(--text-primary)' }}>{f}</span>
              </div>
            ))}
          </div>

          {user?.subscription_status === 'active' && user?.subscription_plan !== 'admin_granted' && (
            <button
              onClick={handleCancel}
              disabled={loading}
              className="w-full mt-8 py-3 rounded-xl font-sans text-sm"
              style={{ background: 'rgba(255,59,48,0.1)', color: '#FF3B30', border: '1px solid rgba(255,59,48,0.2)' }}
            >
              Cancel Subscription
            </button>
          )}
        </div>
      ) : (
        /* Upgrade view — opens Square checkout in new tab */
        <div>
          <p className="font-serif text-lg mb-6 text-center" style={{ color: 'var(--text-primary)' }}>
            Upgrade to Platinum
          </p>

          {/* Plan selector */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => setPlan('monthly')}
              className="flex-1 py-4 rounded-xl text-center"
              style={{
                background: plan === 'monthly' ? 'var(--text-accent)' : 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                color: plan === 'monthly' ? 'var(--bg-base)' : 'var(--text-primary)',
              }}
            >
              <p className="font-serif text-lg">$1.08</p>
              <p className="font-sans text-xs mt-0.5">per month</p>
            </button>
            <button
              onClick={() => setPlan('annual')}
              className="flex-1 py-4 rounded-xl text-center relative"
              style={{
                background: plan === 'annual' ? 'var(--text-accent)' : 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                color: plan === 'annual' ? 'var(--bg-base)' : 'var(--text-primary)',
              }}
            >
              <span
                className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-xs px-2 py-0.5 rounded-full font-sans"
                style={{ background: '#2d6a2d', color: '#fff', whiteSpace: 'nowrap' }}
              >
                Best Value
              </span>
              <p className="font-serif text-lg">$9.88</p>
              <p className="font-sans text-xs mt-0.5">per year · Save 24%</p>
            </button>
          </div>

          {/* Features */}
          <div className="flex flex-col gap-2 mb-6">
            {PLATINUM_FEATURES.map(f => (
              <div key={f} className="flex items-center gap-2">
                <Check size={14} style={{ color: 'var(--text-accent)', flexShrink: 0 }} />
                <span className="font-sans text-sm" style={{ color: 'var(--text-secondary)' }}>{f}</span>
              </div>
            ))}
          </div>

          {error && (
            <p className="text-sm text-center mb-4" style={{ color: '#FF3B30' }}>{error}</p>
          )}

          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full py-4 rounded-xl font-serif text-lg tracking-wide"
            style={{
              background: 'var(--text-accent)',
              color: 'var(--bg-base)',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Creating checkout...' : `Subscribe — ${plan === 'annual' ? '$9.88/yr' : '$1.08/mo'}`}
          </button>

          <p className="text-xs text-center mt-3 font-sans" style={{ color: 'var(--text-secondary)' }}>
            Secure checkout powered by Square. Opens in a new tab.
            <br />Cancel anytime. No partial refunds.
          </p>
        </div>
      )}
    </div>
  );
}

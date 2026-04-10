import React, { useState } from 'react';
import { Check, X } from '@phosphor-icons/react';

const FREE_PERKS = [
  { label: '3 daily mantras', included: true },
  { label: '60-second timer', included: true },
  { label: 'Audio pronunciation', included: true },
  { label: 'Streak tracking', included: true },
  { label: 'Up to 5 favorites', included: true },
];

const GOLD_EXTRAS = [
  'Unlimited daily mantras',
  'Extended timers (2, 5, 10 min)',
  'Mala counter (108 beads)',
  'Unlimited favorites',
  'Full mantra library (365)',
  'Singing bowl ambient sound',
];

export default function UpgradeModal({ open, onClose, freeUsed = 3, freeLimit = 3 }) {
  const [plan, setPlan] = useState('annual');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  async function handleUpgrade() {
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
      window.open(data.checkoutUrl, '_blank');
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(30, 20, 10, 0.6)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 400,
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'var(--bg-card, #fffaf3)',
          borderRadius: 20,
          border: '1px solid var(--border-color, rgba(184,134,11,0.15))',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          animation: 'modalSlideUp 0.35s ease-out',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: 'rgba(0,0,0,0.06)',
            border: 'none',
            borderRadius: '50%',
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text-secondary, #7a5c3e)',
          }}
        >
          <X size={16} weight="bold" />
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', padding: '28px 24px 0' }}>
          <div style={{ fontSize: 44, marginBottom: 8 }}>✨</div>
          <h2
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: 22,
              fontWeight: 600,
              color: 'var(--text-primary, #3d2b1f)',
              margin: '0 0 6px',
            }}
          >
            You've Used All 3 Free Sessions
          </h2>

          {/* Progress dots */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 12 }}>
            {Array.from({ length: freeLimit }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: i < freeUsed
                    ? 'linear-gradient(135deg, #b8860b, #d4a017)'
                    : 'rgba(184,134,11,0.15)',
                  boxShadow: i < freeUsed ? '0 0 5px rgba(184,134,11,0.4)' : 'none',
                }}
              />
            ))}
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', marginLeft: 2, fontFamily: "'DM Sans', sans-serif" }}>
              {freeUsed} of {freeLimit}
            </span>
          </div>

          <p style={{
            fontSize: 13,
            color: 'var(--text-secondary, #7a5c3e)',
            lineHeight: 1.5,
            margin: '0 0 16px',
            fontFamily: "'DM Sans', sans-serif",
          }}>
            Upgrade to <strong style={{ color: '#b8860b' }}>Gold</strong> to continue your practice with unlimited mantras and premium features.
          </p>
        </div>

        {/* Pricing comparison */}
        <div style={{ padding: '0 20px 16px' }}>
          {/* Plan toggle */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <button
              onClick={() => setPlan('monthly')}
              style={{
                flex: 1,
                padding: '12px 8px',
                borderRadius: 12,
                border: plan === 'monthly' ? '2px solid #b8860b' : '1px solid var(--border-color, rgba(184,134,11,0.15))',
                background: plan === 'monthly' ? 'rgba(184,134,11,0.08)' : 'transparent',
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              <p style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: 20,
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: 0,
              }}>$1.08</p>
              <p style={{
                fontSize: 11,
                color: 'var(--text-secondary)',
                margin: '2px 0 0',
                fontFamily: "'DM Sans', sans-serif",
              }}>per month</p>
            </button>
            <button
              onClick={() => setPlan('annual')}
              style={{
                flex: 1,
                padding: '12px 8px',
                borderRadius: 12,
                border: plan === 'annual' ? '2px solid #b8860b' : '1px solid var(--border-color, rgba(184,134,11,0.15))',
                background: plan === 'annual' ? 'rgba(184,134,11,0.08)' : 'transparent',
                cursor: 'pointer',
                textAlign: 'center',
                position: 'relative',
              }}
            >
              <span style={{
                position: 'absolute',
                top: -8,
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: 10,
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: 10,
                background: '#2d6a2d',
                color: '#fff',
                whiteSpace: 'nowrap',
                fontFamily: "'DM Sans', sans-serif",
              }}>Best Value</span>
              <p style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: 20,
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: 0,
              }}>$9.88</p>
              <p style={{
                fontSize: 11,
                color: 'var(--text-secondary)',
                margin: '2px 0 0',
                fontFamily: "'DM Sans', sans-serif",
              }}>per year · Save 24%</p>
            </button>
          </div>

          {/* Feature comparison */}
          <div style={{
            background: 'rgba(184,134,11,0.04)',
            borderRadius: 12,
            padding: '14px 16px',
            marginBottom: 16,
          }}>
            <p style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 0.8,
              color: 'var(--text-secondary)',
              margin: '0 0 10px',
              fontFamily: "'DM Sans', sans-serif",
            }}>Gold includes</p>
            {GOLD_EXTRAS.map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <Check size={14} weight="bold" style={{ color: '#b8860b', flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: 'var(--text-primary)', fontFamily: "'DM Sans', sans-serif" }}>{f}</span>
              </div>
            ))}
          </div>

          {/* CTA button */}
          {error && (
            <p style={{ fontSize: 12, color: '#FF3B30', textAlign: 'center', marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>{error}</p>
          )}
          <button
            onClick={handleUpgrade}
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px 0',
              borderRadius: 14,
              border: 'none',
              background: 'linear-gradient(135deg, #b8860b, #d4a017)',
              color: '#fff',
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: 18,
              fontWeight: 600,
              cursor: loading ? 'wait' : 'pointer',
              opacity: loading ? 0.7 : 1,
              letterSpacing: 0.3,
              boxShadow: '0 4px 16px rgba(184,134,11,0.3)',
            }}
          >
            {loading ? 'Opening checkout...' : `Upgrade — ${plan === 'annual' ? '$9.88/yr' : '$1.08/mo'}`}
          </button>

          <p style={{
            fontSize: 10,
            color: 'var(--text-secondary)',
            textAlign: 'center',
            marginTop: 10,
            fontFamily: "'DM Sans', sans-serif",
            lineHeight: 1.4,
          }}>
            Secure checkout via Square · Cancel anytime
          </p>
        </div>
      </div>

      <style>{`
        @keyframes modalSlideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

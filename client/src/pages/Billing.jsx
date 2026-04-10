import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from '@phosphor-icons/react';
import { useAuth } from '../contexts/AuthContext';

export default function Billing() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pt-safe px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/settings')} style={{ color: 'var(--text-secondary)' }}>
          <ArrowLeft size={22} />
        </button>
        <h1 className="font-serif text-xl" style={{ color: 'var(--text-primary)' }}>Billing</h1>
      </div>

      {user?.subscription_tier !== 'gold' ? (
        <div className="text-center py-16">
          <p className="font-serif text-lg mb-4" style={{ color: 'var(--text-primary)' }}>No active subscription</p>
          <button
            onClick={() => navigate('/settings/subscription')}
            className="px-6 py-3 rounded-xl font-serif"
            style={{ background: 'var(--text-accent)', color: 'var(--bg-base)' }}
          >
            Upgrade to Gold
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div
            className="rounded-xl p-4"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
          >
            <p className="font-sans text-xs uppercase tracking-wide mb-2" style={{ color: 'var(--text-secondary)' }}>
              Current Plan
            </p>
            <p className="font-serif text-base" style={{ color: 'var(--text-primary)' }}>
              {user?.subscription_plan === 'annual' ? 'Annual — $9.88/year' : 'Monthly — $1.08/month'}
            </p>
            <p className="font-sans text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
              Status: {user?.subscription_status}
            </p>
          </div>

          <p className="font-sans text-sm text-center" style={{ color: 'var(--text-secondary)' }}>
            Payment details are managed securely by Square. To update your payment method or view invoices, please use the contact form on our website.
          </p>
        </div>
      )}
    </div>
  );
}

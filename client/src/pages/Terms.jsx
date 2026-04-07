import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from '@phosphor-icons/react';

export default function Terms() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen pt-safe px-4 py-6" style={{ background: 'var(--bg-base)' }}>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} style={{ color: 'var(--text-secondary)' }}>
          <ArrowLeft size={22} />
        </button>
        <h1 className="font-serif text-xl" style={{ color: 'var(--text-primary)' }}>Terms of Service</h1>
      </div>
      <div className="max-w-md mx-auto font-sans text-sm leading-relaxed space-y-4" style={{ color: 'var(--text-secondary)' }}>
        <p><strong style={{ color: 'var(--text-primary)' }}>Use of Service</strong><br />
        Minute Mantra is provided for personal spiritual practice. You may not reproduce or redistribute the mantra content without permission.</p>
        <p><strong style={{ color: 'var(--text-primary)' }}>Subscriptions</strong><br />
        Platinum subscriptions are billed monthly ($0.99) or annually ($9.99). Subscriptions auto-renew. You may cancel at any time; no partial refunds are issued.</p>
        <p><strong style={{ color: 'var(--text-primary)' }}>Account</strong><br />
        You are responsible for maintaining the security of your account. We reserve the right to terminate accounts that violate these terms.</p>
        <p><strong style={{ color: 'var(--text-primary)' }}>Disclaimer</strong><br />
        Minute Mantra is not a substitute for medical, psychological, or religious guidance. Practice at your own discretion.</p>
        <p><strong style={{ color: 'var(--text-primary)' }}>Contact</strong><br />
        <a href="mailto:paul@paulwagner.com" style={{ color: 'var(--text-accent)' }}>paul@paulwagner.com</a></p>
      </div>
    </div>
  );
}

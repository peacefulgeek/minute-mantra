import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from '@phosphor-icons/react';

export default function Privacy() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen pt-safe px-4 py-6" style={{ background: 'var(--bg-base)' }}>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} style={{ color: 'var(--text-secondary)' }}>
          <ArrowLeft size={22} />
        </button>
        <h1 className="font-serif text-xl" style={{ color: 'var(--text-primary)' }}>Privacy Policy</h1>
      </div>
      <div className="max-w-md mx-auto font-sans text-sm leading-relaxed space-y-4" style={{ color: 'var(--text-secondary)' }}>
        <p><strong style={{ color: 'var(--text-primary)' }}>Data We Collect</strong><br />
        We collect your email address, display name, timezone, and practice session data (which mantras you chanted, for how long). We do not sell your data.</p>
        <p><strong style={{ color: 'var(--text-primary)' }}>Payment Data</strong><br />
        Payment information is processed by Square. We never store your credit card details.</p>
        <p><strong style={{ color: 'var(--text-primary)' }}>Notifications</strong><br />
        If you enable push notifications, we store your push subscription token to deliver daily mantra reminders. You can disable this at any time in Settings.</p>
        <p><strong style={{ color: 'var(--text-primary)' }}>Email</strong><br />
        We send a daily mantra email if you opt in. You can unsubscribe at any time via the link in any email.</p>
        <p><strong style={{ color: 'var(--text-primary)' }}>Contact</strong><br />
        Questions? Use the contact form on our website.</p>
      </div>
    </div>
  );
}

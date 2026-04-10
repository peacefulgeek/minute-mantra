import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, CreditCard, Bell, Info, Lock, SignOut, CaretRight } from '@phosphor-icons/react';
import { useAuth } from '../contexts/AuthContext';

export default function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const sections = [
    {
      title: 'Account',
      items: [
        { icon: User, label: 'Profile & Notifications', to: '/settings/profile' },
        { icon: CreditCard, label: 'Subscription', to: '/settings/subscription' },
        { icon: Lock, label: 'Billing & Payment', to: '/settings/billing' },
      ],
    },
    {
      title: 'Info',
      items: [
        { icon: Info, label: 'About Minute Mantra', to: '/about' },
        { icon: Lock, label: 'Privacy Policy', to: '/privacy' },
        { icon: Lock, label: 'Terms of Service', to: '/terms' },
      ],
    },
  ];

  return (
    <div className="min-h-screen pt-safe px-4 py-6">
      <h1 className="font-serif text-2xl mb-2 px-1" style={{ color: 'var(--text-accent)' }}>Settings</h1>

      {/* User info */}
      <div
        className="rounded-xl p-4 mb-6 flex items-center gap-3"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center font-serif text-lg"
          style={{ background: 'var(--text-accent)', color: 'var(--bg-base)' }}
        >
          {(user?.display_name || user?.email || '?')[0].toUpperCase()}
        </div>
        <div>
          <p className="font-sans text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            {user?.display_name || user?.email}
          </p>
          <p className="font-sans text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {user?.subscription_tier === 'gold' ? '✦ Gold' : 'Free plan'}
          </p>
        </div>
      </div>

      {sections.map(section => (
        <div key={section.title} className="mb-6">
          <p className="font-sans text-xs tracking-widest uppercase mb-2 px-1" style={{ color: 'var(--text-secondary)' }}>
            {section.title}
          </p>
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-color)' }}>
            {section.items.map((item, i) => (
              <button
                key={item.label}
                onClick={() => navigate(item.to)}
                className="w-full flex items-center gap-3 px-4 py-3.5"
                style={{
                  background: 'var(--bg-card)',
                  borderBottom: i < section.items.length - 1 ? '1px solid var(--border-color)' : 'none',
                  color: 'var(--text-primary)',
                }}
              >
                <item.icon size={18} style={{ color: 'var(--text-secondary)' }} />
                <span className="flex-1 text-left font-sans text-sm">{item.label}</span>
                <CaretRight size={14} style={{ color: 'var(--text-secondary)' }} />
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Sign out */}
      <button
        onClick={async () => { await logout(); navigate('/'); }}
        className="w-full py-3.5 rounded-xl font-sans text-sm flex items-center justify-center gap-2"
        style={{
          background: 'rgba(255,59,48,0.1)',
          color: '#FF3B30',
          border: '1px solid rgba(255,59,48,0.2)',
        }}
      >
        <SignOut size={18} />
        Sign Out
      </button>
    </div>
  );
}

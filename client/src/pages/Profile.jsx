import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from '@phosphor-icons/react';
import { useAuth } from '../contexts/AuthContext';

const TIMEZONES = [
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Anchorage', 'Pacific/Honolulu', 'Europe/London', 'Europe/Paris',
  'Europe/Berlin', 'Asia/Kolkata', 'Asia/Tokyo', 'Asia/Shanghai',
  'Australia/Sydney', 'Pacific/Auckland',
];

export default function Profile() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    display_name: user?.display_name || '',
    timezone: user?.timezone || 'America/New_York',
    notification_time: user?.notification_time?.substring(0, 5) || '07:00',
    email_notifications_enabled: user?.email_notifications_enabled ?? true,
    newsletter_opted_in: user?.newsletter_opted_in ?? false,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await updateUser(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {}
    setSaving(false);
  }

  return (
    <div className="min-h-screen pt-safe px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/settings')} style={{ color: 'var(--text-secondary)' }}>
          <ArrowLeft size={22} />
        </button>
        <h1 className="font-serif text-xl" style={{ color: 'var(--text-primary)' }}>Profile & Notifications</h1>
      </div>

      <div className="flex flex-col gap-4">
        {/* Display name */}
        <div>
          <label className="font-sans text-xs tracking-wide uppercase mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>
            Display Name
          </label>
          <input
            type="text"
            value={form.display_name}
            onChange={e => setForm(p => ({ ...p, display_name: e.target.value }))}
            placeholder="Your name"
            className="w-full px-4 py-3 rounded-xl font-sans text-sm outline-none"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        {/* Email (read-only) */}
        <div>
          <label className="font-sans text-xs tracking-wide uppercase mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>
            Email
          </label>
          <div
            className="w-full px-4 py-3 rounded-xl font-sans text-sm"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
          >
            {user?.email}
          </div>
        </div>

        {/* Timezone */}
        <div>
          <label className="font-sans text-xs tracking-wide uppercase mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>
            Timezone
          </label>
          <select
            value={form.timezone}
            onChange={e => setForm(p => ({ ...p, timezone: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl font-sans text-sm outline-none"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
            }}
          >
            {TIMEZONES.map(tz => (
              <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>

        {/* Notification time */}
        <div>
          <label className="font-sans text-xs tracking-wide uppercase mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>
            Morning Notification Time
          </label>
          <input
            type="time"
            value={form.notification_time}
            onChange={e => setForm(p => ({ ...p, notification_time: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl font-sans text-sm outline-none"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        {/* Toggles */}
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-color)' }}>
          {[
            { key: 'email_notifications_enabled', label: 'Email notifications', desc: 'Daily mantra in your inbox' },
            { key: 'newsletter_opted_in', label: 'Weekly Mantra Wisdom', desc: 'Weekly newsletter from Paul Wagner' },
          ].map((item, i) => (
            <div
              key={item.key}
              className="flex items-center justify-between px-4 py-3.5"
              style={{
                background: 'var(--bg-card)',
                borderBottom: i === 0 ? '1px solid var(--border-color)' : 'none',
              }}
            >
              <div>
                <p className="font-sans text-sm" style={{ color: 'var(--text-primary)' }}>{item.label}</p>
                <p className="font-sans text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{item.desc}</p>
              </div>
              <button
                onClick={() => setForm(p => ({ ...p, [item.key]: !p[item.key] }))}
                className="w-12 h-6 rounded-full relative transition-all duration-200"
                style={{
                  background: form[item.key] ? 'var(--text-accent)' : 'rgba(255,255,255,0.15)',
                }}
              >
                <span
                  className="absolute top-0.5 w-5 h-5 rounded-full transition-all duration-200"
                  style={{
                    background: '#fff',
                    left: form[item.key] ? '26px' : '2px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  }}
                />
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3.5 rounded-xl font-serif text-base tracking-wide mt-2"
          style={{
            background: saved ? '#2d6a2d' : 'var(--text-accent)',
            color: 'var(--bg-base)',
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

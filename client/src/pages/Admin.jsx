import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import AppHeader from '../components/AppHeader';

const TABS = ['Overview', 'Users', 'Mantras', 'Revenue', 'Emails'];

const USER_FILTERS = [
  { value: '', label: 'All Users' },
  { value: 'free', label: 'Free' },
  { value: 'paying', label: 'Paying Subscribers' },
  { value: 'granted', label: 'Admin Granted' },
  { value: 'canceled', label: 'Canceled' },
];

// Determine user category for display
function getUserCategory(u) {
  if (u.subscription_plan === 'monthly' && u.subscription_status === 'active') return 'paying_monthly';
  if (u.subscription_plan === 'annual' && u.subscription_status === 'active') return 'paying_annual';
  if (u.subscription_plan === 'admin_granted' && u.subscription_tier === 'platinum') return 'granted';
  if (u.subscription_status === 'canceled') return 'canceled';
  if (u.subscription_status === 'past_due') return 'past_due';
  return 'free';
}

function getCategoryBadge(category) {
  switch (category) {
    case 'paying_monthly':
      return { label: 'Monthly', bg: 'rgba(100,149,237,0.15)', color: '#6495ed' };
    case 'paying_annual':
      return { label: 'Annual', bg: 'rgba(100,149,237,0.15)', color: '#6495ed' };
    case 'granted':
      return { label: 'Granted', bg: 'rgba(184,134,11,0.15)', color: '#b8860b' };
    case 'canceled':
      return { label: 'Canceled', bg: 'rgba(220,38,38,0.15)', color: '#ef4444' };
    case 'past_due':
      return { label: 'Past Due', bg: 'rgba(220,160,38,0.2)', color: '#dca026' };
    default:
      return { label: 'Free', bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' };
  }
}

function getTierBadge(tier) {
  if (tier === 'platinum') {
    return { label: 'Platinum', bg: 'rgba(184,134,11,0.2)', color: '#b8860b' };
  }
  return { label: 'Free', bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' };
}

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('Overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [mantras, setMantras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newTier, setNewTier] = useState('free');
  const [actionLoading, setActionLoading] = useState(null);
  const [userFilter, setUserFilter] = useState('');

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!user) { navigate('/enter'); return; }
    if (!isAdmin) { navigate('/'); return; }
    fetchStats();
  }, [user]);

  useEffect(() => {
    if (tab === 'Users') fetchUsers();
    if (tab === 'Mantras') fetchMantras();
  }, [tab, page, search, userFilter]);

  async function fetchStats() {
    try {
      const res = await fetch('/api/admin/stats', { credentials: 'include' });
      const data = await res.json();
      setStats(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function fetchUsers() {
    try {
      const params = new URLSearchParams({ page, limit: 25, search, filter: userFilter });
      const res = await fetch(`/api/admin/users?${params}`, { credentials: 'include' });
      const data = await res.json();
      setUsers(data.users || []);
    } catch (e) { console.error(e); }
  }

  async function fetchMantras() {
    try {
      const params = new URLSearchParams({ page, limit: 25, search });
      const res = await fetch(`/api/admin/mantras?${params}`, { credentials: 'include' });
      const data = await res.json();
      setMantras(data.mantras || []);
    } catch (e) { console.error(e); }
  }

  async function sendTestNotification() {
    await fetch('/api/admin/test-notification', { method: 'POST', credentials: 'include' });
    alert('Test notification sent!');
  }

  async function runMorningCron() {
    const res = await fetch('/api/admin/run-cron', { method: 'POST', credentials: 'include' });
    const data = await res.json();
    alert(`Cron ran: ${data.sent || 0} emails sent`);
  }

  async function addUser() {
    if (!newEmail) return;
    setActionLoading('add');
    try {
      const res = await fetch('/api/admin/add-user', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail, tier: newTier, plan: newTier === 'platinum' ? 'admin_granted' : 'none' }),
      });
      const data = await res.json();
      if (data.ok) { setNewEmail(''); setShowAddUser(false); fetchUsers(); fetchStats(); }
      else alert(data.error || 'Failed to add user');
    } catch (e) { alert('Failed to add user'); }
    setActionLoading(null);
  }

  async function grantPlatinum(userId) {
    if (!confirm('Grant this user free Platinum access?')) return;
    setActionLoading(userId);
    try {
      await fetch('/api/admin/set-tier', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, tier: 'platinum' }),
      });
      fetchUsers();
      fetchStats();
    } catch (e) { alert('Failed to grant platinum'); }
    setActionLoading(null);
  }

  async function revokePlatinum(userId, category) {
    // Only allow revoking admin-granted platinum, not paying subscribers
    if (category === 'paying_monthly' || category === 'paying_annual') {
      alert('This user has an active Square subscription. To cancel their subscription, they must cancel through their account or you can use the Square dashboard.');
      return;
    }
    if (!confirm('Revoke this user\'s Platinum access and set to Free?')) return;
    setActionLoading(userId);
    try {
      await fetch('/api/admin/set-tier', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, tier: 'free' }),
      });
      fetchUsers();
      fetchStats();
    } catch (e) { alert('Failed to revoke platinum'); }
    setActionLoading(null);
  }

  async function deleteUser(userId, email) {
    if (!confirm(`Delete user ${email}? This cannot be undone.`)) return;
    setActionLoading(userId);
    try {
      await fetch(`/api/admin/delete-user/${userId}`, { method: 'DELETE', credentials: 'include' });
      fetchUsers();
      fetchStats();
    } catch (e) { alert('Failed to delete user'); }
    setActionLoading(null);
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen" style={{ background: '#0d0d1a', color: '#f0ebe3', fontFamily: 'system-ui, sans-serif' }}>
      <AppHeader />

      <div className="pt-16 max-w-7xl mx-auto px-4 py-8">
        {/* Page title */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-light" style={{ fontFamily: 'Georgia, serif', color: '#f0ebe3' }}>Admin Panel</h1>
            <p className="text-sm text-white/40 mt-1">Minute Mantra</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 overflow-x-auto pb-1">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setPage(1); setSearch(''); }}
              className="px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-all"
              style={{
                background: tab === t ? 'rgba(184,134,11,0.2)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${tab === t ? 'rgba(184,134,11,0.4)' : 'rgba(255,255,255,0.08)'}`,
                color: tab === t ? '#b8860b' : 'rgba(255,255,255,0.5)',
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {tab === 'Overview' && (
          <div>
            {loading ? (
              <div className="text-white/30 text-center py-20">Loading stats...</div>
            ) : stats ? (
              <div className="space-y-8">
                {/* KPI cards — row 1: user counts */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard label="Total Users" value={stats.total_users?.toLocaleString() || '—'} icon="👤" />
                  <StatCard label="Free Users" value={stats.free_users?.toLocaleString() || '—'} icon="🆓" />
                  <StatCard label="Platinum Total" value={stats.platinum_users?.toLocaleString() || '—'} icon="✦" gold />
                  <StatCard label="Active Streaks" value={stats.active_streaks?.toLocaleString() || '—'} icon="🔥" />
                </div>

                {/* KPI cards — row 2: subscriber breakdown */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard label="Paying Monthly" value={stats.monthly_subs?.toLocaleString() || '0'} icon="💳" />
                  <StatCard label="Paying Annual" value={stats.annual_subs?.toLocaleString() || '0'} icon="📅" />
                  <StatCard label="Admin Granted" value={stats.granted_subs?.toLocaleString() || '0'} icon="🎁" gold />
                  <StatCard label="Churn (30d)" value={stats.churned_30d?.toLocaleString() || '0'} icon="📉" />
                </div>

                {/* KPI cards — row 3: revenue + engagement */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard label="MRR" value={stats.mrr ? `$${stats.mrr.toFixed(2)}` : '$0.00'} icon="💰" gold />
                  <StatCard label="ARR (est.)" value={stats.mrr ? `$${(stats.mrr * 12).toFixed(2)}` : '$0.00'} icon="📈" />
                  <StatCard label="Sessions Today" value={stats.sessions_today?.toLocaleString() || '0'} icon="🧘" />
                  <StatCard label="Emails Sent (30d)" value={stats.emails_sent_30d?.toLocaleString() || '0'} icon="✉️" />
                </div>

                {/* Recent signups */}
                <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                    <h3 className="text-sm font-medium text-white/60">Recent Signups</h3>
                  </div>
                  <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                    {(stats.recent_signups || []).map((u, i) => {
                      const cat = getUserCategory(u);
                      const badge = getCategoryBadge(cat);
                      const tierBadge = getTierBadge(u.subscription_tier);
                      return (
                        <div key={i} className="px-5 py-3 flex items-center justify-between">
                          <div>
                            <p className="text-sm text-white/70">{u.email}</p>
                            <p className="text-xs text-white/30">{new Date(u.created_at).toLocaleDateString()}</p>
                          </div>
                          <div className="flex gap-1.5 items-center">
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: tierBadge.bg, color: tierBadge.color }}>
                              {tierBadge.label}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: badge.bg, color: badge.color }}>
                              {badge.label}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-white/30 text-center py-20">No stats available yet</div>
            )}
          </div>
        )}

        {/* ── USERS ── */}
        {tab === 'Users' && (
          <div>
            {/* Search + Filter + Add */}
            <div className="flex gap-3 mb-5 flex-wrap">
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search by email..."
                className="flex-1 min-w-[200px] px-4 py-2 rounded-lg text-sm text-white/70 placeholder-white/20 outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
              <select
                value={userFilter}
                onChange={e => { setUserFilter(e.target.value); setPage(1); }}
                className="px-3 py-2 rounded-lg text-sm text-white/70 outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                {USER_FILTERS.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
              <button
                onClick={() => setShowAddUser(!showAddUser)}
                className="px-4 py-2 rounded-lg text-sm whitespace-nowrap"
                style={{ background: 'rgba(184,134,11,0.15)', border: '1px solid rgba(184,134,11,0.3)', color: '#b8860b' }}
              >
                + Add User
              </button>
            </div>

            {/* Add user form */}
            {showAddUser && (
              <div className="rounded-2xl p-5 mb-5" style={{ background: 'rgba(184,134,11,0.06)', border: '1px solid rgba(184,134,11,0.2)' }}>
                <h4 className="text-sm text-white/60 mb-3">Add New User</h4>
                <div className="flex gap-3 items-end flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <label className="text-xs text-white/30 block mb-1">Email</label>
                    <input
                      value={newEmail}
                      onChange={e => setNewEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="w-full px-3 py-2 rounded-lg text-sm text-white/70 placeholder-white/20 outline-none"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/30 block mb-1">Tier</label>
                    <select
                      value={newTier}
                      onChange={e => setNewTier(e.target.value)}
                      className="px-3 py-2 rounded-lg text-sm text-white/70 outline-none"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                      <option value="free">Free</option>
                      <option value="platinum">Platinum (Admin Granted)</option>
                    </select>
                  </div>
                  <button
                    onClick={addUser}
                    disabled={actionLoading === 'add'}
                    className="px-5 py-2 rounded-lg text-sm font-medium"
                    style={{ background: '#b8860b', color: '#0d0d1a' }}
                  >
                    {actionLoading === 'add' ? 'Adding...' : 'Add'}
                  </button>
                </div>
              </div>
            )}

            {/* Users table */}
            <div className="rounded-2xl overflow-x-auto" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <table className="w-full text-sm" style={{ minWidth: 700 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    {['Email', 'Tier', 'Type', 'Status', 'Streak', 'Joined', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs text-white/30 font-normal">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => {
                    const category = getUserCategory(u);
                    const catBadge = getCategoryBadge(category);
                    const tierBadge = getTierBadge(u.subscription_tier);
                    const isPaying = category === 'paying_monthly' || category === 'paying_annual';
                    const isGranted = category === 'granted';
                    const isAdminUser = u.email === 'paul@creativelab.tv';

                    return (
                      <tr key={u.id || i} className="border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                        <td className="px-4 py-3">
                          <span className="text-white/70">{u.email}</span>
                          {isAdminUser && (
                            <span className="ml-2 text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,100,100,0.15)', color: '#ff6b6b' }}>admin</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: tierBadge.bg, color: tierBadge.color }}>
                            {tierBadge.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: catBadge.bg, color: catBadge.color }}>
                            {catBadge.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={u.subscription_status} />
                        </td>
                        <td className="px-4 py-3 text-white/50">{u.current_streak || 0}🔥</td>
                        <td className="px-4 py-3 text-white/40 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1.5 flex-wrap">
                            {/* Grant platinum — only for free/canceled users */}
                            {u.subscription_tier !== 'platinum' && (
                              <button
                                onClick={() => grantPlatinum(u.id)}
                                disabled={actionLoading === u.id}
                                className="px-2.5 py-1 rounded text-xs whitespace-nowrap"
                                style={{ background: 'rgba(184,134,11,0.2)', color: '#b8860b' }}
                                title="Grant free Platinum access"
                              >
                                Grant Platinum
                              </button>
                            )}
                            {/* Revoke — only for admin-granted, NOT paying subscribers */}
                            {isGranted && (
                              <button
                                onClick={() => revokePlatinum(u.id, category)}
                                disabled={actionLoading === u.id}
                                className="px-2.5 py-1 rounded text-xs whitespace-nowrap"
                                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}
                                title="Revoke admin-granted Platinum"
                              >
                                Revoke
                              </button>
                            )}
                            {/* Paying subscriber — show read-only label, no revoke */}
                            {isPaying && (
                              <span className="px-2.5 py-1 rounded text-xs whitespace-nowrap" style={{ background: 'rgba(100,149,237,0.1)', color: '#6495ed' }}>
                                Square Sub
                              </span>
                            )}
                            {/* Delete — never for admin */}
                            {!isAdminUser && (
                              <button
                                onClick={() => deleteUser(u.id, u.email)}
                                disabled={actionLoading === u.id}
                                className="px-2.5 py-1 rounded text-xs whitespace-nowrap"
                                style={{ background: 'rgba(220,38,38,0.12)', color: '#ef4444' }}
                                title="Delete User"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {users.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-10 text-center text-white/30">No users found</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-4">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-4 py-2 rounded-lg text-sm text-white/50 disabled:opacity-30"
                style={{ background: 'rgba(255,255,255,0.05)' }}>← Prev</button>
              <span className="text-sm text-white/30">Page {page}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={users.length < 25}
                className="px-4 py-2 rounded-lg text-sm text-white/50 disabled:opacity-30"
                style={{ background: 'rgba(255,255,255,0.05)' }}>Next →</button>
            </div>
          </div>
        )}

        {/* ── MANTRAS ── */}
        {tab === 'Mantras' && (
          <div>
            <div className="flex gap-3 mb-5">
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search mantras..."
                className="flex-1 px-4 py-2 rounded-lg text-sm text-white/70 placeholder-white/20 outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>

            <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    {['Day', 'Transliteration', 'Tradition', 'Audio', 'Favorites'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs text-white/30 font-normal">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mantras.map((m, i) => (
                    <tr key={i} className="border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                      <td className="px-4 py-3 text-white/40 text-xs">{m.day_of_year}</td>
                      <td className="px-4 py-3 text-white/70">{m.transliteration}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs"
                          style={{ background: 'rgba(184,134,11,0.1)', color: '#b8860b' }}>
                          {m.tradition?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {m.audio_filename ? (
                          <span className="text-green-400 text-xs">✓</span>
                        ) : (
                          <span className="text-white/20 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-white/40 text-xs">{m.favorite_count || 0}</td>
                    </tr>
                  ))}
                  {mantras.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-10 text-center text-white/30">No mantras found</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center mt-4">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-4 py-2 rounded-lg text-sm text-white/50 disabled:opacity-30"
                style={{ background: 'rgba(255,255,255,0.05)' }}>← Prev</button>
              <span className="text-sm text-white/30">Page {page}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={mantras.length < 25}
                className="px-4 py-2 rounded-lg text-sm text-white/50 disabled:opacity-30"
                style={{ background: 'rgba(255,255,255,0.05)' }}>Next →</button>
            </div>
          </div>
        )}

        {/* ── REVENUE ── */}
        {tab === 'Revenue' && (
          <div className="space-y-6">
            {stats ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <StatCard label="Monthly Recurring Revenue" value={stats.mrr ? `$${stats.mrr.toFixed(2)}` : '$0.00'} icon="💰" gold />
                  <StatCard label="Annual Run Rate" value={stats.mrr ? `$${(stats.mrr * 12).toFixed(2)}` : '$0.00'} icon="📈" />
                  <StatCard label="Paying Subscribers" value={((stats.monthly_subs || 0) + (stats.annual_subs || 0)).toLocaleString()} icon="💳" />
                  <StatCard label="Monthly Plans" value={stats.monthly_subs?.toLocaleString() || '0'} icon="🗓" />
                  <StatCard label="Annual Plans" value={stats.annual_subs?.toLocaleString() || '0'} icon="📅" />
                  <StatCard label="Churn (30d)" value={stats.churned_30d ? `${stats.churned_30d}` : '0'} icon="📉" />
                </div>

                <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <h3 className="text-sm text-white/50 mb-4">Revenue Breakdown</h3>
                  <div className="space-y-3">
                    <RevenueRow label="Monthly plans ($1.08/mo)" count={stats.monthly_subs || 0} rate={1.08} />
                    <RevenueRow label="Annual plans ($9.88/yr)" count={stats.annual_subs || 0} rate={9.88 / 12} />
                  </div>
                  <div className="mt-4 pt-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-white/40">Admin Granted (no revenue)</p>
                      <p className="text-sm text-white/30">{stats.granted_subs || 0} users</p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-white/30 text-center py-20">Loading revenue data...</div>
            )}
          </div>
        )}

        {/* ── EMAILS ── */}
        {tab === 'Emails' && (
          <div className="space-y-6">
            <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <h3 className="text-sm font-medium text-white/60 mb-4">Email & Notifications</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <div>
                    <p className="text-sm text-white/70">Send Morning Emails Now</p>
                    <p className="text-xs text-white/30">Manually trigger today's morning mantra email to all subscribers</p>
                  </div>
                  <button onClick={runMorningCron}
                    className="px-4 py-2 rounded-lg text-sm"
                    style={{ background: 'rgba(184,134,11,0.15)', border: '1px solid rgba(184,134,11,0.3)', color: '#b8860b' }}>
                    Send Now
                  </button>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm text-white/70">Test Push Notification</p>
                    <p className="text-xs text-white/30">Sends a test push notification to your device</p>
                  </div>
                  <button onClick={sendTestNotification}
                    className="px-4 py-2 rounded-lg text-sm"
                    style={{ background: 'rgba(184,134,11,0.15)', border: '1px solid rgba(184,134,11,0.3)', color: '#b8860b' }}>
                    Send Test
                  </button>
                </div>
              </div>
            </div>

            {stats && (
              <div className="grid grid-cols-2 gap-4">
                <StatCard label="Email Subscribers" value={stats.email_subscribers?.toLocaleString() || '0'} icon="✉️" />
                <StatCard label="Push Subscribers" value={stats.push_subscribers?.toLocaleString() || '0'} icon="🔔" />
                <StatCard label="Emails Sent (30d)" value={stats.emails_sent_30d?.toLocaleString() || '0'} icon="📤" />
                <StatCard label="Unsubscribes (30d)" value={stats.unsubscribes_30d?.toLocaleString() || '0'} icon="📭" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    active: { bg: 'rgba(74,103,65,0.3)', color: '#7fb069', label: 'Active' },
    canceled: { bg: 'rgba(220,38,38,0.15)', color: '#ef4444', label: 'Canceled' },
    past_due: { bg: 'rgba(220,160,38,0.2)', color: '#dca026', label: 'Past Due' },
    none: { bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', label: 'None' },
  };
  const s = styles[status] || styles.none;
  return (
    <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

function StatCard({ label, value, icon, gold }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-5"
      style={{
        background: gold ? 'rgba(184,134,11,0.08)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${gold ? 'rgba(184,134,11,0.25)' : 'rgba(255,255,255,0.07)'}`,
      }}
    >
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-2xl font-light mb-1" style={{ color: gold ? '#b8860b' : '#f0ebe3', fontFamily: 'Georgia, serif' }}>{value}</div>
      <div className="text-xs text-white/40">{label}</div>
    </motion.div>
  );
}

function RevenueRow({ label, count, rate }) {
  const monthly = (count * rate).toFixed(2);
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-white/60">{label}</p>
        <p className="text-xs text-white/30">{count} subscribers</p>
      </div>
      <div className="text-right">
        <p className="text-sm" style={{ color: '#b8860b' }}>${monthly}/mo</p>
      </div>
    </div>
  );
}

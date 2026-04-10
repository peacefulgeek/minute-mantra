import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
// AppHeader is provided by the layout, not needed here

const TABS = ['Overview', 'Users', 'Mantras', 'Revenue', 'Emails'];

const USER_FILTERS = [
  { value: '', label: 'All Users' },
  { value: 'free', label: 'Free' },
  { value: 'paying', label: 'Paying Subscribers' },
  { value: 'granted', label: 'Admin Granted' },
  { value: 'canceled', label: 'Canceled' },
];

function getUserCategory(u) {
  if (u.subscription_plan === 'monthly' && u.subscription_status === 'active') return 'paying_monthly';
  if (u.subscription_plan === 'annual' && u.subscription_status === 'active') return 'paying_annual';
  if (u.subscription_plan === 'admin_granted' && u.subscription_tier === 'gold') return 'granted';
  if (u.subscription_status === 'canceled') return 'canceled';
  if (u.subscription_status === 'past_due') return 'past_due';
  return 'free';
}

function getCategoryBadge(category) {
  switch (category) {
    case 'paying_monthly':
      return { label: 'Monthly', bg: 'rgba(59,130,246,0.1)', color: '#2563eb' };
    case 'paying_annual':
      return { label: 'Annual', bg: 'rgba(59,130,246,0.1)', color: '#2563eb' };
    case 'granted':
      return { label: 'Granted', bg: 'rgba(184,134,11,0.12)', color: '#b8860b' };
    case 'canceled':
      return { label: 'Canceled', bg: 'rgba(220,38,38,0.08)', color: '#dc2626' };
    case 'past_due':
      return { label: 'Past Due', bg: 'rgba(234,179,8,0.12)', color: '#ca8a04' };
    default:
      return { label: 'Free', bg: 'rgba(0,0,0,0.04)', color: '#9a8c7e' };
  }
}

function getTierBadge(tier) {
  if (tier === 'gold') {
    return { label: 'Gold', bg: 'rgba(184,134,11,0.12)', color: '#b8860b' };
  }
  return { label: 'Free', bg: 'rgba(0,0,0,0.04)', color: '#9a8c7e' };
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
        body: JSON.stringify({ email: newEmail, tier: newTier, plan: newTier === 'gold' ? 'admin_granted' : 'none' }),
      });
      const data = await res.json();
      if (data.ok) { setNewEmail(''); setShowAddUser(false); fetchUsers(); fetchStats(); }
      else alert(data.error || 'Failed to add user');
    } catch (e) { alert('Failed to add user'); }
    setActionLoading(null);
  }

  async function grantGold(userId) {
    if (!confirm('Grant this user free Gold access?')) return;
    setActionLoading(userId);
    try {
      await fetch('/api/admin/set-tier', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, tier: 'gold' }),
      });
      fetchUsers();
      fetchStats();
    } catch (e) { alert('Failed to grant gold'); }
    setActionLoading(null);
  }

  async function revokeGold(userId, category) {
    if (category === 'paying_monthly' || category === 'paying_annual') {
      alert('This user has an active Square subscription. They must cancel through their account or via the Square dashboard.');
      return;
    }
    if (!confirm('Revoke this user\'s Gold access and set to Free?')) return;
    setActionLoading(userId);
    try {
      await fetch('/api/admin/set-tier', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, tier: 'free' }),
      });
      fetchUsers();
      fetchStats();
    } catch (e) { alert('Failed to revoke gold'); }
    setActionLoading(null);
  }

  async function setRole(userId, email, role) {
    const action = role === 'admin' ? 'Make Admin' : 'Remove Admin';
    if (!confirm(`${action} for ${email}?`)) return;
    setActionLoading(userId);
    try {
      const res = await fetch('/api/admin/set-role', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role }),
      });
      const data = await res.json();
      if (data.ok) { fetchUsers(); }
      else alert(data.error || `Failed to ${action.toLowerCase()}`);
    } catch (e) { alert(`Failed to ${action.toLowerCase()}`); }
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
    <div className="min-h-screen pt-safe" style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}>


      <div className="pt-16 max-w-5xl mx-auto px-4 py-8 pb-24">
        {/* Page title */}
        <div className="mb-8">
          <h1 className="font-serif text-2xl" style={{ color: 'var(--text-accent)' }}>Admin Panel</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Minute Mantra</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-1">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setPage(1); setSearch(''); }}
              className="px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all font-sans"
              style={{
                background: tab === t ? 'rgba(184,134,11,0.12)' : 'var(--bg-card)',
                border: `1px solid ${tab === t ? 'rgba(184,134,11,0.3)' : 'var(--border-color)'}`,
                color: tab === t ? 'var(--text-accent)' : 'var(--text-secondary)',
                fontWeight: tab === t ? 600 : 400,
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
              <div className="text-center py-20" style={{ color: 'var(--text-secondary)' }}>Loading stats...</div>
            ) : stats ? (
              <div className="space-y-6">
                {/* Row 1: User counts */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatCard label="Total Users" value={stats.total_users?.toLocaleString() || '—'} />
                  <StatCard label="Free Users" value={stats.free_users?.toLocaleString() || '—'} />
                  <StatCard label="Gold Total" value={stats.gold_users?.toLocaleString() || '—'} gold />
                  <StatCard label="Active Streaks" value={stats.active_streaks?.toLocaleString() || '—'} />
                </div>

                {/* Row 2: Subscriber breakdown */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatCard label="Paying Monthly" value={stats.monthly_subs?.toLocaleString() || '0'} />
                  <StatCard label="Paying Annual" value={stats.annual_subs?.toLocaleString() || '0'} />
                  <StatCard label="Admin Granted" value={stats.granted_subs?.toLocaleString() || '0'} gold />
                  <StatCard label="Churn (30d)" value={stats.churned_30d?.toLocaleString() || '0'} />
                </div>

                {/* Row 3: Revenue + engagement */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatCard label="MRR" value={stats.mrr ? `$${stats.mrr.toFixed(2)}` : '$0.00'} gold />
                  <StatCard label="ARR (est.)" value={stats.mrr ? `$${(stats.mrr * 12).toFixed(2)}` : '$0.00'} />
                  <StatCard label="Sessions Today" value={stats.sessions_today?.toLocaleString() || '0'} />
                  <StatCard label="Emails Sent (30d)" value={stats.emails_sent_30d?.toLocaleString() || '0'} />
                </div>

                {/* Recent signups */}
                <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                  <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <h3 className="text-sm font-sans font-medium" style={{ color: 'var(--text-secondary)' }}>Recent Signups</h3>
                  </div>
                  <div>
                    {(stats.recent_signups || []).map((u, i) => {
                      const cat = getUserCategory(u);
                      const badge = getCategoryBadge(cat);
                      const tierBadge = getTierBadge(u.subscription_tier);
                      return (
                        <div key={i} className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <div>
                            <p className="text-sm font-sans" style={{ color: 'var(--text-primary)' }}>{u.email}</p>
                            <p className="text-xs font-sans" style={{ color: 'var(--text-secondary)' }}>{new Date(u.created_at).toLocaleDateString()}</p>
                          </div>
                          <div className="flex gap-1.5 items-center">
                            <span className="text-xs px-2 py-0.5 rounded-full font-sans" style={{ background: tierBadge.bg, color: tierBadge.color }}>
                              {tierBadge.label}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full font-sans" style={{ background: badge.bg, color: badge.color }}>
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
              <div className="text-center py-20" style={{ color: 'var(--text-secondary)' }}>No stats available yet</div>
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
                className="flex-1 min-w-[200px] px-4 py-2.5 rounded-xl text-sm font-sans outline-none"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              />
              <select
                value={userFilter}
                onChange={e => { setUserFilter(e.target.value); setPage(1); }}
                className="px-3 py-2.5 rounded-xl text-sm font-sans outline-none"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              >
                {USER_FILTERS.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
              <button
                onClick={() => setShowAddUser(!showAddUser)}
                className="px-4 py-2.5 rounded-xl text-sm whitespace-nowrap font-sans font-medium"
                style={{ background: 'rgba(184,134,11,0.1)', border: '1px solid rgba(184,134,11,0.25)', color: '#b8860b' }}
              >
                + Add User
              </button>
            </div>

            {/* Add user form */}
            {showAddUser && (
              <div className="rounded-2xl p-5 mb-5" style={{ background: 'rgba(184,134,11,0.04)', border: '1px solid rgba(184,134,11,0.15)' }}>
                <h4 className="text-sm font-sans mb-3" style={{ color: 'var(--text-secondary)' }}>Add New User</h4>
                <div className="flex gap-3 items-end flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <label className="text-xs font-sans block mb-1" style={{ color: 'var(--text-secondary)' }}>Email</label>
                    <input
                      value={newEmail}
                      onChange={e => setNewEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="w-full px-3 py-2.5 rounded-xl text-sm font-sans outline-none"
                      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-sans block mb-1" style={{ color: 'var(--text-secondary)' }}>Tier</label>
                    <select
                      value={newTier}
                      onChange={e => setNewTier(e.target.value)}
                      className="px-3 py-2.5 rounded-xl text-sm font-sans outline-none"
                      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                    >
                      <option value="free">Free</option>
                      <option value="gold">Gold (Admin Granted)</option>
                    </select>
                  </div>
                  <button
                    onClick={addUser}
                    disabled={actionLoading === 'add'}
                    className="px-5 py-2.5 rounded-xl text-sm font-sans font-medium"
                    style={{ background: 'linear-gradient(135deg, #b8860b, #d4a017)', color: '#fffaf3' }}
                  >
                    {actionLoading === 'add' ? 'Adding...' : 'Add'}
                  </button>
                </div>
              </div>
            )}

            {/* Users table */}
            <div className="rounded-2xl overflow-x-auto" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              <table className="w-full text-sm font-sans" style={{ minWidth: 700 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    {['Email', 'Tier', 'Type', 'Status', 'Streak', 'Joined', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{h}</th>
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
                    const isAdminUser = u.role === 'admin' || u.email === 'paul@creativelab.tv';
                    const isSuperAdmin = u.email === 'paul@creativelab.tv';

                    return (
                      <tr key={u.id || i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td className="px-4 py-3">
                          <span style={{ color: 'var(--text-primary)' }}>{u.email}</span>
                          {isAdminUser && (
                            <span className="ml-2 text-xs px-1.5 py-0.5 rounded font-medium" style={{ background: 'rgba(184,134,11,0.12)', color: '#b8860b' }}>
                              {isSuperAdmin ? 'super-admin' : 'admin'}
                            </span>
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
                        <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{u.current_streak || 0}</td>
                        <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1.5 flex-wrap">
                            {u.subscription_tier !== 'gold' && (
                              <button
                                onClick={() => grantGold(u.id)}
                                disabled={actionLoading === u.id}
                                className="px-2.5 py-1 rounded-lg text-xs whitespace-nowrap font-medium"
                                style={{ background: 'rgba(184,134,11,0.1)', color: '#b8860b', border: '1px solid rgba(184,134,11,0.2)' }}
                              >
                                Grant Gold
                              </button>
                            )}
                            {isGranted && (
                              <button
                                onClick={() => revokeGold(u.id, category)}
                                disabled={actionLoading === u.id}
                                className="px-2.5 py-1 rounded-lg text-xs whitespace-nowrap"
                                style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
                              >
                                Revoke
                              </button>
                            )}
                            {isPaying && (
                              <span className="px-2.5 py-1 rounded-lg text-xs whitespace-nowrap" style={{ background: 'rgba(59,130,246,0.08)', color: '#2563eb', border: '1px solid rgba(59,130,246,0.15)' }}>
                                Square Sub
                              </span>
                            )}
                            {/* Admin role buttons */}
                            {!isAdminUser && (
                              <button
                                onClick={() => setRole(u.id, u.email, 'admin')}
                                disabled={actionLoading === u.id}
                                className="px-2.5 py-1 rounded-lg text-xs whitespace-nowrap font-medium"
                                style={{ background: 'rgba(139,92,246,0.1)', color: '#7c3aed', border: '1px solid rgba(139,92,246,0.2)' }}
                              >
                                Make Admin
                              </button>
                            )}
                            {isAdminUser && !isSuperAdmin && (
                              <button
                                onClick={() => setRole(u.id, u.email, 'user')}
                                disabled={actionLoading === u.id}
                                className="px-2.5 py-1 rounded-lg text-xs whitespace-nowrap"
                                style={{ background: 'rgba(139,92,246,0.06)', color: '#7c3aed', border: '1px solid rgba(139,92,246,0.12)' }}
                              >
                                Remove Admin
                              </button>
                            )}
                            {!isSuperAdmin && (
                              <button
                                onClick={() => deleteUser(u.id, u.email)}
                                disabled={actionLoading === u.id}
                                className="px-2.5 py-1 rounded-lg text-xs whitespace-nowrap"
                                style={{ background: 'rgba(220,38,38,0.06)', color: '#dc2626', border: '1px solid rgba(220,38,38,0.12)' }}
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
                    <tr><td colSpan={7} className="px-4 py-10 text-center" style={{ color: 'var(--text-secondary)' }}>No users found</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-4">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-4 py-2 rounded-xl text-sm font-sans disabled:opacity-30"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                ← Prev
              </button>
              <span className="text-sm font-sans" style={{ color: 'var(--text-secondary)' }}>Page {page}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={users.length < 25}
                className="px-4 py-2 rounded-xl text-sm font-sans disabled:opacity-30"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                Next →
              </button>
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
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-sans outline-none"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>

            <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              <table className="w-full text-sm font-sans">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    {['Day', 'Transliteration', 'Tradition', 'Audio', 'Favorites'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mantras.map((m, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>{m.day_of_year}</td>
                      <td className="px-4 py-3" style={{ color: 'var(--text-primary)' }}>{m.transliteration}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs"
                          style={{ background: 'rgba(184,134,11,0.08)', color: '#b8860b' }}>
                          {m.tradition?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {m.audio_filename ? (
                          <span className="text-xs" style={{ color: '#16a34a' }}>✓</span>
                        ) : (
                          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>{m.favorite_count || 0}</td>
                    </tr>
                  ))}
                  {mantras.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-10 text-center" style={{ color: 'var(--text-secondary)' }}>No mantras found</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center mt-4">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-4 py-2 rounded-xl text-sm font-sans disabled:opacity-30"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                ← Prev
              </button>
              <span className="text-sm font-sans" style={{ color: 'var(--text-secondary)' }}>Page {page}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={mantras.length < 25}
                className="px-4 py-2 rounded-xl text-sm font-sans disabled:opacity-30"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                Next →
              </button>
            </div>
          </div>
        )}

        {/* ── REVENUE ── */}
        {tab === 'Revenue' && (
          <div className="space-y-6">
            {stats ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <StatCard label="Monthly Recurring Revenue" value={stats.mrr ? `$${stats.mrr.toFixed(2)}` : '$0.00'} gold />
                  <StatCard label="Annual Run Rate" value={stats.mrr ? `$${(stats.mrr * 12).toFixed(2)}` : '$0.00'} />
                  <StatCard label="Paying Subscribers" value={((stats.monthly_subs || 0) + (stats.annual_subs || 0)).toLocaleString()} />
                  <StatCard label="Monthly Plans" value={stats.monthly_subs?.toLocaleString() || '0'} />
                  <StatCard label="Annual Plans" value={stats.annual_subs?.toLocaleString() || '0'} />
                  <StatCard label="Churn (30d)" value={stats.churned_30d ? `${stats.churned_30d}` : '0'} />
                </div>

                <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                  <h3 className="text-sm font-sans mb-4" style={{ color: 'var(--text-secondary)' }}>Revenue Breakdown</h3>
                  <div className="space-y-3">
                    <RevenueRow label="Monthly plans ($1.08/mo)" count={stats.monthly_subs || 0} rate={1.08} />
                    <RevenueRow label="Annual plans ($9.88/yr)" count={stats.annual_subs || 0} rate={9.88 / 12} />
                  </div>
                  <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-sans" style={{ color: 'var(--text-secondary)' }}>Admin Granted (no revenue)</p>
                      <p className="text-sm font-sans" style={{ color: 'var(--text-secondary)' }}>{stats.granted_subs || 0} users</p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-20" style={{ color: 'var(--text-secondary)' }}>Loading revenue data...</div>
            )}
          </div>
        )}

        {/* ── EMAILS ── */}
        {tab === 'Emails' && (
          <div className="space-y-6">
            <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              <h3 className="text-sm font-sans font-medium mb-4" style={{ color: 'var(--text-secondary)' }}>Email & Notifications</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <div>
                    <p className="text-sm font-sans" style={{ color: 'var(--text-primary)' }}>Send Morning Emails Now</p>
                    <p className="text-xs font-sans" style={{ color: 'var(--text-secondary)' }}>Manually trigger today's morning mantra email to all subscribers</p>
                  </div>
                  <button onClick={runMorningCron}
                    className="px-4 py-2 rounded-xl text-sm font-sans font-medium"
                    style={{ background: 'rgba(184,134,11,0.1)', border: '1px solid rgba(184,134,11,0.25)', color: '#b8860b' }}>
                    Send Now
                  </button>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-sans" style={{ color: 'var(--text-primary)' }}>Test Push Notification</p>
                    <p className="text-xs font-sans" style={{ color: 'var(--text-secondary)' }}>Sends a test push notification to your device</p>
                  </div>
                  <button onClick={sendTestNotification}
                    className="px-4 py-2 rounded-xl text-sm font-sans font-medium"
                    style={{ background: 'rgba(184,134,11,0.1)', border: '1px solid rgba(184,134,11,0.25)', color: '#b8860b' }}>
                    Send Test
                  </button>
                </div>
              </div>
            </div>

            {stats && (
              <div className="grid grid-cols-2 gap-3">
                <StatCard label="Email Subscribers" value={stats.email_subscribers?.toLocaleString() || '0'} />
                <StatCard label="Push Subscribers" value={stats.push_subscribers?.toLocaleString() || '0'} />
                <StatCard label="Emails Sent (30d)" value={stats.emails_sent_30d?.toLocaleString() || '0'} />
                <StatCard label="Unsubscribes (30d)" value={stats.unsubscribes_30d?.toLocaleString() || '0'} />
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
    active: { bg: 'rgba(22,163,74,0.08)', color: '#16a34a', label: 'Active' },
    canceled: { bg: 'rgba(220,38,38,0.08)', color: '#dc2626', label: 'Canceled' },
    past_due: { bg: 'rgba(234,179,8,0.12)', color: '#ca8a04', label: 'Past Due' },
    none: { bg: 'rgba(0,0,0,0.04)', color: '#9a8c7e', label: 'None' },
  };
  const s = styles[status] || styles.none;
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-sans" style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

function StatCard({ label, value, gold }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-5"
      style={{
        background: gold ? 'rgba(184,134,11,0.06)' : 'var(--bg-card)',
        border: `1px solid ${gold ? 'rgba(184,134,11,0.2)' : 'var(--border-color)'}`,
      }}
    >
      <div className="font-serif text-2xl mb-1" style={{ color: gold ? '#b8860b' : 'var(--text-primary)' }}>{value}</div>
      <div className="text-xs font-sans" style={{ color: 'var(--text-secondary)' }}>{label}</div>
    </motion.div>
  );
}

function RevenueRow({ label, count, rate }) {
  const monthly = (count * rate).toFixed(2);
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-sans" style={{ color: 'var(--text-primary)' }}>{label}</p>
        <p className="text-xs font-sans" style={{ color: 'var(--text-secondary)' }}>{count} subscribers</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-sans font-medium" style={{ color: '#b8860b' }}>${monthly}/mo</p>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import AppHeader from '../components/AppHeader';

const TABS = ['Overview', 'Users', 'Mantras', 'Revenue', 'Emails'];

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
  const [tierFilter, setTierFilter] = useState('all');

  const isAdmin = user?.role === 'admin' || user?.email === 'paul@creativelab.tv';

  useEffect(() => {
    if (!user) { navigate('/enter'); return; }
    if (!isAdmin) { navigate('/'); return; }
    fetchStats();
  }, [user]);

  useEffect(() => {
    if (tab === 'Users') fetchUsers();
    if (tab === 'Mantras') fetchMantras();
  }, [tab, page, search, tierFilter]);

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
      const params = new URLSearchParams({ page, limit: 25, search, tier: tierFilter === 'all' ? '' : tierFilter });
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
      if (data.ok) { setNewEmail(''); setShowAddUser(false); fetchUsers(); }
      else alert(data.error || 'Failed to add user');
    } catch (e) { alert('Failed to add user'); }
    setActionLoading(null);
  }

  async function setUserTier(userId, tier) {
    const label = tier === 'platinum' ? 'Platinum' : 'Free';
    if (!confirm(`Set this user to ${label}?`)) return;
    setActionLoading(userId);
    try {
      await fetch('/api/admin/set-tier', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, tier }),
      });
      fetchUsers();
    } catch (e) { alert('Failed to update user tier'); }
    setActionLoading(null);
  }

  async function deleteUser(userId, email) {
    if (!confirm(`Delete user ${email}? This cannot be undone.`)) return;
    setActionLoading(userId);
    try {
      await fetch(`/api/admin/delete-user/${userId}`, { method: 'DELETE', credentials: 'include' });
      fetchUsers();
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
            <p className="text-sm text-white/40 mt-1">Minute Mantra · paul@creativelab.tv</p>
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
                {/* KPI cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard label="Total Users" value={stats.total_users?.toLocaleString() || '—'} icon="👤" />
                  <StatCard label="Platinum Subscribers" value={stats.platinum_users?.toLocaleString() || '—'} icon="✦" gold />
                  <StatCard label="Active Streaks" value={stats.active_streaks?.toLocaleString() || '—'} icon="🔥" />
                  <StatCard label="Sessions Today" value={stats.sessions_today?.toLocaleString() || '—'} icon="🧘" />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard label="MRR" value={stats.mrr ? `$${stats.mrr.toFixed(2)}` : '—'} icon="💰" gold />
                  <StatCard label="ARR (est.)" value={stats.mrr ? `$${(stats.mrr * 12).toFixed(2)}` : '—'} icon="📈" />
                  <StatCard label="Emails Sent (30d)" value={stats.emails_sent_30d?.toLocaleString() || '—'} icon="✉️" />
                  <StatCard label="Push Subscribers" value={stats.push_subscribers?.toLocaleString() || '—'} icon="🔔" />
                </div>

                {/* Recent signups */}
                <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                    <h3 className="text-sm font-medium text-white/60">Recent Signups</h3>
                  </div>
                  <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                    {(stats.recent_signups || []).map((u, i) => (
                      <div key={i} className="px-5 py-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm text-white/70">{u.email}</p>
                          <p className="text-xs text-white/30">{new Date(u.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="flex gap-1.5 items-center">
                          <span className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: u.subscription_tier === 'platinum' ? 'rgba(184,134,11,0.2)' : 'rgba(255,255,255,0.06)', color: u.subscription_tier === 'platinum' ? '#b8860b' : 'rgba(255,255,255,0.4)' }}>
                            {u.subscription_tier || 'free'}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full"
                            style={{
                              background: u.subscription_status === 'active' ? 'rgba(74,103,65,0.3)'
                                : u.subscription_status === 'canceled' ? 'rgba(220,38,38,0.15)' : 'rgba(255,255,255,0.06)',
                              color: u.subscription_status === 'active' ? '#7fb069'
                                : u.subscription_status === 'canceled' ? '#ef4444' : 'rgba(255,255,255,0.4)'
                            }}>
                            {u.subscription_status || 'none'}
                          </span>
                        </div>
                      </div>
                    ))}
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
            <div className="flex gap-3 mb-5">
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search by email..."
                className="flex-1 px-4 py-2 rounded-lg text-sm text-white/70 placeholder-white/20 outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
              <select
                value={tierFilter}
                onChange={e => { setTierFilter(e.target.value); setPage(1); }}
                className="px-3 py-2 rounded-lg text-sm text-white/70 outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <option value="all">All Users</option>
                <option value="free">Free</option>
                <option value="platinum">Platinum</option>
              </select>
              <button
                onClick={() => setShowAddUser(!showAddUser)}
                className="px-4 py-2 rounded-lg text-sm"
                style={{ background: 'rgba(184,134,11,0.15)', border: '1px solid rgba(184,134,11,0.3)', color: '#b8860b' }}
              >
                + Add User
              </button>
            </div>

            {showAddUser && (
              <div className="rounded-2xl p-5 mb-5" style={{ background: 'rgba(184,134,11,0.06)', border: '1px solid rgba(184,134,11,0.2)' }}>
                <h4 className="text-sm text-white/60 mb-3">Add New User</h4>
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
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
                <option value="platinum">Platinum</option>
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

            <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    {['Email', 'Tier', 'Plan', 'Status', 'Streak', 'Joined', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs text-white/30 font-normal">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr key={i} className="border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                      <td className="px-4 py-3 text-white/70">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs"
                          style={{ background: u.subscription_tier === 'platinum' ? 'rgba(184,134,11,0.2)' : 'rgba(255,255,255,0.06)', color: u.subscription_tier === 'platinum' ? '#b8860b' : 'rgba(255,255,255,0.4)' }}>
                          {u.subscription_tier || 'free'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs"
                          style={{
                            background: u.subscription_plan === 'monthly' || u.subscription_plan === 'annual'
                              ? 'rgba(100,149,237,0.15)' : u.subscription_plan === 'admin_granted'
                              ? 'rgba(184,134,11,0.1)' : 'rgba(255,255,255,0.06)',
                            color: u.subscription_plan === 'monthly' || u.subscription_plan === 'annual'
                              ? '#6495ed' : u.subscription_plan === 'admin_granted'
                              ? '#b8860b' : 'rgba(255,255,255,0.4)'
                          }}>
                          {u.subscription_plan === 'admin_granted' ? 'granted' : u.subscription_plan || 'none'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs"
                          style={{
                            background: u.subscription_status === 'active' ? 'rgba(74,103,65,0.3)'
                              : u.subscription_status === 'past_due' ? 'rgba(220,160,38,0.2)'
                              : u.subscription_status === 'canceled' ? 'rgba(220,38,38,0.15)'
                              : 'rgba(255,255,255,0.06)',
                            color: u.subscription_status === 'active' ? '#7fb069'
                              : u.subscription_status === 'past_due' ? '#dca026'
                              : u.subscription_status === 'canceled' ? '#ef4444'
                              : 'rgba(255,255,255,0.4)'
                          }}>
                          {u.subscription_status || 'none'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-white/50">{u.current_streak || 0}🔥</td>
                      <td className="px-4 py-3 text-white/40 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {u.subscription_tier !== 'platinum' ? (
                            <button
                              onClick={() => setUserTier(u.id, 'platinum')}
                              disabled={actionLoading === u.id}
                              className="px-2 py-1 rounded text-xs"
                              style={{ background: 'rgba(184,134,11,0.2)', color: '#b8860b' }}
                              title="Upgrade to Platinum"
                            >
                              Platinum
                            </button>
                          ) : (
                            <button
                              onClick={() => setUserTier(u.id, 'free')}
                              disabled={actionLoading === u.id}
                              className="px-2 py-1 rounded text-xs"
                              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}
                              title="Downgrade to Free"
                            >
                              Free
                            </button>
                          )}
                          {u.email !== 'paul@creativelab.tv' && (
                            <button
                              onClick={() => deleteUser(u.id, u.email)}
                              disabled={actionLoading === u.id}
                              className="px-2 py-1 rounded text-xs"
                              style={{ background: 'rgba(220,38,38,0.15)', color: '#ef4444' }}
                              title="Delete User"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
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
                  <StatCard label="Platinum Subscribers" value={stats.platinum_users?.toLocaleString() || '0'} icon="✦" />
                  <StatCard label="Monthly Subs" value={stats.monthly_subs?.toLocaleString() || '0'} icon="📅" />
                  <StatCard label="Annual Subs" value={stats.annual_subs?.toLocaleString() || '0'} icon="🗓" />
                  <StatCard label="Churn (30d)" value={stats.churned_30d ? `${stats.churned_30d}` : '0'} icon="📉" />
                </div>

                <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <h3 className="text-sm text-white/50 mb-4">Revenue Breakdown</h3>
                  <div className="space-y-3">
                    <RevenueRow label="Monthly plans ($1.08/mo)" count={stats.monthly_subs || 0} rate={1.08} />
                    <RevenueRow label="Annual plans ($9.88/yr)" count={stats.annual_subs || 0} rate={9.88 / 12} />
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

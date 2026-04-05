import React, { useEffect, useState } from 'react';
import CalendarHeatmap from '../components/CalendarHeatmap';
import StreakFlame from '../components/StreakFlame';

export default function History() {
  const [sessions, setSessions] = useState([]);
  const [streak, setStreak] = useState(null);
  const [recentSessions, setRecentSessions] = useState([]);
  const now = new Date();

  useEffect(() => {
    fetchMonthSessions(now.getFullYear(), now.getMonth() + 1);
    fetchStreak();
    fetchRecentSessions();
  }, []);

  async function fetchMonthSessions(year, month) {
    try {
      const res = await fetch(`/api/sessions/history/${year}/${month}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions);
      }
    } catch (e) {}
  }

  async function fetchStreak() {
    try {
      const res = await fetch('/api/sessions/streak', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setStreak(data.streak);
      }
    } catch (e) {}
  }

  async function fetchRecentSessions() {
    try {
      const res = await fetch('/api/sessions/history?limit=10', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setRecentSessions(data.sessions);
      }
    } catch (e) {}
  }

  return (
    <div className="min-h-screen pt-safe px-4 py-6">
      <h1 className="font-serif text-2xl mb-6 px-1" style={{ color: 'var(--text-accent)' }}>
        Practice History
      </h1>

      {/* Streak stats */}
      {streak && (
        <div className="flex gap-3 mb-6">
          <div
            className="flex-1 rounded-xl p-4 text-center"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
          >
            <div className="flex items-center justify-center gap-2 mb-1">
              <StreakFlame streak={streak.current_streak} showCount={false} />
              <span className="font-serif text-2xl" style={{ color: 'var(--text-accent)' }}>
                {streak.current_streak}
              </span>
            </div>
            <p className="font-sans text-xs" style={{ color: 'var(--text-secondary)' }}>Current streak</p>
          </div>
          <div
            className="flex-1 rounded-xl p-4 text-center"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
          >
            <span className="font-serif text-2xl block mb-1" style={{ color: 'var(--text-primary)' }}>
              {streak.longest_streak}
            </span>
            <p className="font-sans text-xs" style={{ color: 'var(--text-secondary)' }}>Longest streak</p>
          </div>
        </div>
      )}

      {/* Calendar heatmap */}
      <div className="mb-6">
        <CalendarHeatmap
          sessions={sessions}
          onMonthChange={(year, month) => fetchMonthSessions(year, month)}
        />
      </div>

      {/* Recent sessions */}
      {recentSessions.length > 0 && (
        <div>
          <h2 className="font-serif text-lg mb-3 px-1" style={{ color: 'var(--text-primary)' }}>
            Recent Sessions
          </h2>
          <div className="flex flex-col gap-2">
            {recentSessions.map(s => (
              <div
                key={s.id}
                className="rounded-xl px-4 py-3 flex items-center justify-between"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
              >
                <div>
                  <p className="font-serif text-sm italic" style={{ color: 'var(--text-primary)' }}>
                    {s.transliteration}
                  </p>
                  <p className="font-sans text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    {new Date(s.session_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-sans text-sm" style={{ color: 'var(--text-accent)' }}>
                    {s.mode === 'mala' ? '108 beads' : `${Math.round(s.duration_seconds / 60)} min`}
                  </p>
                  <p className="font-sans text-xs" style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                    {s.intention?.toLowerCase()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

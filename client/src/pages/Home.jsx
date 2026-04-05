import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MantraCard from '../components/MantraCard';
import Timer from '../components/Timer';
import StreakFlame from '../components/StreakFlame';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export default function Home() {
  const { user } = useAuth();
  const { applyTradition } = useTheme();
  const navigate = useNavigate();

  const [mantra, setMantra] = useState(null);
  const [streak, setStreak] = useState(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [view, setView] = useState('card'); // 'card' | 'timer'
  const [loading, setLoading] = useState(true);
  const [sessionDone, setSessionDone] = useState(false);

  useEffect(() => {
    fetchToday();
    fetchStreak();
  }, []);

  async function fetchToday() {
    try {
      const res = await fetch(`/api/mantras/today?timezone=${encodeURIComponent(user?.timezone || 'America/New_York')}`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setMantra(data.mantra);
        setIsFavorited(data.mantra?.is_favorited || false);
        applyTradition(data.mantra?.tradition);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
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

  async function toggleFavorite() {
    if (!mantra) return;
    try {
      const res = await fetch(`/api/mantras/${mantra.id}/favorite`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        setIsFavorited(data.favorited);
      } else if (data.upgrade_required) {
        navigate('/settings/subscription');
      }
    } catch (e) {}
  }

  async function handleSessionComplete(sessionData) {
    try {
      await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ mantra_id: mantra.id, ...sessionData }),
      });
      setSessionDone(true);
      fetchStreak();
    } catch (e) {}
    setTimeout(() => setView('card'), 3000);
  }

  return (
    <div className="min-h-screen pt-safe" style={{ background: 'var(--bg-base)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-6 pb-2">
        <div>
          <h1 className="font-serif text-2xl" style={{ color: 'var(--text-accent)' }}>
            Minute Mantra
          </h1>
          <p className="font-sans text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        {streak && <StreakFlame streak={streak.current_streak} />}
      </div>

      {/* Content */}
      {view === 'card' ? (
        <MantraCard
          mantra={mantra}
          onBeginChanting={() => setView('timer')}
          onFavoriteToggle={toggleFavorite}
          isFavorited={isFavorited}
        />
      ) : (
        <Timer
          mantra={mantra}
          onComplete={handleSessionComplete}
        />
      )}

      {/* Session complete message */}
      {sessionDone && view === 'card' && (
        <div
          className="mx-4 mt-2 p-4 rounded-xl text-center animate-fade-in"
          style={{ background: 'rgba(184,134,11,0.1)', border: '1px solid var(--border-color)' }}
        >
          <p className="font-serif text-base" style={{ color: 'var(--text-accent)' }}>
            ✓ Session logged. Beautiful practice.
          </p>
          {streak && (
            <p className="font-sans text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              {streak.current_streak} day streak 🔥
            </p>
          )}
        </div>
      )}
    </div>
  );
}

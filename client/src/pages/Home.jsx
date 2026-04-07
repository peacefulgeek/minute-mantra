import React, { useEffect, useState, useRef } from 'react';
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
  const [error, setError] = useState(null);
  const retryCount = useRef(0);

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
        setError(null);
      } else if (res.status === 401 && retryCount.current < 3) {
        // Auth cookie might not be set yet after magic link verify — retry
        retryCount.current += 1;
        setTimeout(fetchToday, 1000);
        return;
      } else {
        setError('Could not load today\'s mantra');
      }
    } catch (e) {
      console.error(e);
      if (retryCount.current < 3) {
        retryCount.current += 1;
        setTimeout(fetchToday, 1000);
        return;
      }
      setError('Could not load today\'s mantra');
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
          <h1
            className="text-2xl"
            style={{ color: '#3d2b1f', fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            Minute Mantra
          </h1>
          <p
            className="text-sm mt-0.5"
            style={{ color: '#7a5c3e', fontFamily: "'DM Sans', system-ui, sans-serif" }}
          >
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        {streak && <StreakFlame streak={streak.current_streak} />}
      </div>

      {/* Error state */}
      {error && !mantra && (
        <div className="px-6 py-8 text-center">
          <p className="text-sm mb-4" style={{ color: '#7a5c3e' }}>{error}</p>
          <button
            onClick={() => { setError(null); setLoading(true); retryCount.current = 0; fetchToday(); }}
            className="px-6 py-2 rounded-full text-sm"
            style={{
              background: 'linear-gradient(135deg, #b8860b, #d4a017)',
              color: '#ffffff',
              fontWeight: 600,
              border: 'none',
            }}
          >
            Try Again
          </button>
        </div>
      )}

      {/* Content */}
      {!error && view === 'card' && (
        <MantraCard
          mantra={mantra}
          onBeginChanting={() => setView('timer')}
          onFavoriteToggle={toggleFavorite}
          isFavorited={isFavorited}
        />
      )}

      {view === 'timer' && (
        <Timer
          mantra={mantra}
          onComplete={handleSessionComplete}
        />
      )}

      {/* Session complete message */}
      {sessionDone && view === 'card' && (
        <div
          className="mx-4 mt-2 p-4 rounded-xl text-center animate-fade-in"
          style={{ background: 'rgba(184,134,11,0.1)', border: '1px solid rgba(184,134,11,0.15)' }}
        >
          <p
            className="text-base"
            style={{ color: '#3d2b1f', fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            Session logged. Beautiful practice.
          </p>
          {streak && (
            <p className="text-base mt-1" style={{ color: '#7a5c3e', fontFamily: "'DM Sans', sans-serif" }}>
              {streak.current_streak} day streak
            </p>
          )}
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import MantraCard from '../components/MantraCard';
import Timer from '../components/Timer';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

// Inspirational words that cycle incrementally by day_of_year
const INSPIRATIONAL_WORDS = [
  'Beautiful', 'Unlimited', 'Loved', 'Wonderful', 'Divine', 'Radiant',
  'Worthy', 'Powerful', 'Brave', 'Graceful', 'Abundant', 'Magnetic',
  'Sacred', 'Luminous', 'Fearless', 'Whole', 'Vibrant', 'Resilient',
  'Blessed', 'Boundless', 'Majestic', 'Sovereign', 'Infinite', 'Joyful',
  'Brilliant', 'Gentle', 'Fierce', 'Harmonious', 'Timeless', 'Glorious',
  'Cherished', 'Awakened', 'Unstoppable', 'Magnificent', 'Serene',
  'Courageous', 'Inspired', 'Liberated', 'Grateful', 'Compassionate',
  'Triumphant', 'Precious', 'Noble', 'Creative', 'Empowered', 'Authentic',
  'Purposeful', 'Peaceful', 'Dazzling', 'Unshakable', 'Tender', 'Visionary',
  'Grounded', 'Expansive', 'Enchanting', 'Soulful', 'Devoted', 'Flourishing',
  'Stellar', 'Miraculous', 'Resplendent', 'Effulgent', 'Profound',
  'Deeply Rooted', 'Wide Open', 'Ever-Growing', 'Light-Filled', 'Spirit-Led',
  'Wildly Free', 'Fully Alive', 'Divinely Guided', 'Heart-Centered',
  'Soul-Rich', 'Born Ready', 'Forever Becoming', 'Pure Light', 'Deeply Enough',
];

function getDayOfYear() {
  const now = new Date();
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, month: 'numeric', day: 'numeric', year: 'numeric',
  });
  const parts = formatter.formatToParts(now);
  const month = parseInt(parts.find(p => p.type === 'month').value);
  const day = parseInt(parts.find(p => p.type === 'day').value);
  const year = parseInt(parts.find(p => p.type === 'year').value);
  const start = Date.UTC(year, 0, 0);
  const date = Date.UTC(year, month - 1, day);
  return Math.floor((date - start) / 86400000);
}

function getInspirationWord() {
  const dayOfYear = getDayOfYear();
  return INSPIRATIONAL_WORDS[(dayOfYear - 1) % INSPIRATIONAL_WORDS.length];
}

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

  const currentStreak = streak?.current_streak || 0;
  const inspirationWord = getInspirationWord();

  return (
    <div className="min-h-screen pt-safe" style={{ background: 'var(--bg-base)' }}>
      {/* Chanting Day X • You Are Y — centered, compact */}
      <div className="text-center" style={{ padding: '20px 0 4px' }}>
        <p
          style={{
            color: '#5a3e1b',
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: '20px',
            fontWeight: 600,
            margin: 0,
            lineHeight: 1.4,
          }}
        >
          {currentStreak > 0 ? (
            <>
              Chanting Day {currentStreak}
              <span style={{ color: '#b8860b', margin: '0 8px' }}>&bull;</span>
              <span style={{ color: '#FF13F0' }}>You Are {inspirationWord}</span>
            </>
          ) : (
            <span style={{ color: '#FF13F0' }}>You Are {inspirationWord}</span>
          )}
        </p>
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
              Chanting Day {streak.current_streak}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

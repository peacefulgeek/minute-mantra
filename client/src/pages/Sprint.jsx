import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const DURATIONS = [
  { days: 7, label: '7 Days', desc: 'A focused week' },
  { days: 30, label: '30 Days', desc: 'Build a habit' },
  { days: 60, label: '60 Days', desc: 'Deep transformation' },
  { days: 90, label: '90 Days', desc: 'Complete mastery' },
];

export default function Sprint() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeSprint, setActiveSprint] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      // Fetch active sprint
      const sprintRes = await fetch('/api/sprints/active', { credentials: 'include' });
      if (sprintRes.ok) {
        const data = await sprintRes.json();
        setActiveSprint(data.sprint);
      }

      // Fetch favorites
      const favRes = await fetch('/api/mantras/favorites', { credentials: 'include' });
      if (favRes.ok) {
        const data = await favRes.json();
        setFavorites(data.mantras || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function startSprint(duration) {
    setCreating(true);
    setError(null);
    try {
      const res = await fetch('/api/sprints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ duration }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(data.message);
        setTimeout(() => navigate('/home'), 2000);
      } else {
        setError(data.error);
      }
    } catch (e) {
      setError('Could not start sprint. Please try again.');
    } finally {
      setCreating(false);
    }
  }

  async function cancelSprint() {
    try {
      const res = await fetch('/api/sprints/active', {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        setActiveSprint(null);
        setSuccess('Sprint cancelled. Back to daily mantras.');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (e) {
      setError('Could not cancel sprint.');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--bg-base)' }}>
        <p style={{ color: 'var(--text-secondary)', fontFamily: "'DM Sans', sans-serif" }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-5 py-6" style={{ background: 'var(--bg-base)' }}>
      {/* Title */}
      <h1
        className="text-center mb-1"
        style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: '28px',
          fontWeight: 600,
          color: '#3d2b1f',
        }}
      >
        Mantra Sprint
      </h1>
      <p
        className="text-center mb-6"
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '14px',
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
        }}
      >
        Deepen your practice with a focused sprint of your favorite mantras
      </p>

      {/* Success message */}
      {success && (
        <div
          className="mb-4 p-4 rounded-xl text-center animate-fade-in"
          style={{ background: 'rgba(34,139,34,0.1)', border: '1px solid rgba(34,139,34,0.2)' }}
        >
          <p style={{ color: '#228b22', fontFamily: "'DM Sans', sans-serif", fontSize: '14px' }}>{success}</p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div
          className="mb-4 p-4 rounded-xl text-center"
          style={{ background: 'rgba(200,50,50,0.08)', border: '1px solid rgba(200,50,50,0.15)' }}
        >
          <p style={{ color: '#c83232', fontFamily: "'DM Sans', sans-serif", fontSize: '14px' }}>{error}</p>
        </div>
      )}

      {/* Active Sprint */}
      {activeSprint && (
        <div
          className="mb-6 p-5 rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(184,134,11,0.12), rgba(184,134,11,0.06))',
            border: '1px solid rgba(184,134,11,0.2)',
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: '20px',
                fontWeight: 600,
                color: '#3d2b1f',
                margin: 0,
              }}
            >
              Active Sprint
            </h2>
            <span
              className="px-3 py-1 rounded-full text-xs"
              style={{
                background: 'rgba(184,134,11,0.2)',
                color: '#b8860b',
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 600,
              }}
            >
              Day {activeSprint.sprint_day} of {activeSprint.duration}
            </span>
          </div>

          {/* Progress bar */}
          <div className="mb-3" style={{ background: 'rgba(184,134,11,0.1)', borderRadius: '8px', height: '6px' }}>
            <div
              style={{
                width: `${(activeSprint.sprint_day / activeSprint.duration) * 100}%`,
                background: 'linear-gradient(90deg, #b8860b, #d4a017)',
                borderRadius: '8px',
                height: '100%',
                transition: 'width 0.5s ease',
              }}
            />
          </div>

          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 12px' }}>
            {activeSprint.mantra_count} favorite mantra{activeSprint.mantra_count > 1 ? 's' : ''} rotating over {activeSprint.duration} days
          </p>

          <button
            onClick={cancelSprint}
            className="w-full py-2.5 rounded-xl text-sm"
            style={{
              background: 'transparent',
              border: '1px solid rgba(200,50,50,0.3)',
              color: '#c83232',
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Cancel Sprint
          </button>
        </div>
      )}

      {/* Start New Sprint */}
      {!activeSprint && (
        <>
          {/* Favorites summary */}
          <div
            className="mb-5 p-4 rounded-xl"
            style={{
              background: 'rgba(184,134,11,0.06)',
              border: '1px solid rgba(184,134,11,0.12)',
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#3d2b1f', margin: 0, fontWeight: 500 }}>
                  Your Favorites
                </p>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                  {favorites.length} mantra{favorites.length !== 1 ? 's' : ''} saved
                </p>
              </div>
              <button
                onClick={() => navigate('/favorites')}
                className="px-4 py-2 rounded-full text-xs"
                style={{
                  background: 'rgba(184,134,11,0.15)',
                  color: '#b8860b',
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Manage
              </button>
            </div>

            {/* Show first few favorites */}
            {favorites.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {favorites.slice(0, 6).map(m => (
                  <span
                    key={m.id}
                    className="px-3 py-1 rounded-full text-xs"
                    style={{
                      background: 'rgba(184,134,11,0.1)',
                      color: '#7a5c3e',
                      fontFamily: "'DM Sans', sans-serif",
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {m.transliteration?.length > 25 ? m.transliteration.substring(0, 25) + '...' : m.transliteration}
                  </span>
                ))}
                {favorites.length > 6 && (
                  <span
                    className="px-3 py-1 rounded-full text-xs"
                    style={{ color: 'var(--text-secondary)', fontFamily: "'DM Sans', sans-serif" }}
                  >
                    +{favorites.length - 6} more
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Duration options */}
          {favorites.length === 0 ? (
            <div className="text-center py-8">
              <p
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: '18px',
                  color: '#7a5c3e',
                  lineHeight: 1.5,
                }}
              >
                Add some favorites first
              </p>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: 'var(--text-secondary)', margin: '8px 0 20px' }}>
                Browse the Library and heart the mantras that resonate with you
              </p>
              <button
                onClick={() => navigate('/library')}
                className="px-6 py-3 rounded-full text-sm"
                style={{
                  background: 'linear-gradient(135deg, #b8860b, #d4a017)',
                  color: '#fff',
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(184,134,11,0.3)',
                }}
              >
                Browse Library
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: '18px',
                  color: '#3d2b1f',
                  fontWeight: 600,
                  margin: '0 0 4px',
                }}
              >
                Choose Your Sprint
              </p>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 12px' }}>
                Your {favorites.length} favorite{favorites.length > 1 ? 's' : ''} will rotate across the sprint days
              </p>

              {DURATIONS.map(({ days, label, desc }) => (
                <button
                  key={days}
                  onClick={() => startSprint(days)}
                  disabled={creating}
                  className="w-full p-4 rounded-xl text-left transition-all"
                  style={{
                    background: 'rgba(253,248,240,0.8)',
                    border: '1px solid rgba(184,134,11,0.15)',
                    cursor: creating ? 'not-allowed' : 'pointer',
                    opacity: creating ? 0.6 : 1,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(184,134,11,0.08)'; e.currentTarget.style.borderColor = 'rgba(184,134,11,0.3)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(253,248,240,0.8)'; e.currentTarget.style.borderColor = 'rgba(184,134,11,0.15)'; }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '20px', fontWeight: 600, color: '#3d2b1f', margin: 0 }}>
                        {label}
                      </p>
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                        {desc}
                      </p>
                    </div>
                    <div
                      className="flex items-center justify-center rounded-full"
                      style={{
                        width: 40,
                        height: 40,
                        background: 'linear-gradient(135deg, #b8860b, #d4a017)',
                        color: '#fff',
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: '13px',
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {days}
                    </div>
                  </div>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#a07850', margin: '8px 0 0' }}>
                    Each mantra repeats ~{Math.ceil(days / favorites.length)} times
                  </p>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

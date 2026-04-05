import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from '@phosphor-icons/react';
import MantraCard from '../components/MantraCard';
import Timer from '../components/Timer';
import { useTheme } from '../contexts/ThemeContext';

export default function MantraDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { applyTradition } = useTheme();
  const [mantra, setMantra] = useState(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [view, setView] = useState('card');

  useEffect(() => {
    fetch(`/api/mantras/${id}`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        setMantra(data.mantra);
        setIsFavorited(data.mantra?.is_favorited || false);
        applyTradition(data.mantra?.tradition);
      });
  }, [id]);

  async function toggleFavorite() {
    const res = await fetch(`/api/mantras/${mantra.id}/favorite`, { method: 'POST', credentials: 'include' });
    const data = await res.json();
    if (res.ok) setIsFavorited(data.favorited);
  }

  async function handleSessionComplete(sessionData) {
    await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ mantra_id: mantra.id, ...sessionData }),
    });
    setTimeout(() => setView('card'), 3000);
  }

  return (
    <div className="min-h-screen pt-safe" style={{ background: 'var(--bg-base)' }}>
      <div className="flex items-center gap-3 px-4 pt-5 pb-2">
        <button onClick={() => navigate(-1)} style={{ color: 'var(--text-secondary)' }}>
          <ArrowLeft size={22} />
        </button>
        <h1 className="font-serif text-xl" style={{ color: 'var(--text-primary)' }}>Mantra</h1>
      </div>

      {view === 'card' ? (
        <MantraCard
          mantra={mantra}
          onBeginChanting={() => setView('timer')}
          onFavoriteToggle={toggleFavorite}
          isFavorited={isFavorited}
        />
      ) : (
        <Timer mantra={mantra} onComplete={handleSessionComplete} />
      )}
    </div>
  );
}

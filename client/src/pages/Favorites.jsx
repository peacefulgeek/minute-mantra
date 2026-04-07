import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart } from '@phosphor-icons/react';
import { useAuth } from '../contexts/AuthContext';

const TRADITION_LABELS = {
  vedic_shiva: 'Shaivite', vedic_vishnu: 'Vaishnava', vedic_shakti: 'Shakta',
  vedic_ganesha: 'Ganesha', vedic_solar: 'Solar', buddhist: 'Buddhist',
  sikh: 'Sikh', universal: 'Universal',
};

export default function Favorites() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const isPremium = user?.subscription_tier === 'platinum';

  useEffect(() => {
    fetchFavorites();
  }, []);

  async function fetchFavorites() {
    try {
      const res = await fetch('/api/mantras/favorites', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setFavorites(data.mantras);
      }
    } catch (e) {}
    finally { setLoading(false); }
  }

  async function removeFavorite(mantraId) {
    await fetch(`/api/mantras/${mantraId}/favorite`, { method: 'POST', credentials: 'include' });
    setFavorites(prev => prev.filter(m => m.id !== mantraId));
  }

  if (loading) {
    return (
      <div className="px-4 py-6">
        <div className="skeleton h-8 w-40 rounded mb-6" />
        {[1,2,3].map(i => <div key={i} className="skeleton h-20 rounded-xl mb-3" />)}
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-safe px-4 py-6">
      <div className="flex items-center justify-between mb-6 px-1">
        <h1 className="font-serif text-2xl" style={{ color: 'var(--text-accent)' }}>Favorites</h1>
        {!isPremium && (
          <span className="font-sans text-xs" style={{ color: 'var(--text-secondary)' }}>
            {favorites.length}/5 saved
          </span>
        )}
      </div>

      {!isPremium && favorites.length >= 5 && (
        <div
          className="rounded-xl p-4 mb-4 text-center"
          style={{ background: 'rgba(184,134,11,0.1)', border: '1px solid var(--border-color)' }}
        >
          <p className="font-sans text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
            Free users can save up to 5 favorites.
          </p>
          <button
            onClick={() => navigate('/settings/subscription')}
            className="font-sans text-sm px-4 py-1.5 rounded-lg"
            style={{ background: 'var(--text-accent)', color: 'var(--bg-base)' }}
          >
            Upgrade for unlimited
          </button>
        </div>
      )}

      {favorites.length === 0 ? (
        <div className="text-center py-16">
          <Heart size={48} className="mx-auto mb-4" style={{ color: 'var(--text-secondary)', opacity: 0.4 }} />
          <p className="font-serif text-lg mb-2" style={{ color: 'var(--text-primary)' }}>No favorites yet</p>
          <p className="font-sans text-sm" style={{ color: 'var(--text-secondary)' }}>
            Tap the heart on any mantra to save it here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {favorites.map(mantra => (
            <div
              key={mantra.id}
              className="rounded-xl p-4"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
            >
              <div className="flex items-start justify-between gap-3">
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => navigate(`/mantra/${mantra.id}`)}
                >
                  <p
                    className="font-serif text-base italic mb-1"
                    style={{ color: 'var(--text-accent)' }}
                  >
                    {mantra.transliteration}
                  </p>
                  <p className="font-sans text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
                    {TRADITION_LABELS[mantra.tradition]} · {mantra.intention}
                  </p>
                  <p className="font-sans text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {mantra.english_translation}
                  </p>
                </div>
                <button
                  onClick={() => removeFavorite(mantra.id)}
                  className="p-1 flex-shrink-0"
                  style={{ color: '#e74c3c' }}
                >
                  <Heart size={20} weight="fill" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import React, { useState, useRef } from 'react';
import { SpeakerHigh, Heart, ArrowRight, Play, Stop } from '@phosphor-icons/react';

const TRADITION_LABELS = {
  vedic_shiva: 'Vedic / Shaivite',
  vedic_vishnu: 'Vedic / Vaishnava',
  vedic_shakti: 'Vedic / Shakta',
  vedic_ganesha: 'Vedic / Ganesha',
  vedic_solar: 'Vedic / Solar',
  buddhist: 'Buddhist',
  sikh: 'Sikh / Gurbani',
  universal: 'Universal',
};

// Rich Easter purple
const PURPLE = '#6B2FA0';

export default function MantraCard({ mantra, onBeginChanting, onFavoriteToggle, isFavorited }) {
  const [heartAnim, setHeartAnim] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const audioRef = useRef(null);

  function handleFavorite() {
    setHeartAnim(true);
    setTimeout(() => setHeartAnim(false), 300);
    onFavoriteToggle?.();
  }

  // Single-click audio — plays immediately, no two-step reveal
  function toggleAudio() {
    if (playing && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setPlaying(false);
      return;
    }

    if (!audioRef.current) {
      audioRef.current = new Audio(mantra.audio_url);
      audioRef.current.onended = () => setPlaying(false);
      audioRef.current.onerror = () => {
        setAudioError(true);
        setPlaying(false);
      };
    }
    audioRef.current.play()
      .then(() => setPlaying(true))
      .catch(() => setAudioError(true));
  }

  if (!mantra) {
    return (
      <div className="px-6 py-8">
        <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="skeleton h-8 w-3/4 rounded mb-4" />
          <div className="skeleton h-5 w-1/2 rounded mb-3" />
          <div className="skeleton h-4 w-full rounded mb-2" />
          <div className="skeleton h-4 w-5/6 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 animate-slide-up">
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
        }}
      >
        {/* Tradition badge */}
        <div
          className="px-5 py-3 flex items-center justify-between"
          style={{ borderBottom: '1px solid var(--border-color)' }}
        >
          <span
            className="text-xs tracking-widest uppercase"
            style={{ color: PURPLE, fontFamily: "'DM Sans', sans-serif" }}
          >
            {TRADITION_LABELS[mantra.tradition] || mantra.tradition}
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(107,47,160,0.1)', color: '#5a3e1b', fontFamily: "'DM Sans', sans-serif" }}
          >
            {mantra.intention}
          </span>
        </div>

        {/* Main content */}
        <div className="px-5 pt-6 pb-4">

          {/* TRANSLITERATION — top, same size as English, rich purple */}
          <p
            className="text-center mb-3"
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: '24px',
              fontWeight: 600,
              lineHeight: 1.4,
              color: PURPLE,
            }}
          >
            {mantra.transliteration}
          </p>

          {/* ENGLISH TRANSLATION — largest, most prominent */}
          <p
            className="text-center mb-4"
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: '24px',
              fontWeight: 500,
              lineHeight: 1.4,
              color: '#3d2b1f',
            }}
          >
            {mantra.english_translation}
          </p>

          {/* Original script (Sanskrit/Gurmukhi) — rich purple, 3pts larger than before */}
          <p
            className="text-center mb-4"
            style={{
              fontFamily: mantra.tradition === 'sikh'
                ? 'Noto Sans Gurmukhi, serif'
                : 'Noto Sans Devanagari, Cormorant Garamond, serif',
              fontSize: '23px',
              lineHeight: 1.5,
              color: PURPLE,
            }}
          >
            {mantra.original_script}
          </p>

          {/* Audio pronunciation — single click plays immediately */}
          {mantra.audio_url && !audioError && (
            <div className="flex justify-center mb-4">
              <button
                onClick={toggleAudio}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm"
                style={{
                  background: playing ? PURPLE : 'rgba(107,47,160,0.08)',
                  color: playing ? '#ffffff' : PURPLE,
                  border: `1px solid ${playing ? PURPLE : 'rgba(107,47,160,0.25)'}`,
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 500,
                  transition: 'all 0.2s',
                }}
              >
                {playing ? <Stop size={16} /> : <SpeakerHigh size={16} />}
                {playing ? 'Stop' : 'Hear pronunciation'}
              </button>
            </div>
          )}

          {/* Context note */}
          {mantra.context_note && (
            <p
              className="text-center text-sm leading-relaxed mb-4 px-2"
              style={{
                color: '#5a3e1b',
                fontFamily: "'DM Sans', sans-serif",
                fontStyle: 'italic',
              }}
            >
              {mantra.context_note}
            </p>
          )}

          {/* Go Deeper — clearly readable */}
          {mantra.go_deeper_teaser && (
            <a
              href={mantra.go_deeper_url || 'https://paulwagner.com'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1 mb-4"
              style={{
                color: PURPLE,
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '15px',
                fontWeight: 600,
              }}
            >
              <span>{mantra.go_deeper_teaser}</span>
              <ArrowRight size={14} weight="bold" />
            </a>
          )}
        </div>

        {/* Actions */}
        <div
          className="px-5 py-4 flex items-center gap-3"
          style={{ borderTop: '1px solid var(--border-color)' }}
        >
          {/* Favorite */}
          <button
            onClick={handleFavorite}
            className="p-2 rounded-full"
            style={{
              color: isFavorited ? '#e74c3c' : 'var(--text-secondary)',
              transform: heartAnim ? 'scale(1.4)' : 'scale(1)',
              transition: 'transform 0.3s, color 0.2s',
            }}
          >
            <Heart size={22} weight={isFavorited ? 'fill' : 'regular'} />
          </button>

          {/* Begin Chanting — high contrast gold */}
          <button
            onClick={onBeginChanting}
            className="flex-1 py-3.5 rounded-xl text-base tracking-wide"
            style={{
              background: 'linear-gradient(135deg, #b8860b, #d4a017)',
              color: '#ffffff',
              fontFamily: "'DM Sans', system-ui, sans-serif",
              fontWeight: 600,
              fontSize: '16px',
              letterSpacing: '0.05em',
              border: 'none',
              boxShadow: '0 4px 16px rgba(184,134,11,0.3)',
            }}
          >
            Begin Chanting
          </button>
        </div>
      </div>
    </div>
  );
}

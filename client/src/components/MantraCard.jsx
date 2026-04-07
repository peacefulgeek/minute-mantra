import React, { useState } from 'react';
import { SpeakerHigh, Heart, ArrowRight } from '@phosphor-icons/react';
import AudioPlayer from './AudioPlayer';

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

export default function MantraCard({ mantra, onBeginChanting, onFavoriteToggle, isFavorited }) {
  const [heartAnim, setHeartAnim] = useState(false);
  const [showAudio, setShowAudio] = useState(false);

  function handleFavorite() {
    setHeartAnim(true);
    setTimeout(() => setHeartAnim(false), 300);
    onFavoriteToggle?.();
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
            className="text-xs font-sans tracking-widest uppercase"
            style={{ color: 'var(--text-accent)' }}
          >
            {TRADITION_LABELS[mantra.tradition] || mantra.tradition}
          </span>
          <span
            className="text-xs font-sans px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(184,134,11,0.1)', color: 'var(--text-secondary)' }}
          >
            {mantra.intention}
          </span>
        </div>

        {/* Main content */}
        <div className="px-5 pt-6 pb-4">

          {/* ENGLISH TRANSLATION — largest, most prominent */}
          <p
            className="text-center mb-5"
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

          {/* Original script (Sanskrit/Gurmukhi) — smaller, secondary */}
          <p
            className="text-center mb-2"
            style={{
              fontFamily: mantra.tradition === 'sikh'
                ? 'Noto Sans Gurmukhi, serif'
                : 'Noto Sans Devanagari, Cormorant Garamond, serif',
              fontSize: '20px',
              lineHeight: 1.5,
              color: 'var(--text-secondary)',
            }}
          >
            {mantra.original_script}
          </p>

          {/* Transliteration */}
          <p
            className="text-center mb-4"
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: '16px',
              fontStyle: 'italic',
              color: 'var(--text-accent)',
            }}
          >
            {mantra.transliteration}
          </p>

          {/* Audio pronunciation */}
          {mantra.audio_url && (
            <div className="flex justify-center mb-4">
              <button
                onClick={() => setShowAudio(prev => !prev)}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-sans"
                style={{
                  background: 'rgba(184,134,11,0.08)',
                  color: '#7a5c3e',
                  border: '1px solid rgba(184,134,11,0.2)',
                }}
              >
                <SpeakerHigh size={16} />
                Hear pronunciation
              </button>
            </div>
          )}

          {showAudio && mantra.audio_url && (
            <div className="mb-4">
              <AudioPlayer src={mantra.audio_url} phonetic={mantra.phonetic_guide} autoPlay={true} />
            </div>
          )}

          {/* Context note */}
          {mantra.context_note && (
            <p
              className="text-center text-sm leading-relaxed mb-4 px-2"
              style={{
                color: '#7a5c3e',
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
                color: '#b8860b',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '15px',
                fontWeight: 500,
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

          {/* Begin Chanting — high contrast, clearly readable */}
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

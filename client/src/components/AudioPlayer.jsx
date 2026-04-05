import React, { useState, useRef } from 'react';
import { Play, Stop, SpeakerHigh } from '@phosphor-icons/react';

export default function AudioPlayer({ src, phonetic }) {
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState(false);
  const audioRef = useRef(null);

  function toggle() {
    if (!audioRef.current) {
      audioRef.current = new Audio(src);
      audioRef.current.onended = () => setPlaying(false);
      audioRef.current.onerror = () => {
        setError(true);
        setPlaying(false);
      };
    }

    if (playing) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setPlaying(false);
    } else {
      audioRef.current.play().then(() => setPlaying(true)).catch(() => setError(true));
    }
  }

  if (error || !src) {
    return phonetic ? (
      <div className="text-center text-sm py-2" style={{ color: 'var(--text-secondary)' }}>
        <SpeakerHigh size={14} className="inline mr-1" />
        <span className="italic">{phonetic}</span>
      </div>
    ) : null;
  }

  return (
    <div className="flex items-center justify-center gap-3">
      <button
        onClick={toggle}
        className="flex items-center gap-2 px-5 py-2.5 rounded-full font-sans text-sm"
        style={{
          background: playing ? 'var(--text-accent)' : 'rgba(255,255,255,0.08)',
          color: playing ? 'var(--bg-base)' : 'var(--text-primary)',
          border: '1px solid var(--border-color)',
          transition: 'all 0.2s',
        }}
      >
        {playing ? <Stop size={16} /> : <Play size={16} />}
        {playing ? 'Playing...' : 'Play pronunciation'}
      </button>
    </div>
  );
}

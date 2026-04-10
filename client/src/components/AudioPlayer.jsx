import React, { useState, useRef, useEffect } from 'react';
import { Play, Stop, SpeakerHigh } from '@phosphor-icons/react';

export default function AudioPlayer({ src, phonetic, autoPlay = false }) {
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState(false);
  const audioRef = useRef(null);

  // Auto-play when component mounts (user already clicked "Hear pronunciation")
  useEffect(() => {
    if (autoPlay && src) {
      play();
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  function play() {
    if (!audioRef.current) {
      audioRef.current = new Audio(src);
      audioRef.current.onended = () => setPlaying(false);
      audioRef.current.onerror = () => {
        setError(true);
        setPlaying(false);
      };
    }
    audioRef.current.play().then(() => setPlaying(true)).catch(() => setError(true));
  }

  function toggle() {
    if (playing) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setPlaying(false);
    } else {
      play();
    }
  }

  if (error || !src) {
    return phonetic ? (
      <div className="text-center text-sm py-2" style={{ color: '#7a5c3e' }}>
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
          background: playing ? '#d4922a' : 'rgba(212,146,42,0.08)',
          color: playing ? '#ffffff' : '#5a3e1b',
          border: '1px solid rgba(212,146,42,0.2)',
          transition: 'all 0.2s',
        }}
      >
        {playing ? <Stop size={16} /> : <Play size={16} />}
        {playing ? 'Playing...' : 'Play again'}
      </button>
    </div>
  );
}

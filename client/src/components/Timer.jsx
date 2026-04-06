import React, { useEffect, useRef, useState, useCallback } from 'react';
import SacredGeometry from './SacredGeometry';
import BreathingPreamble from './BreathingPreamble';
import MalaCounter from './MalaCounter';
import { useAuth } from '../contexts/AuthContext';

const CDN = import.meta.env.VITE_CDN_BASE_URL || 'https://minute-mantra.b-cdn.net';

const DURATIONS = [
  { label: '1 min', seconds: 60 },
  { label: '2 min', seconds: 120, premium: true },
  { label: '5 min', seconds: 300, premium: true },
  { label: '10 min', seconds: 600, premium: true },
];

export default function Timer({ mantra, onComplete }) {
  const { user } = useAuth();
  const isPremium = user?.subscription_tier === 'premium';

  const [phase, setPhase] = useState('idle'); // idle | breathing | chanting | complete
  const [selectedDuration, setSelectedDuration] = useState(60);
  const [elapsed, setElapsed] = useState(0);
  const [showTime, setShowTime] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [malaMode, setMalaMode] = useState(false);
  const [malaCount, setMalaCount] = useState(0);

  const intervalRef = useRef(null);
  const bowlLoopRef = useRef(null);
  const bowlStrikeRef = useRef(null);
  const wakeLockRef = useRef(null);

  const progress = Math.min(1, elapsed / selectedDuration);

  // Wake lock
  async function acquireWakeLock() {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
      }
    } catch (e) {}
  }

  function releaseWakeLock() {
    if (wakeLockRef.current) {
      wakeLockRef.current.release();
      wakeLockRef.current = null;
    }
  }

  // Singing bowl audio
  function startBowlLoop() {
    if (!isPremium) return;
    try {
      bowlLoopRef.current = new Audio(`${CDN}/audio/singing-bowl-loop.mp3`);
      bowlLoopRef.current.loop = true;
      bowlLoopRef.current.volume = 0;
      bowlLoopRef.current.play().catch(() => {});
      // Fade in
      let vol = 0;
      const fade = setInterval(() => {
        vol = Math.min(0.3, vol + 0.03);
        if (bowlLoopRef.current) bowlLoopRef.current.volume = vol;
        if (vol >= 0.3) clearInterval(fade);
      }, 50);
    } catch (e) {}
  }

  function stopBowlLoop() {
    if (bowlLoopRef.current) {
      let vol = bowlLoopRef.current.volume;
      const fade = setInterval(() => {
        vol = Math.max(0, vol - 0.05);
        if (bowlLoopRef.current) bowlLoopRef.current.volume = vol;
        if (vol <= 0) {
          clearInterval(fade);
          if (bowlLoopRef.current) {
            bowlLoopRef.current.pause();
            bowlLoopRef.current = null;
          }
        }
      }, 50);
    }
  }

  function playBowlStrike() {
    try {
      bowlStrikeRef.current = new Audio(`${CDN}/audio/singing-bowl-strike.mp3`);
      bowlStrikeRef.current.volume = 0.8;
      bowlStrikeRef.current.play().catch(() => {});
    } catch (e) {}
  }

  function startChanting() {
    setPhase('chanting');
    setElapsed(0);
    acquireWakeLock();
    startBowlLoop();

    intervalRef.current = setInterval(() => {
      setElapsed(prev => {
        const next = prev + 0.1;
        if (next >= selectedDuration) {
          clearInterval(intervalRef.current);
          handleComplete(selectedDuration);
          return selectedDuration;
        }
        return next;
      });
    }, 100);
  }

  function handleComplete(duration) {
    setCompleting(true);
    stopBowlLoop();
    releaseWakeLock();

    setTimeout(() => {
      playBowlStrike();
    }, 500);

    setTimeout(() => {
      setCompleting(false);
      setPhase('complete');
      onComplete?.({ duration_seconds: Math.round(duration), mode: 'timer', mala_count: 0 });
    }, 2000);
  }

  function handleMalaComplete() {
    stopBowlLoop();
    releaseWakeLock();
    playBowlStrike();
    setTimeout(() => {
      setPhase('complete');
      onComplete?.({ duration_seconds: 0, mode: 'mala', mala_count: 108 });
    }, 1500);
  }

  function handleScreenTap() {
    if (phase === 'chanting') {
      setShowTime(prev => !prev);
    }
  }

  useEffect(() => {
    return () => {
      clearInterval(intervalRef.current);
      stopBowlLoop();
      releaseWakeLock();
    };
  }, []);

  // IDLE STATE
  if (phase === 'idle') {
    return (
      <div className="flex flex-col items-center gap-6 px-6 py-8">
        {/* Duration selector */}
        <div className="flex gap-2">
          {DURATIONS.map(({ label, seconds, premium }) => {
            const locked = premium && !isPremium;
            return (
              <button
                key={seconds}
                onClick={() => !locked && setSelectedDuration(seconds)}
                className="px-3 py-1.5 rounded-lg text-sm font-sans relative"
                style={{
                  background: selectedDuration === seconds ? 'var(--text-accent)' : 'var(--bg-card)',
                  color: selectedDuration === seconds ? 'var(--bg-base)' : locked ? 'var(--text-secondary)' : 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  opacity: locked ? 0.6 : 1,
                }}
              >
                {label}
                {locked && <span className="absolute -top-1 -right-1 text-xs">🔒</span>}
              </button>
            );
          })}
        </div>

        {/* Mala mode toggle (premium) */}
        {isPremium && (
          <button
            onClick={() => setMalaMode(prev => !prev)}
            className="text-sm font-sans px-4 py-2 rounded-lg"
            style={{
              background: malaMode ? 'var(--text-accent)' : 'var(--bg-card)',
              color: malaMode ? 'var(--bg-base)' : 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
            }}
          >
            {malaMode ? '● Mala Mode' : '○ Mala Mode'}
          </button>
        )}

        <button
          onClick={() => setPhase('breathing')}
          className="w-full max-w-xs py-4 rounded-2xl font-serif text-lg tracking-wide"
          style={{
            background: 'var(--text-accent)',
            color: '#ffffff',
            boxShadow: '0 4px 20px var(--geometry-glow)',
          }}
        >
          Begin Chanting
        </button>
      </div>
    );
  }

  // BREATHING PREAMBLE
  if (phase === 'breathing') {
    return (
      <BreathingPreamble
        onComplete={startChanting}
        onSkip={startChanting}
      />
    );
  }

  // MALA MODE
  if (phase === 'chanting' && malaMode) {
    return (
      <MalaCounter
        count={malaCount}
        onBead={() => setMalaCount(prev => prev + 1)}
        onComplete={handleMalaComplete}
        mantra={mantra}
      />
    );
  }

  // CHANTING TIMER
  if (phase === 'chanting') {
    const remaining = selectedDuration - elapsed;
    const mins = Math.floor(remaining / 60);
    const secs = Math.floor(remaining % 60);

    return (
      <div
        className="fixed inset-0 flex flex-col items-center justify-center"
        style={{ background: 'var(--bg-base)', cursor: 'pointer' }}
        onClick={handleScreenTap}
      >
        {/* Mantra text */}
        <div className="text-center mb-8 px-8">
          <p className="font-serif text-xl mb-2" style={{ color: 'var(--text-accent)', fontFamily: 'Noto Sans Devanagari, serif' }}>
            {mantra?.original_script}
          </p>
          <p className="font-serif text-base italic" style={{ color: 'var(--text-secondary)' }}>
            {mantra?.transliteration}
          </p>
        </div>

        {/* Sacred geometry */}
        <div className="relative">
          <SacredGeometry
            type={mantra?.sacred_geometry_type || 'seed_of_life'}
            progress={progress}
            size={260}
            completing={completing}
          />
          {/* Numeric timer (tap to reveal) */}
          {showTime && (
            <div
              className="absolute inset-0 flex items-center justify-center font-serif"
              style={{ color: 'var(--text-accent)', fontSize: '32px', pointerEvents: 'none' }}
            >
              {mins}:{secs.toString().padStart(2, '0')}
            </div>
          )}
        </div>

        <p className="mt-8 text-sm font-sans" style={{ color: 'var(--text-secondary)' }}>
          Tap to {showTime ? 'hide' : 'show'} time
        </p>
      </div>
    );
  }

  // COMPLETE
  if (phase === 'complete') {
    return (
      <div className="flex flex-col items-center gap-6 px-6 py-8 animate-fade-in">
        <div style={{ opacity: 0.5 }}>
          <SacredGeometry
            type={mantra?.sacred_geometry_type || 'seed_of_life'}
            progress={1}
            size={200}
          />
        </div>
        <div className="text-center">
          <h2 className="font-serif text-2xl mb-2" style={{ color: 'var(--text-accent)' }}>
            Session Complete
          </h2>
          <p className="font-sans text-sm" style={{ color: 'var(--text-secondary)' }}>
            {malaMode ? '108 beads completed' : `${Math.round(selectedDuration / 60)} minute${selectedDuration > 60 ? 's' : ''} of chanting`}
          </p>
        </div>
      </div>
    );
  }

  return null;
}

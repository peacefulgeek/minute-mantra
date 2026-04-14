import React, { useEffect, useRef, useState } from 'react';
import MalaCounter from './MalaCounter';
import { useAuth } from '../contexts/AuthContext';

const CDN = import.meta.env.VITE_CDN_BASE_URL || 'https://minute-mantra.b-cdn.net';
const PURPLE = '#6B2FA0';

const DURATIONS = [
  { label: '1 min', seconds: 60 },
  { label: '2 min', seconds: 120, premium: true },
  { label: '5 min', seconds: 300, premium: true },
  { label: '10 min', seconds: 600, premium: true },
];

export default function Timer({ mantra, onComplete }) {
  const { user } = useAuth();
  const isPremium = user?.subscription_tier === 'gold';

  const phaseRef = useRef('idle');
  const [phase, _setPhase] = useState('idle'); // idle | chanting | complete
  const setPhase = (p) => { phaseRef.current = p; _setPhase(p); };
  const [selectedDuration, setSelectedDuration] = useState(60);
  const [elapsed, setElapsed] = useState(0);
  const [showTime, setShowTime] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [malaMode, setMalaMode] = useState(false);
  const [malaCount, setMalaCount] = useState(0);

  const [audioRepeat, setAudioRepeat] = useState(false);
  const audioRepeatRef = useRef(false);

  const intervalRef = useRef(null);
  const bowlLoopRef = useRef(null);
  const bowlStrikeRef = useRef(null);
  const wakeLockRef = useRef(null);
  const mantraAudioRef = useRef(null);

  const progress = Math.min(1, elapsed / selectedDuration);

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

  function startBowlLoop() {
    if (!isPremium) return;
    try {
      bowlLoopRef.current = new Audio(`${CDN}/audio/singing-bowl-loop.mp3`);
      bowlLoopRef.current.loop = true;
      bowlLoopRef.current.volume = 0;
      bowlLoopRef.current.play().catch(() => {});
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
    stopMantraAudio();
    setAudioRepeat(false);
    releaseWakeLock();
    setTimeout(() => playBowlStrike(), 500);
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

  // Preload mantra audio when entering chanting phase
  useEffect(() => {
    if (phase === 'chanting' && mantra?.audio_url && !mantraAudioRef.current) {
      const audio = new Audio(mantra.audio_url);
      audio.preload = 'auto';
      audio.volume = 0.85;
      mantraAudioRef.current = audio;
    }
  }, [phase, mantra?.audio_url]);

  function playMantraAudio() {
    if (!mantra?.audio_url) return;
    // Reuse preloaded audio — just reset and play
    if (mantraAudioRef.current) {
      mantraAudioRef.current.pause();
      mantraAudioRef.current.currentTime = 0;
      mantraAudioRef.current.loop = audioRepeatRef.current;
      mantraAudioRef.current.play().catch(() => {});
    } else {
      // Fallback: create new if somehow not preloaded
      const audio = new Audio(mantra.audio_url);
      audio.volume = 0.85;
      audio.loop = audioRepeatRef.current;
      mantraAudioRef.current = audio;
      audio.play().catch(() => {});
    }
  }

  function stopMantraAudio() {
    if (mantraAudioRef.current) {
      mantraAudioRef.current.pause();
      mantraAudioRef.current.currentTime = 0;
      mantraAudioRef.current = null;
    }
  }

  // Keep ref in sync with state
  useEffect(() => {
    audioRepeatRef.current = audioRepeat;
  }, [audioRepeat]);

  function handleScreenTap() {
    if (phase === 'chanting') {
      setShowTime(prev => !prev);
    }
  }

  useEffect(() => {
    return () => {
      clearInterval(intervalRef.current);
      stopBowlLoop();
      stopMantraAudio();
      releaseWakeLock();
    };
  }, []);

  // Simple progress ring — no sacred geometry, no black box
  function ProgressRing({ progress: p, size = 220 }) {
    const strokeWidth = 3;
    const radius = (size - strokeWidth * 2) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - p);

    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(107,47,160,0.1)"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={PURPLE}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.1s linear' }}
        />
      </svg>
    );
  }

  // IDLE STATE
  if (phase === 'idle') {
    return (
      <div className="flex flex-col items-center gap-6 px-6 py-8">
        <div className="flex gap-2">
          {DURATIONS.map(({ label, seconds, premium }) => {
            const locked = premium && !isPremium;
            return (
              <button
                key={seconds}
                onClick={() => !locked && setSelectedDuration(seconds)}
                className="px-3 py-1.5 rounded-lg text-sm relative"
                style={{
                  background: selectedDuration === seconds ? PURPLE : 'var(--bg-card)',
                  color: selectedDuration === seconds ? '#ffffff' : locked ? 'var(--text-secondary)' : 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  opacity: locked ? 0.6 : 1,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {label}
                {locked && <span className="absolute -top-1 -right-1 text-xs">🔒</span>}
              </button>
            );
          })}
        </div>

        {isPremium && (
          <button
            onClick={() => setMalaMode(prev => !prev)}
            className="text-sm px-4 py-2 rounded-lg"
            style={{
              background: malaMode ? PURPLE : 'var(--bg-card)',
              color: malaMode ? '#ffffff' : 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {malaMode ? '● Mala Mode' : '○ Mala Mode'}
          </button>
        )}

        <button
          onClick={startChanting}
          className="w-full max-w-xs py-4 rounded-2xl text-lg tracking-wide"
          style={{
            background: 'linear-gradient(135deg, #b8860b, #d4a017)',
            color: '#ffffff',
            fontFamily: "'DM Sans', system-ui, sans-serif",
            fontWeight: 600,
            boxShadow: '0 4px 20px rgba(184,134,11,0.3)',
          }}
        >
          Begin Chanting
        </button>
      </div>
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

  // CHANTING TIMER — clean, no sacred geometry
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
        {/* Transliteration — big, top, rich purple */}
        <p
          className="text-center mb-3 px-8"
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: '26px',
            fontWeight: 600,
            color: PURPLE,
          }}
        >
          {mantra?.transliteration}
        </p>

        {/* Sanskrit — purple, slightly smaller */}
        <p
          className="text-center mb-8 px-8"
          style={{
            fontFamily: mantra?.tradition === 'sikh'
              ? 'Noto Sans Gurmukhi, serif'
              : 'Noto Sans Devanagari, serif',
            fontSize: '23px',
            color: PURPLE,
            opacity: 0.8,
          }}
        >
          {mantra?.original_script}
        </p>

        {/* Simple progress ring */}
        <div className="relative flex items-center justify-center">
          <ProgressRing progress={progress} size={220} />
          {/* Content inside circle */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ pointerEvents: 'none', gap: '6px' }}
          >
            {/* Poetic intention — always visible */}
            <span
              style={{
                color: PURPLE,
                fontSize: '16px',
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontWeight: 600,
                fontStyle: 'italic',
                textAlign: 'center',
                letterSpacing: '0.5px',
              }}
            >
              You Are {mantra?.intention || 'Love'}
            </span>
            {/* Timer countdown — appears below meaning when visible */}
            {showTime && (
              <span
                style={{
                  color: PURPLE,
                  fontSize: '19px',
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontWeight: 300,
                  opacity: 0.7,
                }}
              >
                {mins}:{secs.toString().padStart(2, '0')}
              </span>
            )}
          </div>
          {/* Show Time — at very bottom inside circle */}
          <div
            className="absolute flex items-center justify-center"
            style={{
              bottom: '18px',
              left: 0,
              right: 0,
              pointerEvents: 'auto',
            }}
            onClick={(e) => { e.stopPropagation(); setShowTime(prev => !prev); }}
          >
            <span
              style={{
                color: 'rgba(107,47,160,0.45)',
                fontSize: '12px',
                fontFamily: "'DM Sans', sans-serif",
                letterSpacing: '0.3px',
                cursor: 'pointer',
              }}
            >
              {showTime ? 'Hide Time' : 'Show Time'}
            </span>
          </div>
        </div>

        {/* Mantra audio controls — subtle, bottom area */}
        {mantra?.audio_url && (
          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={(e) => { e.stopPropagation(); playMantraAudio(); }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm"
              style={{
                background: 'rgba(107,47,160,0.08)',
                color: PURPLE,
                border: '1px solid rgba(107,47,160,0.15)',
                fontFamily: "'DM Sans', sans-serif",
                transition: 'all 0.2s',
              }}
            >
              <span style={{ fontSize: '14px' }}>▶</span>
              Replay Audio
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                const next = !audioRepeat;
                setAudioRepeat(next);
                audioRepeatRef.current = next;
                if (next) {
                  // Start looping
                  playMantraAudio();
                } else {
                  // Turn off loop but let current play finish
                  if (mantraAudioRef.current) {
                    mantraAudioRef.current.loop = false;
                  }
                }
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm"
              style={{
                background: audioRepeat ? PURPLE : 'rgba(107,47,160,0.08)',
                color: audioRepeat ? '#ffffff' : PURPLE,
                border: `1px solid ${audioRepeat ? PURPLE : 'rgba(107,47,160,0.15)'}`,
                fontFamily: "'DM Sans', sans-serif",
                transition: 'all 0.2s',
              }}
            >
              <span style={{ fontSize: '14px' }}>🔁</span>
              {audioRepeat ? 'Continual ✓' : 'Continual Audio'}
            </button>
          </div>
        )}


      </div>
    );
  }

  // COMPLETE
  if (phase === 'complete') {
    return (
      <div className="flex flex-col items-center gap-6 px-6 py-12 animate-fade-in">
        <div className="relative flex items-center justify-center">
          <ProgressRing progress={1} size={180} />
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ color: PURPLE, fontSize: '28px', fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            ✓
          </div>
        </div>
        <div className="text-center">
          <h2
            className="text-2xl mb-2"
            style={{ color: PURPLE, fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            Session Complete
          </h2>
          <p
            className="text-sm"
            style={{ color: '#5a3e1b', fontFamily: "'DM Sans', sans-serif" }}
          >
            {malaMode ? '108 beads completed' : `${Math.round(selectedDuration / 60)} minute${selectedDuration > 60 ? 's' : ''} of chanting`}
          </p>
        </div>
      </div>
    );
  }

  return null;
}

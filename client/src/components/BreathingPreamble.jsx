import React, { useEffect, useState } from 'react';

export default function BreathingPreamble({ onComplete, onSkip }) {
  const [phase, setPhase] = useState('in'); // 'in' | 'out'
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(prev => {
        const next = prev + 0.1;
        if (next >= 5) {
          clearInterval(interval);
          onComplete?.();
          return 5;
        }
        if (next >= 2.5 && phase === 'in') setPhase('out');
        return next;
      });
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const isIn = elapsed < 2.5;
  const phaseProgress = isIn ? elapsed / 2.5 : (elapsed - 2.5) / 2.5;
  const scale = isIn
    ? 0.6 + 0.6 * phaseProgress
    : 1.2 - 0.6 * phaseProgress;
  const opacity = isIn
    ? 0.5 + 0.5 * phaseProgress
    : 1 - 0.5 * phaseProgress;

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center z-50" style={{ background: 'var(--bg-base)' }}>
      {/* Skip */}
      <button
        onClick={onSkip}
        className="absolute top-8 right-6 text-sm font-sans"
        style={{ color: 'var(--text-secondary)' }}
      >
        Skip
      </button>

      {/* Breathing circle */}
      <div className="relative flex items-center justify-center mb-12">
        <div
          style={{
            width: '180px',
            height: '180px',
            borderRadius: '50%',
            border: '2px solid var(--geometry-stroke)',
            transform: `scale(${scale})`,
            opacity,
            transition: 'transform 0.1s linear, opacity 0.1s linear',
            boxShadow: `0 0 ${20 * opacity}px var(--geometry-glow)`,
          }}
        />
        <div
          className="absolute font-serif text-center"
          style={{ color: 'var(--text-accent)', fontSize: '15px', letterSpacing: '2px' }}
        >
          {isIn ? 'breathe in' : 'breathe out'}
        </div>
      </div>

      <p className="font-serif text-base" style={{ color: 'var(--text-secondary)' }}>
        Prepare to chant
      </p>
    </div>
  );
}

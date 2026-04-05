import React, { useEffect } from 'react';

const TOTAL_BEADS = 108;

export default function MalaCounter({ count, onBead, onComplete, mantra }) {
  useEffect(() => {
    if (count >= TOTAL_BEADS) {
      onComplete?.();
    }
  }, [count]);

  const radius = 120;
  const cx = 160;
  const cy = 160;

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center"
      style={{ background: 'var(--bg-base)' }}
      onClick={onBead}
    >
      {/* Mantra */}
      <div className="text-center mb-4 px-8">
        <p className="font-serif text-lg" style={{ color: 'var(--text-accent)', fontFamily: 'Noto Sans Devanagari, serif' }}>
          {mantra?.original_script}
        </p>
      </div>

      {/* Mala ring */}
      <svg width="320" height="320" viewBox="0 0 320 320">
        {Array.from({ length: TOTAL_BEADS }, (_, i) => {
          const angle = (i / TOTAL_BEADS) * 2 * Math.PI - Math.PI / 2;
          const x = cx + radius * Math.cos(angle);
          const y = cy + radius * Math.sin(angle);
          const isActive = i < count;
          const isCurrent = i === count;

          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={isCurrent ? 5 : 3}
              style={{
                fill: isActive ? 'var(--geometry-stroke)' : isCurrent ? 'var(--text-accent)' : 'var(--bg-card)',
                stroke: 'var(--border-color)',
                strokeWidth: 0.5,
                filter: isCurrent ? 'drop-shadow(0 0 4px var(--geometry-glow))' : 'none',
                transition: 'fill 0.2s, r 0.2s',
              }}
            />
          );
        })}
        {/* Counter */}
        <text
          x={cx}
          y={cy - 10}
          textAnchor="middle"
          style={{ fill: 'var(--text-accent)', fontFamily: 'Cormorant Garamond, serif', fontSize: '32px' }}
        >
          {count}
        </text>
        <text
          x={cx}
          y={cy + 20}
          textAnchor="middle"
          style={{ fill: 'var(--text-secondary)', fontFamily: 'DM Sans, sans-serif', fontSize: '13px' }}
        >
          / 108
        </text>
      </svg>

      <p className="mt-4 text-sm font-sans" style={{ color: 'var(--text-secondary)' }}>
        Tap anywhere to advance a bead
      </p>
    </div>
  );
}

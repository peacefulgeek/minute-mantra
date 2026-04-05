import React from 'react';

function getFlameConfig(streak) {
  if (streak >= 365) return { size: 40, color: '#FFD700', particles: true, label: 'eternal' };
  if (streak >= 91) return { size: 36, color: '#FF6B00', particles: true, label: 'blazing' };
  if (streak >= 31) return { size: 32, color: '#FF8C00', particles: false, label: 'bright' };
  if (streak >= 8) return { size: 28, color: '#FFA500', particles: false, label: 'steady' };
  return { size: 22, color: '#FFB347', particles: false, label: 'ember' };
}

export default function StreakFlame({ streak = 0, showCount = true }) {
  if (streak === 0) return null;

  const config = getFlameConfig(streak);

  return (
    <div className="flex items-center gap-2">
      <span
        className="animate-flame-flicker inline-block"
        style={{
          fontSize: `${config.size}px`,
          filter: `drop-shadow(0 0 6px ${config.color}88)`,
          lineHeight: 1,
        }}
      >
        🔥
      </span>
      {showCount && (
        <div className="flex flex-col">
          <span
            className="font-serif font-semibold leading-none"
            style={{ color: config.color, fontSize: '18px' }}
          >
            {streak}
          </span>
          <span className="font-sans text-xs" style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>
            day streak
          </span>
        </div>
      )}
    </div>
  );
}

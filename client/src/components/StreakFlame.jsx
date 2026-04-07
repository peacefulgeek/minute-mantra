import React from 'react';

function getFlameConfig(streak) {
  if (streak >= 365) return { size: 28, color: '#FFD700' };
  if (streak >= 91) return { size: 26, color: '#FF6B00' };
  if (streak >= 31) return { size: 24, color: '#FF8C00' };
  if (streak >= 8) return { size: 22, color: '#FFA500' };
  return { size: 20, color: '#FFB347' };
}

export default function StreakFlame({ streak = 0, showCount = true }) {
  if (streak === 0) return null;

  const config = getFlameConfig(streak);

  return (
    <div className="flex items-center gap-1.5">
      <span
        className="animate-flame-flicker inline-block"
        style={{
          fontSize: `${config.size}px`,
          filter: `drop-shadow(0 0 4px ${config.color}88)`,
          lineHeight: 1,
        }}
      >
        🔥
      </span>
      {showCount && (
        <span
          style={{
            color: '#7a5c3e',
            fontSize: '15px',
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 600,
            whiteSpace: 'nowrap',
          }}
        >
          {streak} day streak
        </span>
      )}
    </div>
  );
}

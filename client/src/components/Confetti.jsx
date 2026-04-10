import React, { useEffect, useState } from 'react';

const COLORS = ['#b8860b', '#d4a017', '#FF13F0', '#e8a832', '#8b5e3c', '#c9a96e', '#f5d76e', '#ff6b6b', '#48dbfb', '#a29bfe'];

function randomBetween(a, b) {
  return Math.random() * (b - a) + a;
}

export default function Confetti({ active, duration = 4000 }) {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (!active) return;

    const count = 60;
    const newParticles = Array.from({ length: count }).map((_, i) => ({
      id: i,
      x: randomBetween(5, 95),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      delay: randomBetween(0, 0.6),
      duration: randomBetween(1.8, 3.2),
      size: randomBetween(6, 12),
      drift: randomBetween(-40, 40),
      rotation: randomBetween(0, 360),
      shape: Math.random() > 0.5 ? 'circle' : 'rect',
    }));
    setParticles(newParticles);

    const timer = setTimeout(() => setParticles([]), duration);
    return () => clearTimeout(timer);
  }, [active, duration]);

  if (particles.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 9999,
        overflow: 'hidden',
      }}
    >
      {particles.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: '-5%',
            width: p.shape === 'circle' ? p.size : p.size * 0.6,
            height: p.size,
            borderRadius: p.shape === 'circle' ? '50%' : '2px',
            background: p.color,
            opacity: 0.9,
            transform: `rotate(${p.rotation}deg)`,
            animation: `confettiFall ${p.duration}s ease-in ${p.delay}s forwards`,
            '--drift': `${p.drift}px`,
          }}
        />
      ))}
      <style>{`
        @keyframes confettiFall {
          0% {
            transform: translateY(0) translateX(0) rotate(0deg) scale(1);
            opacity: 1;
          }
          50% {
            opacity: 0.9;
          }
          100% {
            transform: translateY(110vh) translateX(var(--drift)) rotate(720deg) scale(0.5);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

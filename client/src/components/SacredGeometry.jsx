import React, { useEffect, useRef, useState } from 'react';

// Seed of Life — 7 overlapping circles
function SeedOfLife({ progress, size = 280 }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.18;
  const dist = r;

  const circles = [
    { cx, cy }, // center
    { cx: cx + dist, cy },
    { cx: cx + dist * 0.5, cy: cy - dist * 0.866 },
    { cx: cx - dist * 0.5, cy: cy - dist * 0.866 },
    { cx: cx - dist, cy },
    { cx: cx - dist * 0.5, cy: cy + dist * 0.866 },
    { cx: cx + dist * 0.5, cy: cy + dist * 0.866 },
  ];

  const circumference = 2 * Math.PI * r;

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      className="sacred-geometry glow"
      style={{ overflow: 'visible' }}
    >
      <defs>
        <filter id="glow-seed">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {circles.map((c, i) => {
        const circleProgress = Math.max(0, Math.min(1, (progress * 7 - i)));
        const dashOffset = circumference * (1 - circleProgress);
        return (
          <circle
            key={i}
            cx={c.cx}
            cy={c.cy}
            r={r}
            strokeWidth="1.5"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{
              fill: circleProgress > 0.5 ? `rgba(var(--geometry-fill-rgb, 184,134,11), ${circleProgress * 0.08})` : 'transparent',
              filter: 'url(#glow-seed)',
              transition: 'stroke-dashoffset 0.1s linear',
            }}
          />
        );
      })}
    </svg>
  );
}

// Flower of Life — 19 circles in hexagonal pattern
function FlowerOfLife({ progress, size = 280 }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.12;
  const d = r;

  const rings = [
    [{ cx, cy }],
    [
      { cx: cx + d, cy },
      { cx: cx + d * 0.5, cy: cy - d * 0.866 },
      { cx: cx - d * 0.5, cy: cy - d * 0.866 },
      { cx: cx - d, cy },
      { cx: cx - d * 0.5, cy: cy + d * 0.866 },
      { cx: cx + d * 0.5, cy: cy + d * 0.866 },
    ],
    [
      { cx: cx + 2 * d, cy },
      { cx: cx + 1.5 * d, cy: cy - d * 0.866 },
      { cx: cx + d, cy: cy - 2 * d * 0.866 },
      { cx: cx, cy: cy - 2 * d * 0.866 },
      { cx: cx - d, cy: cy - 2 * d * 0.866 },
      { cx: cx - 1.5 * d, cy: cy - d * 0.866 },
      { cx: cx - 2 * d, cy },
      { cx: cx - 1.5 * d, cy: cy + d * 0.866 },
      { cx: cx - d, cy: cy + 2 * d * 0.866 },
      { cx: cx, cy: cy + 2 * d * 0.866 },
      { cx: cx + d, cy: cy + 2 * d * 0.866 },
      { cx: cx + 1.5 * d, cy: cy + d * 0.866 },
    ],
  ];

  const allCircles = rings.flat();
  const circumference = 2 * Math.PI * r;
  const ringBreaks = [1, 7, 19];

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="sacred-geometry glow" style={{ overflow: 'visible' }}>
      <defs>
        <filter id="glow-flower">
          <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
          <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {allCircles.map((c, i) => {
        const circleProgress = Math.max(0, Math.min(1, (progress * allCircles.length - i)));
        const dashOffset = circumference * (1 - circleProgress);
        return (
          <circle
            key={i}
            cx={c.cx}
            cy={c.cy}
            r={r}
            strokeWidth="1"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{
              fill: circleProgress > 0.8 ? `rgba(212,146,42, ${circleProgress * 0.06})` : 'transparent',
              filter: 'url(#glow-flower)',
            }}
          />
        );
      })}
    </svg>
  );
}

// Lotus — 8-petal lotus from above
function Lotus({ progress, size = 280 }) {
  const cx = size / 2;
  const cy = size / 2;
  const innerR = size * 0.08;
  const petalLength = size * 0.32;
  const petalWidth = size * 0.1;

  const petals = Array.from({ length: 8 }, (_, i) => {
    const angle = (i * 45 * Math.PI) / 180;
    const petalProgress = Math.max(0, Math.min(1, (progress - 0.1) / 0.8 * 8 - i));
    return { angle, petalProgress };
  });

  const centerProgress = Math.min(1, progress / 0.1);
  const innerCircumference = 2 * Math.PI * innerR;

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="sacred-geometry glow" style={{ overflow: 'visible' }}>
      <defs>
        <filter id="glow-lotus">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {/* Petals */}
      {petals.map(({ angle, petalProgress }, i) => {
        if (petalProgress <= 0) return null;
        const tipX = cx + Math.sin(angle) * petalLength * petalProgress;
        const tipY = cy - Math.cos(angle) * petalLength * petalProgress;
        const leftAngle = angle - Math.PI / 2;
        const rightAngle = angle + Math.PI / 2;
        const ctrlDist = petalWidth * petalProgress;
        const ctrl1X = cx + Math.sin(leftAngle) * ctrlDist + Math.sin(angle) * petalLength * 0.5 * petalProgress;
        const ctrl1Y = cy - Math.cos(leftAngle) * ctrlDist - Math.cos(angle) * petalLength * 0.5 * petalProgress;
        const ctrl2X = cx + Math.sin(rightAngle) * ctrlDist + Math.sin(angle) * petalLength * 0.5 * petalProgress;
        const ctrl2Y = cy - Math.cos(rightAngle) * ctrlDist - Math.cos(angle) * petalLength * 0.5 * petalProgress;

        return (
          <path
            key={i}
            d={`M ${cx} ${cy} C ${ctrl1X} ${ctrl1Y}, ${tipX} ${tipY}, ${tipX} ${tipY} C ${tipX} ${tipY}, ${ctrl2X} ${ctrl2Y}, ${cx} ${cy} Z`}
            strokeWidth="1.5"
            style={{
              fill: `rgba(201,146,14,${petalProgress * 0.1})`,
              filter: 'url(#glow-lotus)',
              opacity: petalProgress,
            }}
          />
        );
      })}
      {/* Center circle */}
      <circle
        cx={cx}
        cy={cy}
        r={innerR}
        strokeWidth="1.5"
        strokeDasharray={innerCircumference}
        strokeDashoffset={innerCircumference * (1 - centerProgress)}
        style={{ filter: 'url(#glow-lotus)' }}
      />
      {/* Detail lines at 90% */}
      {progress > 0.9 && Array.from({ length: 8 }, (_, i) => {
        const angle = (i * 45 * Math.PI) / 180;
        const lineProgress = Math.min(1, (progress - 0.9) / 0.1);
        const x2 = cx + Math.sin(angle) * innerR * 2.5 * lineProgress;
        const y2 = cy - Math.cos(angle) * innerR * 2.5 * lineProgress;
        return (
          <line key={i} x1={cx} y1={cy} x2={x2} y2={y2} strokeWidth="0.75" style={{ opacity: lineProgress * 0.6 }} />
        );
      })}
    </svg>
  );
}

// Sri Yantra — simplified but accurate proportions
function SriYantra({ progress, size = 280 }) {
  const cx = size / 2;
  const cy = size / 2;
  const s = size * 0.42;

  // Outer square frame (20%)
  const frameProgress = Math.min(1, progress / 0.2);
  // Triangles from outside in (70%)
  const triangleProgress = Math.max(0, Math.min(1, (progress - 0.2) / 0.7));
  // Central bindu (10%)
  const binduProgress = Math.max(0, Math.min(1, (progress - 0.9) / 0.1));

  // 9 interlocking triangles (simplified as 4 upward + 5 downward)
  const upTriangles = [
    [[cx, cy - s * 0.9], [cx - s * 0.78, cy + s * 0.45], [cx + s * 0.78, cy + s * 0.45]],
    [[cx, cy - s * 0.6], [cx - s * 0.52, cy + s * 0.3], [cx + s * 0.52, cy + s * 0.3]],
    [[cx, cy - s * 0.35], [cx - s * 0.3, cy + s * 0.18], [cx + s * 0.3, cy + s * 0.18]],
    [[cx, cy - s * 0.15], [cx - s * 0.13, cy + s * 0.075], [cx + s * 0.13, cy + s * 0.075]],
  ];
  const downTriangles = [
    [[cx - s * 0.85, cy - s * 0.49], [cx + s * 0.85, cy - s * 0.49], [cx, cy + s * 0.98]],
    [[cx - s * 0.58, cy - s * 0.33], [cx + s * 0.58, cy - s * 0.33], [cx, cy + s * 0.66]],
    [[cx - s * 0.38, cy - s * 0.22], [cx + s * 0.38, cy - s * 0.22], [cx, cy + s * 0.44]],
    [[cx - s * 0.22, cy - s * 0.13], [cx + s * 0.22, cy - s * 0.13], [cx, cy + s * 0.26]],
    [[cx - s * 0.1, cy - s * 0.06], [cx + s * 0.1, cy - s * 0.06], [cx, cy + s * 0.12]],
  ];

  const allTriangles = [...downTriangles, ...upTriangles];
  const framePerim = s * 8;

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="sacred-geometry glow" style={{ overflow: 'visible' }}>
      <defs>
        <filter id="glow-sri">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {/* Outer frame */}
      <rect
        x={cx - s}
        y={cy - s}
        width={s * 2}
        height={s * 2}
        strokeWidth="2"
        strokeDasharray={framePerim}
        strokeDashoffset={framePerim * (1 - frameProgress)}
        style={{ filter: 'url(#glow-sri)' }}
      />
      {/* Triangles */}
      {allTriangles.map((pts, i) => {
        const triProgress = Math.max(0, Math.min(1, triangleProgress * allTriangles.length - i));
        if (triProgress <= 0) return null;
        const d = `M ${pts[0][0]} ${pts[0][1]} L ${pts[1][0]} ${pts[1][1]} L ${pts[2][0]} ${pts[2][1]} Z`;
        const perim = 300;
        return (
          <path
            key={i}
            d={d}
            strokeWidth="1.2"
            strokeDasharray={perim}
            strokeDashoffset={perim * (1 - triProgress)}
            style={{
              fill: `rgba(212,146,42,${triProgress * 0.04})`,
              filter: 'url(#glow-sri)',
            }}
          />
        );
      })}
      {/* Central bindu */}
      {binduProgress > 0 && (
        <circle
          cx={cx}
          cy={cy}
          r={size * 0.025 * binduProgress}
          strokeWidth="1.5"
          style={{
            fill: `rgba(212,146,42,${binduProgress * 0.8})`,
            filter: 'url(#glow-sri)',
          }}
        />
      )}
    </svg>
  );
}

// Main component
export default function SacredGeometry({ type = 'seed_of_life', progress = 0, size = 280, completing = false }) {
  const scale = completing ? 1 + 0.03 * Math.sin(Date.now() / 200) : 1;

  const components = {
    seed_of_life: SeedOfLife,
    flower_of_life: FlowerOfLife,
    lotus: Lotus,
    sri_yantra: SriYantra,
  };

  const Component = components[type] || SeedOfLife;

  return (
    <div
      style={{
        transform: `scale(${completing ? 1.03 : 1})`,
        transition: completing ? 'transform 0.3s ease-in-out' : 'transform 0.1s',
        filter: completing ? 'drop-shadow(0 0 20px var(--geometry-glow))' : 'none',
      }}
    >
      <Component progress={progress} size={size} />
    </div>
  );
}

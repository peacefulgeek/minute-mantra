import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const STEPS = [
  {
    title: 'Welcome to Minute Mantra',
    body: 'Each morning, you receive a new mantra from the world\'s great sacred traditions — Vedic, Buddhist, Sikh, and Universal.',
  },
  {
    title: 'One Minute of Chanting',
    body: 'Chant the mantra aloud for one minute while sacred geometry unfolds on your screen. The geometry completes as your practice does.',
  },
  {
    title: 'Streak & Growth',
    body: 'Your flame grows with every consecutive day of practice. Even one minute a day transforms your relationship with sound and silence.',
  },
  {
    title: 'Your Practice Begins',
    body: 'Tap "Begin" to see today\'s mantra. Audio pronunciation is available for Sanskrit mantras. Chant with confidence.',
  },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  function next() {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      navigate('/home');
    }
  }

  function prev() {
    if (step > 0) setStep(s => s - 1);
  }

  const handleTouchStart = useCallback((e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    // Only trigger if horizontal swipe is dominant and > 50px
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      if (dx < 0) next();   // swipe left → next
      else prev();          // swipe right → prev
    }
    touchStartX.current = null;
    touchStartY.current = null;
  }, [step]);

  const current = STEPS[step];

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center px-6"
      style={{ background: 'var(--bg-base, #fdf8f0)' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Large logo above dots */}
      <img
        src="/icon-192.png"
        alt="Minute Mantra"
        style={{
          width: '96px',
          height: '96px',
          borderRadius: '20px',
          marginBottom: '28px',
          boxShadow: '0 4px 24px rgba(184,134,11,0.15)',
        }}
      />

      {/* Progress dots */}
      <div className="flex gap-2 mb-10">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className="rounded-full cursor-pointer"
            onClick={() => setStep(i)}
            style={{
              width: i === step ? '24px' : '6px',
              height: '6px',
              background: i <= step ? '#b8860b' : 'rgba(184,134,11,0.25)',
              transition: 'width 0.3s, background 0.3s',
            }}
          />
        ))}
      </div>

      {/* Text - centered with slide animation */}
      <div
        className="text-center max-w-md mb-10"
        key={step}
        style={{
          animation: 'fadeSlideIn 0.35s ease-out',
        }}
      >
        <h2
          className="mb-4"
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: '28px',
            fontWeight: 400,
            color: '#3d2b1f',
            lineHeight: 1.3,
          }}
        >
          {current.title}
        </h2>
        <p
          style={{
            fontFamily: "'DM Sans', system-ui, sans-serif",
            fontSize: '16px',
            lineHeight: 1.7,
            color: '#7a5c3e',
          }}
        >
          {current.body}
        </p>
      </div>

      {/* Button */}
      <button
        onClick={next}
        className="w-full max-w-xs py-4 rounded-full"
        style={{
          background: 'linear-gradient(135deg, #b8860b, #d4a017)',
          color: '#ffffff',
          fontFamily: "'DM Sans', system-ui, sans-serif",
          fontSize: '15px',
          fontWeight: 600,
          letterSpacing: '0.1em',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(184,134,11,0.3)',
        }}
      >
        {step < STEPS.length - 1 ? 'CONTINUE' : 'BEGIN MY PRACTICE'}
      </button>

      {/* Swipe hint on first screen */}
      {step === 0 && (
        <p
          style={{
            marginTop: '20px',
            fontFamily: "'DM Sans', system-ui, sans-serif",
            fontSize: '12px',
            color: 'rgba(154,140,126,0.6)',
            letterSpacing: '0.05em',
          }}
        >
          swipe or tap to continue
        </p>
      )}

      {/* Inline keyframes for fade-slide animation */}
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

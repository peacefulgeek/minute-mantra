import React, { useState } from 'react';
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

  function next() {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      navigate('/home');
    }
  }

  const current = STEPS[step];

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center px-6"
      style={{ background: 'var(--bg-base, #fdf8f0)' }}
    >
      {/* Progress dots */}
      <div className="flex gap-2 mb-10">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className="rounded-full"
            style={{
              width: i === step ? '24px' : '6px',
              height: '6px',
              background: i <= step ? '#b8860b' : 'rgba(184,134,11,0.25)',
              transition: 'width 0.3s, background 0.3s',
            }}
          />
        ))}
      </div>

      {/* Text - centered */}
      <div className="text-center max-w-md mb-10">
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
    </div>
  );
}

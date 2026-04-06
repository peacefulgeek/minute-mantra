import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';


const STEPS = [
  {
    title: 'Welcome to Minute Mantra',
    body: 'Each morning, you receive a new mantra from the world\'s great sacred traditions — Vedic, Buddhist, Sikh, and Universal.',
    symbol: 'ॐ',
  },
  {
    title: 'One Minute of Chanting',
    body: 'Chant the mantra aloud for one minute while sacred geometry unfolds on your screen. The geometry completes as your practice does.',
    symbol: '🙏',
  },
  {
    title: 'Streak & Growth',
    body: 'Your flame grows with every consecutive day of practice. Even one minute a day transforms your relationship with sound and silence.',
    symbol: '🔥',
  },
  {
    title: 'Your Practice Begins',
    body: 'Tap "Begin" to see today\'s mantra. Audio pronunciation is available for Sanskrit mantras. Chant with confidence.',
    symbol: '✦',
  },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);


  function next() {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      navigate('/');
    }
  }

  const current = STEPS[step];

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-12 pt-safe"
      style={{ background: 'var(--bg-base)' }}
    >
      {/* Progress dots */}
      <div className="flex gap-2 mb-12">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === step ? '24px' : '6px',
              height: '6px',
              background: i <= step ? 'var(--text-accent)' : 'var(--border-color)',
            }}
          />
        ))}
      </div>

      {/* Symbol */}
      <div
        className="mb-8"
        style={{
          fontSize: '48px',
          lineHeight: 1,
          color: 'var(--text-accent)',
        }}
      >
        {current.symbol}
      </div>

      {/* Text - centered */}
      <div className="text-center max-w-sm mb-12">
        <h2 className="font-serif text-2xl mb-4" style={{ color: 'var(--text-accent)' }}>
          {current.title}
        </h2>
        <p className="font-sans text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {current.body}
        </p>
      </div>

      {/* Button */}
      <button
        onClick={next}
        className="w-full max-w-xs py-4 rounded-xl font-serif text-lg tracking-wide"
        style={{ background: 'var(--text-accent)', color: '#ffffff' }}
      >
        {step < STEPS.length - 1 ? 'Continue' : 'Begin My Practice'}
      </button>
    </div>
  );
}

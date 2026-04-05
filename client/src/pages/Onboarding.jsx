import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SacredGeometry from '../components/SacredGeometry';

const STEPS = [
  {
    title: 'Welcome to Minute Mantra',
    body: 'Each morning, you receive a new mantra from the world\'s great sacred traditions — Vedic, Buddhist, Sikh, and Universal.',
    geometry: 'seed_of_life',
  },
  {
    title: 'One Minute of Chanting',
    body: 'Chant the mantra aloud for one minute while sacred geometry unfolds on your screen. The geometry completes as your practice does.',
    geometry: 'lotus',
  },
  {
    title: 'Streak & Growth',
    body: 'Your flame grows with every consecutive day of practice. Even one minute a day transforms your relationship with sound and silence.',
    geometry: 'flower_of_life',
  },
  {
    title: 'Your Practice Begins',
    body: 'Tap "Begin" to see today\'s mantra. Audio pronunciation is available for every mantra. Chant with confidence.',
    geometry: 'sri_yantra',
  },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => Math.min(1, p + 0.005));
    }, 30);
    return () => clearInterval(interval);
  }, [step]);

  function next() {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
      setProgress(0);
    } else {
      navigate('/');
    }
  }

  const current = STEPS[step];

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-between px-6 py-12 pt-safe"
      style={{ background: 'var(--bg-base)' }}
    >
      {/* Progress dots */}
      <div className="flex gap-2">
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

      {/* Geometry */}
      <div className="flex-1 flex items-center justify-center">
        <SacredGeometry type={current.geometry} progress={progress} size={240} />
      </div>

      {/* Text */}
      <div className="text-center mb-8">
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
        style={{ background: 'var(--text-accent)', color: 'var(--bg-base)' }}
      >
        {step < STEPS.length - 1 ? 'Continue' : 'Begin My Practice'}
      </button>
    </div>
  );
}

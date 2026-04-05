import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from '@phosphor-icons/react';

const CDN = 'https://minute-mantra.b-cdn.net';

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pt-safe px-4 py-6" style={{ background: 'var(--bg-base)' }}>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} style={{ color: 'var(--text-secondary)' }}>
          <ArrowLeft size={22} />
        </button>
        <h1 className="font-serif text-xl" style={{ color: 'var(--text-primary)' }}>About</h1>
      </div>

      <div className="max-w-md mx-auto">
        {/* Paul photo */}
        <div className="flex justify-center mb-6">
          <img
            src={`${CDN}/images/paul-wagner.webp`}
            alt="Paul Wagner"
            className="w-28 h-28 rounded-full object-cover"
            style={{ border: '2px solid var(--border-color)' }}
          />
        </div>

        <h2 className="font-serif text-xl text-center mb-2" style={{ color: 'var(--text-accent)' }}>
          Paul Wagner
        </h2>
        <p className="font-sans text-sm text-center mb-6" style={{ color: 'var(--text-secondary)' }}>
          Spiritual teacher, author, and mantra practitioner
        </p>

        <div className="font-sans text-sm leading-relaxed space-y-4" style={{ color: 'var(--text-secondary)' }}>
          <p>
            Minute Mantra was created to make the ancient practice of mantra accessible to anyone — regardless of tradition, background, or how much time they have.
          </p>
          <p>
            Each mantra in this app has been carefully selected from the Vedic, Buddhist, Sikh, and Universal traditions. Every entry includes the original script, phonetic guide, English translation, and context to help you understand what you're chanting.
          </p>
          <p>
            Paul Wagner has studied with teachers across India, Nepal, and Southeast Asia. He is the author of several books on consciousness, spiritual practice, and self-realization.
          </p>
        </div>

        <div className="mt-8 space-y-3">
          <a
            href="https://paulwagner.com"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center py-3 rounded-xl font-serif text-base"
            style={{ background: 'var(--bg-card)', color: 'var(--text-accent)', border: '1px solid var(--border-color)' }}
          >
            Visit PaulWagner.com →
          </a>
          <a
            href="https://theshankara.com"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center py-3 rounded-xl font-sans text-sm"
            style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
          >
            The Shankara Oracle — Divination &amp; Guidance
          </a>
          <a
            href="https://blendedsoul.com"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center py-3 rounded-xl font-sans text-sm"
            style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
          >
            Blended Soul — Spiritual Community
          </a>
        </div>

        <div className="mt-8 pt-6" style={{ borderTop: '1px solid var(--border-color)' }}>
          <div className="flex justify-center gap-6">
            <a href="/privacy" className="font-sans text-xs" style={{ color: 'var(--text-secondary)' }}>Privacy Policy</a>
            <a href="/terms" className="font-sans text-xs" style={{ color: 'var(--text-secondary)' }}>Terms of Service</a>
          </div>
          <p className="text-center font-sans text-xs mt-3" style={{ color: 'var(--text-secondary)', opacity: 0.5 }}>
            &copy; {new Date().getFullYear()} Creative Lab Agency LLC
          </p>
        </div>
      </div>
    </div>
  );
}

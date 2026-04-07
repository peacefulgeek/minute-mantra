import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Design: Warm Sacred Luminous ────────────────────────────────────────────
// Palette: cream #fdf8f0, ivory #faf3e6, amber gold #C9943A, warm brown #2d1f0a
// Typography: Cormorant Garamond (display) + DM Sans (body)
// Login route: /enter (magic link)

const CDN = 'https://minute-mantra.b-cdn.net';

const MANTRAS_SAMPLE = [
  { script: 'ॐ नमः शिवाय', phonetic: 'Om Namah Shivaya', meaning: 'I bow to Shiva — the auspicious one, the pure consciousness within all', tradition: 'VEDIC / SHAIVITE', tag: 'Purification' },
  { script: 'ॐ मणि पद्मे हूँ', phonetic: 'Om Mani Padme Hum', meaning: 'Hail to the jewel in the lotus — the path of compassion and wisdom', tradition: 'BUDDHIST', tag: 'Compassion' },
  { script: 'ਵਾਹਿਗੁਰੂ', phonetic: 'Waheguru', meaning: 'Wondrous teacher — the divine light that illuminates all darkness', tradition: 'SIKH / GURBANI', tag: 'Devotion' },
  { script: 'I am light. I am peace.', phonetic: 'I am light. I am peace.', meaning: 'A universal affirmation of your deepest nature — spoken into being', tradition: 'UNIVERSAL', tag: 'Affirmation' },
  { script: 'ॐ गं गणपतये नमः', phonetic: 'Om Gam Ganapataye Namaha', meaning: 'Salutations to Ganesha — remover of obstacles, lord of new beginnings', tradition: 'VEDIC / GANESHA', tag: 'New Beginnings' },
];

const GEOMETRY_TYPES = [
  { name: 'Seed of Life', desc: 'Seven circles of creation — the blueprint of existence', tradition: 'VEDIC / SHAIVITE' },
  { name: 'Flower of Life', desc: '19 circles in sacred hexagonal harmony — the pattern of all life', tradition: 'BUDDHIST' },
  { name: 'Lotus', desc: 'Eight petals blooming from stillness — purity rising from the depths', tradition: 'VEDIC / SHAKTA' },
  { name: 'Sri Yantra', desc: 'Nine interlocking triangles — the geometry of the cosmos itself', tradition: 'VEDIC / TANTRIC' },
];

const TRADITIONS = [
  { name: 'Vedic / Hindu', script: 'ॐ नमः शिवाय', count: '180+', desc: 'Ancient Sanskrit mantras from the Rigveda, Upanishads, and devotional lineages of Shiva, Vishnu, Shakti, Ganesha, and the Solar tradition.' },
  { name: 'Buddhist', script: 'ॐ मणि पद्मे हूँ', count: '80+', desc: 'Pali and Tibetan mantras from Theravada, Mahayana, and Vajrayana lineages — cultivating compassion, wisdom, and liberation.' },
  { name: 'Sikh / Gurbani', script: 'ਵਾਹਿਗੁਰੂ', count: '50+', desc: 'Sacred verses from the Guru Granth Sahib and Sikh devotional practice — honoring the one formless divine light.' },
  { name: 'Universal', script: 'I am light. I am peace.', count: '35+', desc: 'Non-denominational affirmation-mantras in English for all seekers — regardless of tradition, background, or belief.' },
];

const FEATURES = [
  { icon: '✦', title: 'One mantra, every morning', desc: 'A new sacred sound awaits you each day — drawn from 365 mantras across eight distinct lineages. Each mantra arrives with its original script, phonetic guide, English translation, and historical context.' },
  { icon: '◎', title: 'Sacred geometry timer', desc: 'Tap Begin Chanting and watch a sacred geometry pattern — Seed of Life, Flower of Life, Lotus, or Sri Yantra — slowly bloom over sixty seconds. The animation IS the timer. No numbers. No pressure. Just presence.' },
  { icon: '♪', title: 'Studio-quality pronunciation', desc: 'Every mantra includes a professionally recorded audio pronunciation so you chant with confidence and accuracy, not guesswork. Hear the sacred sounds as they were meant to be heard.' },
  { icon: '🔥', title: 'Streak tracking', desc: 'A living flame grows with your consistency. Miss a day and it dims. The calendar heatmap shows your entire journey — every morning you showed up for yourself.' },
  { icon: '📿', title: 'Mala counter', desc: '108 beads rendered around the sacred geometry. Tap each bead as you chant. Ancient japa practice, modern interface. Available in Platinum.' },
  { icon: '🌅', title: 'Morning reminders', desc: 'Email and push notifications at your chosen time. Your mantra arrives before the world does — before the inbox, before the news, before the noise.' },
  { icon: '⏱', title: 'Extended timers', desc: 'Deepen your practice with 2, 5, or 10-minute sessions. The sacred geometry scales with your intention. Available in Platinum.' },
  { icon: '♾', title: 'Full mantra library', desc: 'Browse and search all 365 mantras by tradition, intention, or keyword. Save your favorites. Return to the ones that move you. Available in Platinum.' },
  { icon: '🔔', title: 'Singing bowl ambient', desc: 'A singing bowl strikes at the start and end of each session. Optional ambient bowl sound fills the space between. Available in Platinum.' },
];

const TESTIMONIALS = [
  { quote: "I've tried every meditation app. This is the only one I've kept. One minute. Every morning. It changed something in me I can't fully explain.", name: 'Sarah K.', role: 'Yoga teacher, Portland', streak: '112 day streak' },
  { quote: "The sacred geometry timer is unlike anything I've seen. I find myself just watching it bloom. That IS the practice. I didn't expect that.", name: 'Michael R.', role: 'Software engineer, Austin', streak: '67 day streak' },
  { quote: "I didn't think I could maintain a daily practice. 47 days in and counting. The streak flame keeps me honest in the best possible way.", name: 'Priya M.', role: 'Therapist, Chicago', streak: '47 day streak' },
  { quote: "As someone who grew up with Gurbani, seeing Waheguru rendered with this kind of reverence — with context, with audio — it moved me deeply.", name: 'Harpreet S.', role: 'Teacher, Vancouver', streak: '89 day streak' },
  { quote: "The mala counter is genius. I've been doing japa for years. Having it built into the geometry timer is something I didn't know I needed.", name: 'Ananda T.', role: 'Meditation teacher, Sedona', streak: '203 day streak' },
  { quote: "I open it before I open anything else. That single habit has changed my mornings completely. One minute is all it takes to set the tone.", name: 'Claire B.', role: 'Writer, London', streak: '31 day streak' },
];

const FREE_FEATURES = [
  '5 days of daily mantras',
  '60-second sacred geometry timer',
  'Audio pronunciation for every mantra',
  'Morning email reminders',
  'Streak tracking & calendar',
  'Up to 5 saved favorites',
  '"Go Deeper" links to PaulWagner.com',
];

const MONTHLY_FEATURES = [
  'Unlimited daily mantras — all 365',
  '60-second sacred geometry timer',
  'Audio pronunciation for every mantra',
  'Morning email + push reminders',
  'Streak tracking & calendar heatmap',
  'Extended timers (2, 5, 10 minutes)',
  'Mala counter — 108 beads',
  'Unlimited favorites',
  'Full mantra library — browse & search',
  'Singing bowl ambient sound',
];

const ANNUAL_FEATURES = [
  'Everything in Monthly',
  'Unlimited daily mantras — all 365',
  '60-second sacred geometry timer',
  'Audio pronunciation for every mantra',
  'Morning email + push reminders',
  'Streak tracking & calendar heatmap',
  'Extended timers (2, 5, 10 minutes)',
  'Mala counter — 108 beads',
  'Unlimited favorites',
  'Full mantra library — browse & search',
  'Singing bowl ambient sound',
];

const FAQS = [
  {
    q: 'What exactly is a mantra?',
    a: 'A mantra is a sacred sound, syllable, word, or phrase that carries vibrational energy. Mantras have been used for thousands of years across Hindu, Buddhist, Sikh, and other traditions as tools for meditation, prayer, and transformation. You don\'t need to understand the language to benefit — the sound itself carries the intention.',
  },
  {
    q: 'Do I need to be religious or spiritual to use Minute Mantra?',
    a: 'Not at all. Many practitioners use mantras purely as a mindfulness or focus tool, without any religious framework. We include Universal mantras in English for exactly this reason. You choose what resonates. The practice works regardless of your beliefs.',
  },
  {
    q: 'How does the 5-day free trial work?',
    a: 'You get full access to the complete practice for 5 days — no credit card required. After 5 days, you can choose a Monthly ($0.99/mo) or Annual ($9.99/yr) plan to continue. If you don\'t subscribe, your account remains but you won\'t receive new daily mantras.',
  },
  {
    q: 'Is this an app I download from the App Store?',
    a: 'Minute Mantra is a Progressive Web App (PWA) — it installs directly from your browser with no app store required. On iPhone, tap the Share button in Safari and choose "Add to Home Screen." On Android, tap the browser menu and choose "Install App." It works exactly like a native app.',
  },
  {
    q: 'How do I log in? There\'s no password?',
    a: 'We use magic link authentication — you enter your email, we send you a secure login link, and you\'re in. No password to forget, no account to hack. Each link works once and expires after 15 minutes for security.',
  },
  {
    q: 'Can I practice for longer than one minute?',
    a: 'Yes — Platinum subscribers have access to extended timers: 2, 5, and 10-minute sessions. The sacred geometry animation scales beautifully to longer durations. The one-minute default is intentional — it removes every excuse not to practice.',
  },
  {
    q: 'What traditions are the mantras drawn from?',
    a: 'We draw from eight distinct lineages: Vedic Shaivite, Vedic Vaishnava, Vedic Shakta, Vedic Ganesha, Vedic Solar, Buddhist (Theravada/Mahayana/Vajrayana), Sikh/Gurbani, and Universal. Every mantra includes its original script, phonetic pronunciation, English translation, and historical context.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Cancel anytime from your account settings. Your access continues until the end of your billing period. We don\'t offer partial refunds, but we do make cancellation completely frictionless — no hoops, no retention flows.',
  },
];

// ─── Sacred Geometry SVG Components ──────────────────────────────────────────

function SeedOfLife({ size = 80, color = '#C9943A' }) {
  const r = size * 0.28;
  const cx = size / 2, cy = size / 2;
  const circles = [
    [cx, cy],
    [cx, cy - r],
    [cx + r * Math.sin(Math.PI / 3), cy - r * Math.cos(Math.PI / 3)],
    [cx + r * Math.sin(Math.PI / 3), cy + r * Math.cos(Math.PI / 3)],
    [cx, cy + r],
    [cx - r * Math.sin(Math.PI / 3), cy + r * Math.cos(Math.PI / 3)],
    [cx - r * Math.sin(Math.PI / 3), cy - r * Math.cos(Math.PI / 3)],
  ];
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {circles.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill="none" stroke={color} strokeWidth="1.2" opacity="0.85" />
      ))}
    </svg>
  );
}

function FlowerOfLife({ size = 80, color = '#C9943A' }) {
  const r = size * 0.18;
  const cx = size / 2, cy = size / 2;
  const centers = [[cx, cy]];
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3;
    centers.push([cx + r * 2 * Math.cos(angle), cy + r * 2 * Math.sin(angle)]);
  }
  for (let i = 0; i < 6; i++) {
    const a1 = (i * Math.PI) / 3, a2 = ((i + 1) * Math.PI) / 3;
    centers.push([cx + r * 2 * Math.cos(a1) + r * 2 * Math.cos(a2), cy + r * 2 * Math.sin(a1) + r * 2 * Math.sin(a2)]);
  }
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <clipPath id="fol-clip">
          <circle cx={cx} cy={cy} r={size * 0.46} />
        </clipPath>
      </defs>
      <g clipPath="url(#fol-clip)">
        {centers.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={r * 2} fill="none" stroke={color} strokeWidth="1" opacity="0.8" />
        ))}
      </g>
    </svg>
  );
}

function LotusGeometry({ size = 80, color = '#C9943A' }) {
  const cx = size / 2, cy = size / 2;
  const petals = 8;
  const pr = size * 0.32;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {Array.from({ length: petals }).map((_, i) => {
        const angle = (i * Math.PI * 2) / petals - Math.PI / 2;
        const px = cx + (pr * 0.55) * Math.cos(angle);
        const py = cy + (pr * 0.55) * Math.sin(angle);
        return (
          <ellipse key={i} cx={px} cy={py} rx={pr * 0.28} ry={pr * 0.52}
            transform={`rotate(${(i * 360) / petals}, ${px}, ${py})`}
            fill="none" stroke={color} strokeWidth="1.2" opacity="0.85" />
        );
      })}
      <circle cx={cx} cy={cy} r={size * 0.1} fill="none" stroke={color} strokeWidth="1.2" opacity="0.85" />
    </svg>
  );
}

function SriYantra({ size = 80, color = '#C9943A' }) {
  const cx = size / 2, cy = size / 2;
  const s = size * 0.42;
  const triangles = [
    [[cx, cy - s], [cx - s * 0.87, cy + s * 0.5], [cx + s * 0.87, cy + s * 0.5]],
    [[cx, cy + s * 0.7], [cx - s * 0.75, cy - s * 0.35], [cx + s * 0.75, cy - s * 0.35]],
    [[cx, cy - s * 0.65], [cx - s * 0.65, cy + s * 0.35], [cx + s * 0.65, cy + s * 0.35]],
    [[cx, cy + s * 0.5], [cx - s * 0.55, cy - s * 0.25], [cx + s * 0.55, cy - s * 0.25]],
  ];
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {triangles.map((pts, i) => (
        <polygon key={i} points={pts.map(p => p.join(',')).join(' ')}
          fill="none" stroke={color} strokeWidth="1.2" opacity={0.9 - i * 0.1} />
      ))}
      <circle cx={cx} cy={cy} r={size * 0.08} fill={color} opacity="0.6" />
    </svg>
  );
}

// ─── Phone Mockup ─────────────────────────────────────────────────────────────

function PhoneMockup() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setCurrent(c => (c + 1) % MANTRAS_SAMPLE.length), 3500);
    return () => clearInterval(t);
  }, []);

  const m = MANTRAS_SAMPLE[current];
  const isDevanagari = /[\u0900-\u097F]/.test(m.script);
  const isGurmukhi = /[\u0A00-\u0A7F]/.test(m.script);

  return (
    <div style={{
      width: 280, height: 520,
      background: 'linear-gradient(160deg, #fffdf8 0%, #fdf5e8 100%)',
      borderRadius: 36,
      boxShadow: '0 32px 80px rgba(120,80,20,0.18), 0 8px 24px rgba(120,80,20,0.1), inset 0 1px 0 rgba(255,255,255,0.9)',
      border: '1px solid rgba(201,148,58,0.25)',
      overflow: 'hidden',
      position: 'relative',
      flexShrink: 0,
    }}>
      {/* Status bar */}
      <div style={{ padding: '14px 20px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: '#8a6a3a', fontFamily: 'DM Sans, sans-serif', fontWeight: 500 }}>9:41</span>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {[3, 4, 5].map(h => <div key={h} style={{ width: 3, height: h, background: '#C9943A', borderRadius: 1, opacity: 0.7 }} />)}
          <div style={{ width: 14, height: 7, border: '1.5px solid #C9943A', borderRadius: 2, marginLeft: 3, opacity: 0.7, position: 'relative' }}>
            <div style={{ position: 'absolute', left: 1, top: 1, right: 2, bottom: 1, background: '#C9943A', borderRadius: 1 }} />
          </div>
        </div>
      </div>

      {/* App header */}
      <div style={{ padding: '4px 20px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(201,148,58,0.12)' }}>
        <span style={{ fontSize: 11, letterSpacing: '0.12em', color: '#C9943A', fontFamily: 'DM Sans, sans-serif', fontWeight: 600 }}>ॐ MINUTE MANTRA</span>
        <span style={{ fontSize: 13 }}>🔥 <span style={{ fontSize: 11, color: '#C9943A', fontWeight: 600 }}>47</span></span>
      </div>

      {/* Date */}
      <div style={{ padding: '14px 20px 4px' }}>
        <div style={{ fontSize: 10, color: '#b89060', fontFamily: 'DM Sans, sans-serif', letterSpacing: '0.06em', marginBottom: 2 }}>Monday, April 7</div>
        <div style={{ fontSize: 12, color: '#5a3e20', fontFamily: 'DM Sans, sans-serif', fontWeight: 500 }}>Today's Mantra</div>
      </div>

      {/* Tradition badge */}
      <div style={{ padding: '8px 20px' }}>
        <AnimatePresence mode="wait">
          <motion.div key={current + '-badge'}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 9, letterSpacing: '0.1em', color: '#C9943A', border: '1px solid rgba(201,148,58,0.4)', borderRadius: 4, padding: '2px 7px', fontFamily: 'DM Sans, sans-serif', fontWeight: 600 }}>
              {m.tradition}
            </span>
            <span style={{ fontSize: 9, letterSpacing: '0.08em', color: '#8a6a3a', background: 'rgba(201,148,58,0.1)', borderRadius: 4, padding: '2px 7px', fontFamily: 'DM Sans, sans-serif' }}>
              {m.tag}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Mantra script */}
      <div style={{ padding: '8px 20px', textAlign: 'center', minHeight: 72, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <AnimatePresence mode="wait">
          <motion.div key={current + '-script'}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4 }}>
            <div style={{
              fontSize: isDevanagari || isGurmukhi ? 22 : 16,
              color: '#2d1f0a',
              fontFamily: isDevanagari ? 'Noto Sans Devanagari, serif' : isGurmukhi ? 'Noto Sans Gurmukhi, serif' : 'Cormorant Garamond, serif',
              fontWeight: 400,
              lineHeight: 1.4,
              marginBottom: 4,
            }}>
              {m.script}
            </div>
            <div style={{ fontSize: 11, color: '#9a7a4a', fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic' }}>
              {m.phonetic}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Geometry */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
        <SeedOfLife size={56} color="#C9943A" />
      </div>

      {/* Meaning */}
      <div style={{ padding: '8px 20px', minHeight: 52 }}>
        <AnimatePresence mode="wait">
          <motion.p key={current + '-meaning'}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ fontSize: 10.5, color: '#7a5a30', fontFamily: 'Cormorant Garamond, serif', lineHeight: 1.5, textAlign: 'center' }}>
            {m.meaning}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Buttons */}
      <div style={{ padding: '8px 16px 0' }}>
        <button style={{
          width: '100%', padding: '7px 0',
          background: 'rgba(201,148,58,0.1)',
          border: '1px solid rgba(201,148,58,0.3)',
          borderRadius: 8, fontSize: 10,
          color: '#C9943A', fontFamily: 'DM Sans, sans-serif',
          fontWeight: 500, letterSpacing: '0.06em',
          marginBottom: 8, cursor: 'default',
        }}>
          ♪ Hear pronunciation
        </button>
        <button style={{
          width: '100%', padding: '10px 0',
          background: 'linear-gradient(135deg, #C9943A 0%, #a8762a 100%)',
          border: 'none', borderRadius: 10,
          fontSize: 11, color: '#ffffff',
          fontFamily: 'DM Sans, sans-serif',
          fontWeight: 600, letterSpacing: '0.1em',
          cursor: 'default',
          boxShadow: '0 4px 16px rgba(201,148,58,0.35)',
        }}>
          BEGIN CHANTING
        </button>
      </div>
    </div>
  );
}

// ─── Scroll Reveal Hook ───────────────────────────────────────────────────────

function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.12 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

// ─── FAQ Item ─────────────────────────────────────────────────────────────────

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      borderBottom: '1px solid rgba(201,148,58,0.18)',
      overflow: 'hidden',
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '20px 0', background: 'none', border: 'none', cursor: 'pointer',
          textAlign: 'left', gap: 16,
        }}
      >
        <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, color: '#2d1f0a', fontWeight: 500, lineHeight: 1.3 }}>
          {q}
        </span>
        <span style={{
          flexShrink: 0, width: 28, height: 28,
          border: '1.5px solid rgba(201,148,58,0.5)',
          borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#C9943A', fontSize: 16, fontWeight: 300,
          transition: 'transform 0.3s ease',
          transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
        }}>
          +
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <p style={{
              fontFamily: 'DM Sans, sans-serif', fontSize: 15, color: '#6b4e2a',
              lineHeight: 1.75, paddingBottom: 20,
            }}>
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Landing Page ────────────────────────────────────────────────────────

export default function Landing() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const [heroRef, heroVisible] = useReveal();
  const [practiceRef, practiceVisible] = useReveal();
  const [geoRef, geoVisible] = useReveal();
  const [tradRef, tradVisible] = useReveal();
  const [featRef, featVisible] = useReveal();
  const [pricingRef, pricingVisible] = useReveal();
  const [faqRef, faqVisible] = useReveal();
  const [testimonialRef, testimonialVisible] = useReveal();
  const [creatorRef, creatorVisible] = useReveal();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id) => {
    setMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const gold = '#C9943A';
  const cream = '#fdf8f0';
  const ivory = '#faf3e6';
  const warmBrown = '#2d1f0a';
  const midBrown = '#6b4e2a';
  const lightBrown = '#9a7a4a';

  const navLinks = [
    { label: 'Practice', id: 'practice' },
    { label: 'Traditions', id: 'traditions' },
    { label: 'Features', id: 'features' },
    { label: 'Pricing', id: 'pricing' },
    { label: 'FAQ', id: 'faq' },
  ];

  return (
    <div style={{ background: cream, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', color: warmBrown, overflowX: 'hidden' }}>

      {/* ── NAV ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? 'rgba(253,248,240,0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(201,148,58,0.15)' : '1px solid transparent',
        transition: 'all 0.4s ease',
        padding: '0 24px',
        height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Logo */}
        <a href="#" onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <span style={{ fontSize: 22, lineHeight: 1 }}>ॐ</span>
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 600, letterSpacing: '0.14em', color: warmBrown, textTransform: 'uppercase' }}>
            Minute Mantra
          </span>
        </a>

        {/* Desktop nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }} className="hidden-mobile">
          {navLinks.map(l => (
            <button key={l.id} onClick={() => scrollTo(l.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: midBrown, fontFamily: 'DM Sans, sans-serif', fontWeight: 400, letterSpacing: '0.04em', padding: 0 }}>
              {l.label}
            </button>
          ))}
        </div>

        {/* ENTER button + hamburger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link to="/enter" style={{
            background: gold, color: '#ffffff',
            padding: '9px 22px', borderRadius: 6,
            fontFamily: 'DM Sans, sans-serif', fontSize: 12,
            fontWeight: 600, letterSpacing: '0.14em',
            textDecoration: 'none', textTransform: 'uppercase',
            boxShadow: '0 2px 12px rgba(201,148,58,0.35)',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
          }}>
            Enter
          </Link>

          {/* Hamburger — mobile only */}
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="show-mobile"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: 4, display: 'flex', flexDirection: 'column', gap: 5,
            }}
            aria-label="Menu"
          >
            <span style={{ display: 'block', width: 22, height: 1.5, background: warmBrown, borderRadius: 2, transition: 'all 0.3s', transform: menuOpen ? 'rotate(45deg) translate(4px, 4px)' : 'none' }} />
            <span style={{ display: 'block', width: 22, height: 1.5, background: warmBrown, borderRadius: 2, transition: 'all 0.3s', opacity: menuOpen ? 0 : 1 }} />
            <span style={{ display: 'block', width: 22, height: 1.5, background: warmBrown, borderRadius: 2, transition: 'all 0.3s', transform: menuOpen ? 'rotate(-45deg) translate(4px, -4px)' : 'none' }} />
          </button>
        </div>
      </nav>

      {/* Mobile menu drawer */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25 }}
            style={{
              position: 'fixed', top: 64, left: 0, right: 0, zIndex: 99,
              background: 'rgba(253,248,240,0.98)',
              backdropFilter: 'blur(16px)',
              borderBottom: '1px solid rgba(201,148,58,0.2)',
              padding: '16px 24px 24px',
            }}
          >
            {navLinks.map(l => (
              <button key={l.id} onClick={() => scrollTo(l.id)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '14px 0',
                  fontSize: 18, fontFamily: 'Cormorant Garamond, serif',
                  color: warmBrown, fontWeight: 400,
                  borderBottom: '1px solid rgba(201,148,58,0.12)',
                }}>
                {l.label}
              </button>
            ))}
            <Link to="/enter" onClick={() => setMenuOpen(false)}
              style={{
                display: 'block', marginTop: 20,
                background: gold, color: '#ffffff',
                padding: '14px 0', borderRadius: 8,
                textAlign: 'center', textDecoration: 'none',
                fontFamily: 'DM Sans, sans-serif', fontSize: 13,
                fontWeight: 600, letterSpacing: '0.14em',
              }}>
              ENTER THE APP
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HERO ── */}
      <section style={{
        minHeight: '100vh', position: 'relative',
        display: 'flex', alignItems: 'center',
        background: `linear-gradient(160deg, #fdf8f0 0%, #faf0dc 50%, #f5e8cc 100%)`,
        overflow: 'hidden',
        paddingTop: 64,
      }}>
        {/* Subtle background pattern */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.04, pointerEvents: 'none' }}>
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="hero-grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <circle cx="30" cy="30" r="28" fill="none" stroke="#C9943A" strokeWidth="0.5" />
                <circle cx="30" cy="30" r="14" fill="none" stroke="#C9943A" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hero-grid)" />
          </svg>
        </div>

        {/* Large background OM */}
        <div style={{
          position: 'absolute', right: '-5%', top: '50%', transform: 'translateY(-50%)',
          fontSize: 'clamp(300px, 40vw, 600px)',
          color: 'rgba(201,148,58,0.05)', fontFamily: 'serif',
          lineHeight: 1, pointerEvents: 'none', userSelect: 'none',
        }}>ॐ</div>

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 32px', width: '100%', display: 'flex', alignItems: 'center', gap: 60, position: 'relative', zIndex: 1 }}>
          {/* Left: copy */}
          <motion.div
            ref={heroRef}
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            style={{ flex: '1 1 480px', minWidth: 0 }}
          >
            <div style={{ fontSize: 11, letterSpacing: '0.22em', color: gold, fontWeight: 600, marginBottom: 24, fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase' }}>
              One Mantra · One Minute · Every Morning
            </div>
            <h1 style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: 'clamp(44px, 6vw, 80px)',
              fontWeight: 400, lineHeight: 1.08,
              color: warmBrown, marginBottom: 12,
            }}>
              Sacred sound<br />
              <em style={{ color: gold }}>lives in your</em><br />
              morning.
            </h1>
            <p style={{ fontSize: 17, color: midBrown, lineHeight: 1.75, maxWidth: 460, marginBottom: 40, fontWeight: 300 }}>
              Each morning, one mantra from the world's great wisdom traditions arrives in your hands. Learn it. Hear it. Chant it for sixty seconds while sacred geometry blooms. That's it. That's everything.
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 32 }}>
              <Link to="/enter" style={{
                background: gold, color: '#ffffff',
                padding: '14px 32px', borderRadius: 7,
                fontFamily: 'DM Sans, sans-serif', fontSize: 12,
                fontWeight: 600, letterSpacing: '0.16em',
                textDecoration: 'none', textTransform: 'uppercase',
                boxShadow: '0 4px 24px rgba(201,148,58,0.4)',
                display: 'inline-block',
              }}>
                Begin Your Practice
              </Link>
              <button onClick={() => scrollTo('practice')}
                style={{
                  background: 'transparent',
                  border: '1.5px solid rgba(201,148,58,0.5)',
                  color: midBrown, padding: '14px 28px', borderRadius: 7,
                  fontFamily: 'DM Sans, sans-serif', fontSize: 12,
                  fontWeight: 500, letterSpacing: '0.12em',
                  textTransform: 'uppercase', cursor: 'pointer',
                }}>
                See How It Works
              </button>
            </div>

            <p style={{ fontSize: 12, color: lightBrown, letterSpacing: '0.06em' }}>
              5 days free · No credit card · No app store · Installs from your browser
            </p>

            {/* Stats */}
            <div style={{ display: 'flex', gap: 40, marginTop: 48, paddingTop: 32, borderTop: '1px solid rgba(201,148,58,0.2)' }}>
              {[['365', 'Sacred mantras'], ['8', 'Wisdom traditions'], ['4', 'Geometry types']].map(([n, l]) => (
                <div key={l}>
                  <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 36, color: warmBrown, fontWeight: 300, lineHeight: 1 }}>{n}</div>
                  <div style={{ fontSize: 11, color: lightBrown, letterSpacing: '0.06em', marginTop: 4, fontFamily: 'DM Sans, sans-serif' }}>{l}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right: phone mockup */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            style={{ flex: '0 0 auto', display: 'flex', justifyContent: 'center' }}
            className="hero-phone"
          >
            <PhoneMockup />
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <div style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.2em', color: lightBrown, fontFamily: 'DM Sans, sans-serif', marginBottom: 8 }}>SCROLL</div>
            <div style={{ width: 1, height: 32, background: `linear-gradient(to bottom, ${gold}, transparent)`, margin: '0 auto' }} />
          </motion.div>
        </div>
      </section>

      {/* ── QUOTE ── */}
      <section style={{ background: ivory, padding: '80px 32px', textAlign: 'center', borderTop: '1px solid rgba(201,148,58,0.12)', borderBottom: '1px solid rgba(201,148,58,0.12)' }}>
        <div style={{ fontSize: 28, color: gold, marginBottom: 20 }}>ॐ</div>
        <blockquote style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(22px, 3.5vw, 36px)', fontStyle: 'italic', color: warmBrown, maxWidth: 700, margin: '0 auto 20px', lineHeight: 1.5, fontWeight: 300 }}>
          "You are beautiful and unlimited<br />
          <em style={{ color: gold }}>in myriad ways.</em><br />
          Remember that you are light."
        </blockquote>
        <cite style={{ fontSize: 11, letterSpacing: '0.18em', color: lightBrown, fontFamily: 'DM Sans, sans-serif', fontStyle: 'normal', textTransform: 'uppercase' }}>
          — Paul Wagner (Kalesh), Creator of Minute Mantra
        </cite>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="practice" style={{ padding: '100px 32px', background: cream }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <motion.div ref={practiceRef} initial={{ opacity: 0, y: 30 }} animate={practiceVisible ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.22em', color: gold, fontWeight: 600, marginBottom: 16, fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', textAlign: 'center' }}>The Practice</div>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(36px, 5vw, 60px)', textAlign: 'center', marginBottom: 16, fontWeight: 400, color: warmBrown }}>
              Three steps. One minute.
            </h2>
            <p style={{ textAlign: 'center', fontSize: 16, color: midBrown, maxWidth: 500, margin: '0 auto 64px', lineHeight: 1.7 }}>
              The simplest daily spiritual practice you'll ever build. And the most transformative.
            </p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 32 }}>
            {[
              { n: '01', icon: '📜', title: 'Receive your mantra', desc: 'Each morning, a new sacred sound arrives — drawn from Vedic, Buddhist, Sikh, and Universal traditions. Read its meaning. Hear it pronounced perfectly. Understand its lineage.' },
              { n: '02', icon: '◎', title: 'Watch geometry bloom', desc: 'Tap "Begin Chanting." A sacred geometry pattern slowly unfolds over sixty seconds. The animation IS the timer. Chant along as it blooms. No clock. No countdown. Just the unfolding.' },
              { n: '03', icon: '🔔', title: 'Feel the shift', desc: 'The singing bowl strikes. Your streak grows. Something settles in the body, in the mind. One minute of sacred sound changes the quality of everything that follows.' },
            ].map((step, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 30 }} animate={practiceVisible ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.7, delay: 0.15 * i }}
                style={{ background: ivory, borderRadius: 16, padding: '36px 28px', border: '1px solid rgba(201,148,58,0.15)', position: 'relative' }}>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 48, color: 'rgba(201,148,58,0.15)', fontWeight: 300, lineHeight: 1, marginBottom: 16 }}>{step.n}</div>
                <div style={{ fontSize: 28, marginBottom: 16 }}>{step.icon}</div>
                <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, color: warmBrown, marginBottom: 12, fontWeight: 500 }}>{step.title}</h3>
                <p style={{ fontSize: 14, color: midBrown, lineHeight: 1.75 }}>{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SACRED GEOMETRY ── */}
      <section style={{ padding: '100px 32px', background: ivory, borderTop: '1px solid rgba(201,148,58,0.1)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <motion.div ref={geoRef} initial={{ opacity: 0, y: 30 }} animate={geoVisible ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.22em', color: gold, fontWeight: 600, marginBottom: 16, fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', textAlign: 'center' }}>Sacred Geometry Timers</div>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(32px, 4.5vw, 54px)', textAlign: 'center', marginBottom: 56, fontWeight: 400, color: warmBrown }}>
              Four patterns. Each one a universe.
            </h2>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
            {[
              { Component: SeedOfLife, ...GEOMETRY_TYPES[0] },
              { Component: FlowerOfLife, ...GEOMETRY_TYPES[1] },
              { Component: LotusGeometry, ...GEOMETRY_TYPES[2] },
              { Component: SriYantra, ...GEOMETRY_TYPES[3] },
            ].map(({ Component, name, desc, tradition }, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 24 }} animate={geoVisible ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.1 * i }}
                style={{
                  background: cream, borderRadius: 16, padding: '36px 24px',
                  border: '1px solid rgba(201,148,58,0.2)',
                  textAlign: 'center',
                  transition: 'box-shadow 0.3s ease',
                }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                  <Component size={72} color={gold} />
                </div>
                <h4 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, color: warmBrown, marginBottom: 10, fontWeight: 500 }}>{name}</h4>
                <p style={{ fontSize: 13, color: midBrown, lineHeight: 1.65, marginBottom: 16 }}>{desc}</p>
                <span style={{ fontSize: 9, letterSpacing: '0.12em', color: gold, fontFamily: 'DM Sans, sans-serif', fontWeight: 600, textTransform: 'uppercase' }}>{tradition}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRADITIONS ── */}
      <section id="traditions" style={{ padding: '100px 32px', background: cream }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <motion.div ref={tradRef} initial={{ opacity: 0, y: 30 }} animate={tradVisible ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.22em', color: gold, fontWeight: 600, marginBottom: 16, fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase' }}>365 Mantras</div>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(32px, 4.5vw, 54px)', fontWeight: 400, color: warmBrown, marginBottom: 20, maxWidth: 600 }}>
              From the world's great<br /><em style={{ color: gold }}>wisdom traditions.</em>
            </h2>
            <p style={{ fontSize: 16, color: midBrown, maxWidth: 620, lineHeight: 1.8, marginBottom: 56 }}>
              Minute Mantra draws from eight distinct lineages — each with its own sacred language, its own cosmology, its own way of pointing toward the infinite. Every mantra arrives with original script, phonetic guide, English translation, and historical context.
            </p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
            {TRADITIONS.map((t, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 24 }} animate={tradVisible ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.1 * i }}
                style={{ background: ivory, borderRadius: 14, padding: '28px 24px', border: '1px solid rgba(201,148,58,0.18)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <span style={{ fontSize: 10, letterSpacing: '0.12em', color: gold, fontFamily: 'DM Sans, sans-serif', fontWeight: 600, textTransform: 'uppercase' }}>{t.name}</span>
                  <span style={{ fontSize: 11, background: 'rgba(201,148,58,0.12)', color: gold, padding: '2px 8px', borderRadius: 20, fontFamily: 'DM Sans, sans-serif', fontWeight: 600 }}>{t.count} mantras</span>
                </div>
                <div style={{
                  fontFamily: /[\u0900-\u097F]/.test(t.script) ? 'Noto Sans Devanagari, serif' : /[\u0A00-\u0A7F]/.test(t.script) ? 'Noto Sans Gurmukhi, serif' : 'Cormorant Garamond, serif',
                  fontSize: /[\u0900-\u097F\u0A00-\u0A7F]/.test(t.script) ? 22 : 18,
                  color: warmBrown, marginBottom: 12, lineHeight: 1.3,
                }}>
                  {t.script}
                </div>
                <p style={{ fontSize: 13, color: midBrown, lineHeight: 1.7 }}>{t.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding: '100px 32px', background: ivory, borderTop: '1px solid rgba(201,148,58,0.1)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <motion.div ref={featRef} initial={{ opacity: 0, y: 30 }} animate={featVisible ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.22em', color: gold, fontWeight: 600, marginBottom: 16, fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', textAlign: 'center' }}>Everything You Need</div>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(32px, 4.5vw, 54px)', textAlign: 'center', fontWeight: 400, color: warmBrown, marginBottom: 16 }}>
              Nothing you don't.
            </h2>
            <p style={{ textAlign: 'center', fontSize: 16, color: midBrown, maxWidth: 500, margin: '0 auto 64px', lineHeight: 1.7 }}>
              Minute Mantra is ruthlessly focused. Every feature exists to deepen your practice, not distract from it.
            </p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            {FEATURES.map((f, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 24 }} animate={featVisible ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.07 * i }}
                style={{ background: cream, borderRadius: 14, padding: '28px 24px', border: '1px solid rgba(201,148,58,0.15)' }}>
                <div style={{ fontSize: 24, marginBottom: 14 }}>{f.icon}</div>
                <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, color: warmBrown, marginBottom: 10, fontWeight: 500 }}>{f.title}</h3>
                <p style={{ fontSize: 13.5, color: midBrown, lineHeight: 1.75 }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" style={{ padding: '100px 32px', background: cream }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <motion.div ref={pricingRef} initial={{ opacity: 0, y: 30 }} animate={pricingVisible ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.22em', color: gold, fontWeight: 600, marginBottom: 16, fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', textAlign: 'center' }}>Pricing</div>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(32px, 4.5vw, 54px)', textAlign: 'center', fontWeight: 400, color: warmBrown, marginBottom: 16 }}>
              Less than a cup of tea.
            </h2>
            <p style={{ textAlign: 'center', fontSize: 16, color: midBrown, maxWidth: 520, margin: '0 auto 64px', lineHeight: 1.7 }}>
              Start free. No credit card. Experience the full practice for 5 days, then choose the plan that fits your commitment.
            </p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: 24, alignItems: 'start' }}>
            {/* Free */}
            <motion.div initial={{ opacity: 0, y: 24 }} animate={pricingVisible ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}
              style={{ background: ivory, borderRadius: 20, padding: '36px 28px', border: '1px solid rgba(201,148,58,0.2)' }}>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 600, color: midBrown, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Free Trial</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 }}>
                <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 52, fontWeight: 300, color: warmBrown, lineHeight: 1 }}>$0</span>
                <span style={{ fontSize: 13, color: lightBrown, fontFamily: 'DM Sans, sans-serif' }}>5 days</span>
              </div>
              <p style={{ fontSize: 13, color: midBrown, marginBottom: 28, lineHeight: 1.6 }}>Experience the full practice. No credit card required.</p>
              <div style={{ borderTop: '1px solid rgba(201,148,58,0.15)', paddingTop: 24, marginBottom: 28 }}>
                {FREE_FEATURES.map((f, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
                    <span style={{ color: gold, fontSize: 14, marginTop: 1, flexShrink: 0 }}>✓</span>
                    <span style={{ fontSize: 13, color: midBrown, lineHeight: 1.5 }}>{f}</span>
                  </div>
                ))}
              </div>
              <Link to="/enter" style={{
                display: 'block', textAlign: 'center',
                border: `1.5px solid ${gold}`, color: gold,
                padding: '13px 0', borderRadius: 8,
                fontFamily: 'DM Sans, sans-serif', fontSize: 12,
                fontWeight: 600, letterSpacing: '0.14em',
                textDecoration: 'none', textTransform: 'uppercase',
              }}>
                Begin Free
              </Link>
              <p style={{ textAlign: 'center', fontSize: 11, color: lightBrown, marginTop: 10 }}>No credit card · No app store</p>
            </motion.div>

            {/* Monthly */}
            <motion.div initial={{ opacity: 0, y: 24 }} animate={pricingVisible ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.1 }}
              style={{ background: ivory, borderRadius: 20, padding: '36px 28px', border: '1px solid rgba(201,148,58,0.2)' }}>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 600, color: midBrown, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Monthly</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 }}>
                <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 52, fontWeight: 300, color: warmBrown, lineHeight: 1 }}>$0.99</span>
                <span style={{ fontSize: 13, color: lightBrown, fontFamily: 'DM Sans, sans-serif' }}>per month</span>
              </div>
              <p style={{ fontSize: 13, color: midBrown, marginBottom: 28, lineHeight: 1.6 }}>Less than a cup of tea. Cancel anytime.</p>
              <div style={{ borderTop: '1px solid rgba(201,148,58,0.15)', paddingTop: 24, marginBottom: 28 }}>
                {MONTHLY_FEATURES.map((f, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
                    <span style={{ color: gold, fontSize: 14, marginTop: 1, flexShrink: 0 }}>✓</span>
                    <span style={{ fontSize: 13, color: midBrown, lineHeight: 1.5 }}>{f}</span>
                  </div>
                ))}
              </div>
              <Link to="/enter" style={{
                display: 'block', textAlign: 'center',
                border: `1.5px solid ${gold}`, color: gold,
                padding: '13px 0', borderRadius: 8,
                fontFamily: 'DM Sans, sans-serif', fontSize: 12,
                fontWeight: 600, letterSpacing: '0.14em',
                textDecoration: 'none', textTransform: 'uppercase',
              }}>
                Start Monthly
              </Link>
              <p style={{ textAlign: 'center', fontSize: 11, color: lightBrown, marginTop: 10 }}>Cancel anytime</p>
            </motion.div>

            {/* Annual — highlighted */}
            <motion.div initial={{ opacity: 0, y: 24 }} animate={pricingVisible ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.2 }}
              style={{
                background: `linear-gradient(160deg, #fdf3e0 0%, #faecd0 100%)`,
                borderRadius: 20, padding: '36px 28px',
                border: `2px solid ${gold}`,
                boxShadow: '0 8px 40px rgba(201,148,58,0.2)',
                position: 'relative',
              }}>
              <div style={{
                position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                background: gold, color: '#ffffff',
                padding: '4px 16px', borderRadius: 20,
                fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
                fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase',
                whiteSpace: 'nowrap',
              }}>
                Best Value — Save 16%
              </div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 600, color: gold, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Annual</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 }}>
                <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 52, fontWeight: 300, color: warmBrown, lineHeight: 1 }}>$9.99</span>
                <span style={{ fontSize: 13, color: lightBrown, fontFamily: 'DM Sans, sans-serif' }}>per year</span>
              </div>
              <p style={{ fontSize: 13, color: midBrown, marginBottom: 28, lineHeight: 1.6 }}>One year of daily practice. Less than $0.84/month.</p>
              <div style={{ borderTop: '1px solid rgba(201,148,58,0.2)', paddingTop: 24, marginBottom: 28 }}>
                {ANNUAL_FEATURES.map((f, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
                    <span style={{ color: gold, fontSize: 14, marginTop: 1, flexShrink: 0 }}>✦</span>
                    <span style={{ fontSize: 13, color: midBrown, lineHeight: 1.5 }}>{f}</span>
                  </div>
                ))}
              </div>
              <Link to="/enter" style={{
                display: 'block', textAlign: 'center',
                background: gold, color: '#ffffff',
                padding: '14px 0', borderRadius: 8,
                fontFamily: 'DM Sans, sans-serif', fontSize: 12,
                fontWeight: 600, letterSpacing: '0.14em',
                textDecoration: 'none', textTransform: 'uppercase',
                boxShadow: '0 4px 20px rgba(201,148,58,0.4)',
              }}>
                Start Annual
              </Link>
              <p style={{ textAlign: 'center', fontSize: 11, color: lightBrown, marginTop: 10 }}>Cancel anytime · Best for committed practitioners</p>
            </motion.div>
          </div>

          <p style={{ textAlign: 'center', fontSize: 12, color: lightBrown, marginTop: 32, lineHeight: 1.7 }}>
            All plans include the core practice. Platinum unlocks deeper tools for committed practitioners.<br />
            No partial refunds. Cancel anytime from your account settings.
          </p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" style={{ padding: '100px 32px', background: ivory, borderTop: '1px solid rgba(201,148,58,0.1)' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <motion.div ref={faqRef} initial={{ opacity: 0, y: 30 }} animate={faqVisible ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.22em', color: gold, fontWeight: 600, marginBottom: 16, fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', textAlign: 'center' }}>Questions</div>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(32px, 4.5vw, 54px)', textAlign: 'center', fontWeight: 400, color: warmBrown, marginBottom: 56 }}>
              Everything you need to know.
            </h2>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 24 }} animate={faqVisible ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7, delay: 0.15 }}>
            <div style={{ borderTop: '1px solid rgba(201,148,58,0.18)' }}>
              {FAQS.map((item, i) => <FaqItem key={i} q={item.q} a={item.a} />)}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ padding: '100px 32px', background: cream }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <motion.div ref={testimonialRef} initial={{ opacity: 0, y: 30 }} animate={testimonialVisible ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.22em', color: gold, fontWeight: 600, marginBottom: 16, fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', textAlign: 'center' }}>Practitioners</div>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(32px, 4.5vw, 54px)', textAlign: 'center', fontWeight: 400, color: warmBrown, marginBottom: 64 }}>
              What one minute can do.
            </h2>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 24 }} animate={testimonialVisible ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.08 * i }}
                style={{ background: ivory, borderRadius: 16, padding: '28px 24px', border: '1px solid rgba(201,148,58,0.15)' }}>
                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 17, color: warmBrown, lineHeight: 1.7, fontStyle: 'italic', marginBottom: 20 }}>
                  "{t.quote}"
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 600, color: warmBrown }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: lightBrown, marginTop: 2 }}>{t.role}</div>
                  </div>
                  <div style={{ fontSize: 11, color: gold, fontFamily: 'DM Sans, sans-serif', fontWeight: 600 }}>🔥 {t.streak}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CREATOR ── */}
      <section style={{ padding: '100px 32px', background: ivory, borderTop: '1px solid rgba(201,148,58,0.1)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <motion.div ref={creatorRef} initial={{ opacity: 0, y: 30 }} animate={creatorVisible ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.22em', color: gold, fontWeight: 600, marginBottom: 16, fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase' }}>Created By</div>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: `linear-gradient(135deg, #f5e8cc, #e8d0a0)`, border: `2px solid rgba(201,148,58,0.4)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: 32 }}>
              ॐ
            </div>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 400, color: warmBrown, marginBottom: 20 }}>Paul Wagner</h2>
            <p style={{ fontSize: 16, color: midBrown, lineHeight: 1.85, marginBottom: 24 }}>
              Spiritual teacher, devotee of Amma, and creator of Minute Mantra. Paul has studied and practiced across Vedic, Buddhist, and Sikh traditions for decades. He created this app as a gift — a way to bring the transformative power of sacred sound into the hands of anyone willing to give it one minute.
            </p>
            <p style={{ fontSize: 16, color: midBrown, lineHeight: 1.85, marginBottom: 36 }}>
              His work spans spiritual guidance, sacred oracle tools, and the intersection of ancient wisdom with modern life. Minute Mantra is the distillation of that work into its simplest, most accessible form.
            </p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              {[['PaulWagner.com →', 'https://paulwagner.com'], ['The Shankara Oracle →', 'https://theshankaraoracleapp.com'], ['Blended Soul →', 'https://blendedsoul.com']].map(([label, href]) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 13, color: gold, fontFamily: 'DM Sans, sans-serif', fontWeight: 500, textDecoration: 'none', borderBottom: '1px solid rgba(201,148,58,0.4)', paddingBottom: 2 }}>
                  {label}
                </a>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{
        padding: '100px 32px',
        background: `linear-gradient(160deg, #f5e8cc 0%, #eddcb0 100%)`,
        textAlign: 'center',
        borderTop: '1px solid rgba(201,148,58,0.2)',
      }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div style={{ fontSize: 36, marginBottom: 20 }}>ॐ</div>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 400, color: warmBrown, marginBottom: 20, lineHeight: 1.2 }}>
            Your morning practice<br /><em style={{ color: gold }}>begins tomorrow.</em>
          </h2>
          <p style={{ fontSize: 16, color: midBrown, lineHeight: 1.75, marginBottom: 40 }}>
            Five days free. No credit card. No app store. One mantra, one minute, every morning — and something in you will never be the same.
          </p>
          <Link to="/enter" style={{
            display: 'inline-block',
            background: gold, color: '#ffffff',
            padding: '16px 48px', borderRadius: 8,
            fontFamily: 'DM Sans, sans-serif', fontSize: 13,
            fontWeight: 600, letterSpacing: '0.18em',
            textDecoration: 'none', textTransform: 'uppercase',
            boxShadow: '0 6px 32px rgba(201,148,58,0.45)',
          }}>
            Begin Your Practice
          </Link>
          <p style={{ fontSize: 12, color: lightBrown, marginTop: 16 }}>5 days free · No credit card · Cancel anytime</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: warmBrown, color: 'rgba(253,248,240,0.7)', padding: '48px 32px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 32 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 20, color: gold }}>ॐ</span>
              <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 600, letterSpacing: '0.14em', color: 'rgba(253,248,240,0.9)', textTransform: 'uppercase' }}>Minute Mantra</span>
            </div>
            <p style={{ fontSize: 12, lineHeight: 1.7, maxWidth: 260 }}>One mantra. One minute. Every morning.</p>
          </div>
          <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 10, letterSpacing: '0.14em', color: gold, fontWeight: 600, marginBottom: 16, textTransform: 'uppercase', fontFamily: 'DM Sans, sans-serif' }}>App</div>
              {[['About', '/about'], ['Privacy', '/privacy'], ['Terms', '/terms']].map(([l, h]) => (
                <div key={l} style={{ marginBottom: 10 }}>
                  <Link to={h} style={{ fontSize: 13, color: 'rgba(253,248,240,0.6)', textDecoration: 'none', fontFamily: 'DM Sans, sans-serif' }}>{l}</Link>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 10, letterSpacing: '0.14em', color: gold, fontWeight: 600, marginBottom: 16, textTransform: 'uppercase', fontFamily: 'DM Sans, sans-serif' }}>Paul Wagner</div>
              {[['PaulWagner.com', 'https://paulwagner.com'], ['Blended Soul', 'https://blendedsoul.com']].map(([l, h]) => (
                <div key={l} style={{ marginBottom: 10 }}>
                  <a href={h} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: 'rgba(253,248,240,0.6)', textDecoration: 'none', fontFamily: 'DM Sans, sans-serif' }}>{l}</a>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ maxWidth: 1100, margin: '32px auto 0', paddingTop: 24, borderTop: '1px solid rgba(253,248,240,0.1)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontSize: 11, color: 'rgba(253,248,240,0.35)', fontFamily: 'DM Sans, sans-serif' }}>
            © {new Date().getFullYear()} Minute Mantra. All rights reserved.
          </p>
          <p style={{ fontSize: 11, color: 'rgba(253,248,240,0.35)', fontFamily: 'DM Sans, sans-serif' }}>
            A Paul Wagner creation
          </p>
        </div>
      </footer>

      {/* ── RESPONSIVE STYLES ── */}
      <style>{`
        @media (max-width: 768px) {
          .hero-phone { display: none !important; }
          .hidden-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
        }
        @media (min-width: 769px) {
          .show-mobile { display: none !important; }
          .hidden-mobile { display: flex !important; }
        }
      `}</style>
    </div>
  );
}

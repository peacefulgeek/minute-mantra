import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';

const CDN = 'https://minute-mantra.b-cdn.net';

const TRADITIONS = [
  { name: 'Vedic / Hindu', color: '#b8860b', desc: 'Ancient Sanskrit mantras from the Vedas, Upanishads, and devotional traditions' },
  { name: 'Buddhist', color: '#c9920e', desc: 'Pali and Tibetan mantras from Theravada, Mahayana, and Vajrayana lineages' },
  { name: 'Sikh / Gurbani', color: '#ff6f00', desc: 'Sacred verses from the Guru Granth Sahib and Sikh devotional practice' },
  { name: 'Universal', color: '#4a6741', desc: 'Non-denominational affirmation-mantras for all seekers, in English' },
];

const FEATURES = [
  {
    icon: '🕉',
    title: 'One mantra, every morning',
    desc: 'A new sacred sound awaits you each day — drawn from 365 mantras across Vedic, Buddhist, Sikh, and Universal traditions.',
  },
  {
    icon: '⏱',
    title: 'Sixty seconds of stillness',
    desc: 'Watch sacred geometry bloom as you chant. The animation IS the timer. No numbers, no pressure — just presence.',
  },
  {
    icon: '🎵',
    title: 'Hear it pronounced perfectly',
    desc: 'Every mantra includes a studio-quality audio pronunciation so you chant with confidence, not guesswork.',
  },
  {
    icon: '🔥',
    title: 'Build a streak that matters',
    desc: 'Track your practice with a living flame that grows with your consistency. A calendar heatmap shows your journey.',
  },
  {
    icon: '📿',
    title: 'Mala counter (Premium)',
    desc: '108 beads around the sacred geometry. Tap to count. Ancient practice, modern interface.',
  },
  {
    icon: '🌅',
    title: 'Morning reminders',
    desc: 'Email and push notifications at your chosen time. Your mantra arrives before the world does.',
  },
];

const TESTIMONIALS = [
  {
    quote: "I've tried every meditation app. This is the only one I've kept. One minute. Every morning. It changed something in me.",
    name: 'Sarah K.',
    role: 'Yoga teacher, Portland',
  },
  {
    quote: "The sacred geometry timer is unlike anything I've seen. I find myself just watching it bloom. That IS the practice.",
    name: 'Michael R.',
    role: 'Software engineer, Austin',
  },
  {
    quote: "I didn't think I could maintain a daily practice. 47 days in. The streak flame keeps me honest.",
    name: 'Priya M.',
    role: 'Therapist, Chicago',
  },
];

// Animated sacred geometry SVG for hero
function AnimatedGeometry() {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full" style={{ filter: 'drop-shadow(0 0 20px rgba(184,134,11,0.5))' }}>
      {/* Flower of Life — 7 circles */}
      {[
        [100, 100],
        [100, 66], [100, 134],
        [128.6, 83], [71.4, 83],
        [128.6, 117], [71.4, 117],
      ].map(([cx, cy], i) => (
        <motion.circle
          key={i}
          cx={cx} cy={cy} r={34}
          fill="none"
          stroke="#b8860b"
          strokeWidth="0.8"
          strokeOpacity="0.7"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.7 }}
          transition={{ duration: 2, delay: i * 0.3, ease: 'easeOut', repeat: Infinity, repeatDelay: 5 }}
        />
      ))}
      {/* Center dot */}
      <motion.circle
        cx={100} cy={100} r={3}
        fill="#b8860b"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.5, 1], opacity: [0, 1, 0.8] }}
        transition={{ duration: 1, delay: 2.5, repeat: Infinity, repeatDelay: 6 }}
      />
      {/* Outer ring */}
      <motion.circle
        cx={100} cy={100} r={68}
        fill="none"
        stroke="#b8860b"
        strokeWidth="0.5"
        strokeOpacity="0.3"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 3, delay: 0.5, ease: 'easeOut', repeat: Infinity, repeatDelay: 4 }}
      />
    </svg>
  );
}

// Floating mantra card preview
function MantraPreview() {
  const mantras = [
    { text: 'ॐ नमः शिवाय', roman: 'Om Namah Shivaya', tradition: 'Vedic / Shaivite', color: '#a8d8ea' },
    { text: 'ਵਾਹਿਗੁਰੂ', roman: 'Waheguru', tradition: 'Sikh / Gurbani', color: '#ff6f00' },
    { text: 'ॐ मणि पद्मे हूँ', roman: 'Om Mani Padme Hum', tradition: 'Buddhist / Tibetan', color: '#c9920e' },
    { text: 'I am peace. I am light.', roman: 'I am peace. I am light.', tradition: 'Universal', color: '#4a6741' },
  ];
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % mantras.length), 3500);
    return () => clearInterval(t);
  }, []);

  const m = mantras[idx];

  return (
    <div className="relative mx-auto" style={{ maxWidth: 320 }}>
      {/* Phone frame */}
      <div className="relative rounded-3xl overflow-hidden border border-white/10" style={{
        background: 'linear-gradient(160deg, #1a1a2e 0%, #0d0d1a 100%)',
        boxShadow: '0 40px 80px rgba(0,0,0,0.6), 0 0 40px rgba(184,134,11,0.15)',
        padding: '2px',
      }}>
        <div className="rounded-3xl overflow-hidden" style={{ background: '#1a1a2e', minHeight: 480 }}>
          {/* Status bar */}
          <div className="flex justify-between items-center px-6 pt-4 pb-2">
            <span className="text-xs text-white/30">9:41</span>
            <div className="w-20 h-5 rounded-full bg-black/60" />
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-full bg-white/20" />
              <div className="w-3 h-3 rounded-full bg-white/20" />
            </div>
          </div>

          {/* App header */}
          <div className="flex justify-between items-center px-6 py-3">
            <span className="text-white/60 text-sm font-light tracking-widest">ॐ MINUTE MANTRA</span>
            <div className="w-7 h-7 rounded-full border border-white/20 flex items-center justify-center">
              <span className="text-white/40 text-xs">≡</span>
            </div>
          </div>

          {/* Mantra card */}
          <div className="px-5 pb-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="rounded-2xl p-5"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div className="text-xs tracking-widest mb-3" style={{ color: m.color, opacity: 0.8 }}>
                  {m.tradition.toUpperCase()}
                </div>
                <div className="text-3xl font-light text-white/90 mb-2 leading-tight">{m.text}</div>
                <div className="text-sm text-white/50 italic mb-4">{m.roman !== m.text ? m.roman : ''}</div>

                {/* Sacred geometry mini */}
                <div className="flex justify-center my-4">
                  <div className="w-24 h-24 relative">
                    <AnimatedGeometry />
                  </div>
                </div>

                {/* Begin chanting button */}
                <button className="w-full py-3 rounded-xl text-sm font-medium tracking-wider" style={{
                  background: 'linear-gradient(135deg, #b8860b, #d4a017)',
                  color: '#1a1a2e',
                }}>
                  BEGIN CHANTING
                </button>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Glow beneath phone */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-48 h-8 rounded-full blur-xl" style={{
        background: 'rgba(184,134,11,0.3)',
      }} />
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 400], [1, 0.95]);

  return (
    <div className="min-h-screen" style={{ background: '#0d0d1a', color: '#f0ebe3', fontFamily: 'Georgia, serif' }}>

      {/* ═══ NAVBAR ═══ */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-6 py-4"
        style={{ background: 'rgba(13,13,26,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(184,134,11,0.1)' }}>
        <div className="flex items-center gap-2">
          <span className="text-xl" style={{ color: '#b8860b' }}>ॐ</span>
          <span className="text-white/80 tracking-widest text-sm font-light">MINUTE MANTRA</span>
        </div>
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/enter')}
          className="px-6 py-2 rounded-full text-sm tracking-widest font-medium"
          style={{
            background: 'linear-gradient(135deg, #b8860b, #d4a017)',
            color: '#1a1a2e',
            boxShadow: '0 0 20px rgba(184,134,11,0.3)',
          }}
        >
          ENTER
        </motion.button>
      </nav>

      {/* ═══ HERO ═══ */}
      <motion.section
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20"
      >
        {/* Background image */}
        <div className="absolute inset-0 z-0">
          <img
            src={`${CDN}/images/hero-bg.webp`}
            alt=""
            className="w-full h-full object-cover"
            style={{ opacity: 0.35 }}
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(13,13,26,0.3) 0%, rgba(13,13,26,0.7) 60%, #0d0d1a 100%)' }} />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Copy */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: 'easeOut' }}
          >
            <div className="text-sm tracking-widest mb-6" style={{ color: '#b8860b', opacity: 0.8 }}>
              ONE MANTRA · ONE MINUTE · EVERY MORNING
            </div>
            <h1 className="text-5xl lg:text-7xl font-light leading-tight mb-6" style={{ color: '#f0ebe3', letterSpacing: '-0.02em' }}>
              A sacred practice<br />
              <span style={{ color: '#b8860b' }}>that fits</span><br />
              in your morning.
            </h1>
            <p className="text-lg text-white/60 leading-relaxed mb-10 max-w-lg" style={{ fontFamily: 'system-ui, sans-serif' }}>
              Each morning, one mantra from the world's great wisdom traditions arrives in your hands.
              Learn it. Hear it. Chant it for sixty seconds. Watch sacred geometry bloom as you practice.
              That's it. That's everything.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <motion.button
                whileHover={{ scale: 1.04, boxShadow: '0 0 40px rgba(184,134,11,0.5)' }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/enter')}
                className="px-10 py-4 rounded-full text-base tracking-widest font-medium"
                style={{
                  background: 'linear-gradient(135deg, #b8860b, #d4a017)',
                  color: '#1a1a2e',
                }}
              >
                BEGIN YOUR PRACTICE
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => document.getElementById('how-it-works').scrollIntoView({ behavior: 'smooth' })}
                className="px-10 py-4 rounded-full text-base tracking-widest font-light"
                style={{
                  border: '1px solid rgba(184,134,11,0.4)',
                  color: '#b8860b',
                  background: 'transparent',
                }}
              >
                SEE HOW IT WORKS
              </motion.button>
            </div>
            <p className="mt-6 text-sm text-white/30" style={{ fontFamily: 'system-ui, sans-serif' }}>
              Free forever · No credit card · No app store
            </p>
          </motion.div>

          {/* Right: Phone mockup */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }}
            className="hidden lg:flex justify-center"
          >
            <MantraPreview />
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-xs tracking-widest text-white/30" style={{ fontFamily: 'system-ui, sans-serif' }}>SCROLL</span>
          <div className="w-px h-8" style={{ background: 'linear-gradient(to bottom, rgba(184,134,11,0.5), transparent)' }} />
        </motion.div>
      </motion.section>

      {/* ═══ THE MOMENT ═══ */}
      <section className="py-32 px-6 text-center" style={{ background: '#0d0d1a' }}>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl mx-auto"
        >
          <div className="text-6xl mb-8">ॐ</div>
          <h2 className="text-4xl lg:text-5xl font-light leading-tight mb-8" style={{ color: '#f0ebe3' }}>
            "You are beautiful and unlimited<br />
            <span style={{ color: '#b8860b' }}>in myriad ways.</span><br />
            Remember that you are light."
          </h2>
          <p className="text-white/40 text-sm tracking-widest" style={{ fontFamily: 'system-ui, sans-serif' }}>
            — PAUL WAGNER (KALESH), CREATOR OF MINUTE MANTRA
          </p>
        </motion.div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section id="how-it-works" className="py-32 px-6" style={{ background: 'rgba(184,134,11,0.03)' }}>
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <div className="text-xs tracking-widest mb-4" style={{ color: '#b8860b', fontFamily: 'system-ui, sans-serif' }}>THE PRACTICE</div>
            <h2 className="text-4xl lg:text-5xl font-light" style={{ color: '#f0ebe3' }}>Three steps. One minute.</h2>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-12">
            {[
              {
                step: '01',
                title: 'Receive your mantra',
                desc: 'Each morning, a new sacred sound arrives — drawn from Vedic, Buddhist, Sikh, and Universal traditions. Read its meaning. Hear it pronounced perfectly.',
                icon: '📜',
              },
              {
                step: '02',
                title: 'Watch geometry bloom',
                desc: 'Tap "Begin Chanting." A sacred geometry pattern slowly unfolds over sixty seconds. The animation IS the timer. Chant along as it blooms.',
                icon: '✦',
              },
              {
                step: '03',
                title: 'Feel the shift',
                desc: 'The singing bowl strikes. Your streak grows. Something settles. One minute of sacred sound changes the quality of everything that follows.',
                icon: '🔔',
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative"
              >
                <div className="text-6xl font-light mb-6" style={{ color: 'rgba(184,134,11,0.15)', fontFamily: 'system-ui, sans-serif' }}>{item.step}</div>
                <div className="text-3xl mb-4">{item.icon}</div>
                <h3 className="text-xl font-light mb-4" style={{ color: '#f0ebe3' }}>{item.title}</h3>
                <p className="text-white/50 leading-relaxed" style={{ fontFamily: 'system-ui, sans-serif' }}>{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TRADITIONS ═══ */}
      <section className="py-32 px-6" style={{ background: '#0d0d1a' }}>
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="text-xs tracking-widest mb-4" style={{ color: '#b8860b', fontFamily: 'system-ui, sans-serif' }}>365 MANTRAS</div>
            <h2 className="text-4xl lg:text-5xl font-light" style={{ color: '#f0ebe3' }}>From the world's great<br />wisdom traditions</h2>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-6 mb-16">
            {TRADITIONS.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${t.color}22` }}
              >
                <div className="text-sm tracking-widest mb-2" style={{ color: t.color, fontFamily: 'system-ui, sans-serif' }}>{t.name.toUpperCase()}</div>
                <p className="text-white/50" style={{ fontFamily: 'system-ui, sans-serif' }}>{t.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Tradition image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="flex justify-center"
          >
            <img
              src={`${CDN}/images/landing-tradition.webp`}
              alt="Sacred geometry traditions"
              className="rounded-3xl"
              style={{ maxWidth: 480, width: '100%', opacity: 0.9 }}
            />
          </motion.div>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section className="py-32 px-6" style={{ background: 'rgba(184,134,11,0.03)' }}>
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <div className="text-xs tracking-widest mb-4" style={{ color: '#b8860b', fontFamily: 'system-ui, sans-serif' }}>EVERYTHING YOU NEED</div>
            <h2 className="text-4xl lg:text-5xl font-light" style={{ color: '#f0ebe3' }}>Nothing you don't.</h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="p-6 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-light mb-3" style={{ color: '#f0ebe3' }}>{f.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed" style={{ fontFamily: 'system-ui, sans-serif' }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PRICING ═══ */}
      <section className="py-32 px-6" style={{ background: '#0d0d1a' }}>
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="text-xs tracking-widest mb-4" style={{ color: '#b8860b', fontFamily: 'system-ui, sans-serif' }}>PRICING</div>
            <h2 className="text-4xl lg:text-5xl font-light" style={{ color: '#f0ebe3' }}>Less than a cup of tea.</h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Free */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-8 rounded-3xl"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div className="text-sm tracking-widest mb-4 text-white/40" style={{ fontFamily: 'system-ui, sans-serif' }}>FREE · FOREVER</div>
              <div className="text-5xl font-light mb-6" style={{ color: '#f0ebe3' }}>$0</div>
              <ul className="space-y-3 mb-8">
                {['Daily mantra + context card', '60-second timer with sacred geometry', 'Audio pronunciation', 'Morning notifications', 'Streak tracking + calendar heatmap', 'Up to 5 favorites', 'Go Deeper links to PaulWagner.com'].map(item => (
                  <li key={item} className="flex items-center gap-3 text-sm text-white/60" style={{ fontFamily: 'system-ui, sans-serif' }}>
                    <span style={{ color: '#b8860b' }}>✓</span> {item}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => navigate('/enter')}
                className="w-full py-3 rounded-full text-sm tracking-widest"
                style={{ border: '1px solid rgba(184,134,11,0.4)', color: '#b8860b' }}
              >
                START FREE
              </button>
            </motion.div>

            {/* Premium */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="p-8 rounded-3xl relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(184,134,11,0.15), rgba(184,134,11,0.05))',
                border: '1px solid rgba(184,134,11,0.3)',
              }}
            >
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs tracking-widest" style={{ background: '#b8860b', color: '#1a1a2e', fontFamily: 'system-ui, sans-serif' }}>
                BEST VALUE
              </div>
              <div className="text-sm tracking-widest mb-4" style={{ color: '#b8860b', fontFamily: 'system-ui, sans-serif' }}>PREMIUM</div>
              <div className="flex items-end gap-2 mb-1">
                <span className="text-5xl font-light" style={{ color: '#f0ebe3' }}>$1.97</span>
                <span className="text-white/40 mb-2" style={{ fontFamily: 'system-ui, sans-serif' }}>/month</span>
              </div>
              <div className="text-sm text-white/40 mb-6" style={{ fontFamily: 'system-ui, sans-serif' }}>or $16.95/year — save 28%</div>
              <ul className="space-y-3 mb-8">
                {['Everything in Free', 'Extended timers (2, 5, 10 minutes)', 'Mala counter — 108 beads', 'Unlimited favorites', 'Full mantra library — browse & search', 'Singing bowl ambient sound'].map(item => (
                  <li key={item} className="flex items-center gap-3 text-sm text-white/70" style={{ fontFamily: 'system-ui, sans-serif' }}>
                    <span style={{ color: '#b8860b' }}>✦</span> {item}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => navigate('/enter')}
                className="w-full py-3 rounded-full text-sm tracking-widest font-medium"
                style={{ background: 'linear-gradient(135deg, #b8860b, #d4a017)', color: '#1a1a2e' }}
              >
                START PREMIUM
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section className="py-32 px-6" style={{ background: 'rgba(184,134,11,0.03)' }}>
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="text-xs tracking-widest mb-4" style={{ color: '#b8860b', fontFamily: 'system-ui, sans-serif' }}>PRACTITIONERS</div>
            <h2 className="text-4xl font-light" style={{ color: '#f0ebe3' }}>What one minute can do.</h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="p-6 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="text-2xl mb-4" style={{ color: '#b8860b' }}>"</div>
                <p className="text-white/70 leading-relaxed mb-6 italic" style={{ fontFamily: 'system-ui, sans-serif' }}>{t.quote}</p>
                <div>
                  <div className="text-sm font-medium" style={{ color: '#f0ebe3', fontFamily: 'system-ui, sans-serif' }}>{t.name}</div>
                  <div className="text-xs text-white/30" style={{ fontFamily: 'system-ui, sans-serif' }}>{t.role}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ ABOUT PAUL ═══ */}
      <section className="py-32 px-6" style={{ background: '#0d0d1a' }}>
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-16 items-center"
          >
            <div>
              <img
                src={`${CDN}/images/paul-wagner.webp`}
                alt="Paul Wagner"
                className="rounded-3xl w-full"
                style={{ maxWidth: 320, border: '1px solid rgba(184,134,11,0.2)' }}
              />
            </div>
            <div>
              <div className="text-xs tracking-widest mb-4" style={{ color: '#b8860b', fontFamily: 'system-ui, sans-serif' }}>CREATED BY</div>
              <h2 className="text-3xl font-light mb-4" style={{ color: '#f0ebe3' }}>Paul Wagner</h2>
              <p className="text-white/60 leading-relaxed mb-6" style={{ fontFamily: 'system-ui, sans-serif' }}>
                Spiritual teacher, devotee of Amma, and creator of Minute Mantra. Paul has studied and practiced across Vedic, Buddhist, and Sikh traditions for decades. He created this app as a gift — a simple daily practice that anyone can maintain, regardless of tradition or experience.
              </p>
              <div className="flex flex-col gap-3">
                <a href="https://paulwagner.com" target="_blank" rel="noopener noreferrer"
                  className="text-sm tracking-wider" style={{ color: '#b8860b', fontFamily: 'system-ui, sans-serif' }}>
                  PaulWagner.com →
                </a>
                <a href="https://shankaraoraclecards.com" target="_blank" rel="noopener noreferrer"
                  className="text-sm tracking-wider" style={{ color: '#b8860b', fontFamily: 'system-ui, sans-serif' }}>
                  The Shankara Oracle →
                </a>
                <a href="https://blendedsoul.com" target="_blank" rel="noopener noreferrer"
                  className="text-sm tracking-wider" style={{ color: '#b8860b', fontFamily: 'system-ui, sans-serif' }}>
                  BlendedSoul →
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="py-40 px-6 text-center relative overflow-hidden" style={{ background: 'linear-gradient(to bottom, #0d0d1a, #1a1a2e)' }}>
        <div className="absolute inset-0 flex items-center justify-center opacity-10">
          <div className="w-96 h-96">
            <AnimatedGeometry />
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative z-10 max-w-2xl mx-auto"
        >
          <div className="text-4xl mb-6">ॐ</div>
          <h2 className="text-4xl lg:text-5xl font-light mb-6" style={{ color: '#f0ebe3' }}>
            One minute.<br />
            <span style={{ color: '#b8860b' }}>Every morning.</span><br />
            Starting now.
          </h2>
          <p className="text-white/50 mb-10 leading-relaxed" style={{ fontFamily: 'system-ui, sans-serif' }}>
            No app store. No download. Install it from your browser in seconds.
          </p>
          <motion.button
            whileHover={{ scale: 1.04, boxShadow: '0 0 60px rgba(184,134,11,0.5)' }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/enter')}
            className="px-14 py-5 rounded-full text-base tracking-widest font-medium"
            style={{
              background: 'linear-gradient(135deg, #b8860b, #d4a017)',
              color: '#1a1a2e',
            }}
          >
            BEGIN YOUR PRACTICE
          </motion.button>
          <p className="mt-6 text-sm text-white/30" style={{ fontFamily: 'system-ui, sans-serif' }}>
            Free forever · No credit card required
          </p>
        </motion.div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="py-12 px-6 text-center" style={{ background: '#0d0d1a', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex justify-center items-center gap-2 mb-4">
          <span style={{ color: '#b8860b' }}>ॐ</span>
          <span className="text-white/40 text-sm tracking-widest" style={{ fontFamily: 'system-ui, sans-serif' }}>MINUTE MANTRA</span>
        </div>
        <div className="flex justify-center gap-6 text-xs text-white/30" style={{ fontFamily: 'system-ui, sans-serif' }}>
          <a href="/about" className="hover:text-white/60 transition-colors">About</a>
          <a href="/privacy" className="hover:text-white/60 transition-colors">Privacy</a>
          <a href="/terms" className="hover:text-white/60 transition-colors">Terms</a>
        </div>
        <p className="mt-4 text-xs text-white/20" style={{ fontFamily: 'system-ui, sans-serif' }}>
          © {new Date().getFullYear()} Creative Lab Agency LLC. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

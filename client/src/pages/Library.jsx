import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlass, Heart, SpeakerHigh, Stop, X } from '@phosphor-icons/react';
import { useAuth } from '../contexts/AuthContext';

const TRADITION_LABELS = {
  vedic_shiva: 'Shaivite', vedic_vishnu: 'Vaishnava', vedic_shakti: 'Shakta',
  vedic_ganesha: 'Ganesha', vedic_solar: 'Solar', buddhist: 'Buddhist',
  sikh: 'Sikh', universal: 'Universal',
};

const CATEGORIES = [
  'Love', 'Healing', 'Peace', 'Transitions', 'Strength',
  'Trauma', 'Wisdom', 'Abundance', 'Protection', 'Joy', 'Focus', 'Surrender',
];

const CATEGORY_ICONS = {
  Love: '💛', Healing: '🌿', Peace: '🕊', Transitions: '🦋', Strength: '🔥',
  Trauma: '🪷', Wisdom: '✦', Abundance: '☀️', Protection: '🛡', Joy: '✨', Focus: '🧘', Surrender: '🌊',
};

// Deep, grounded explanations keyed by intention — unique for each mantra's life theme
const DEEP_EXPLANATIONS = {
  'Purification': 'This mantra works directly on the nervous system, activating the vagus nerve through its specific syllable vibrations. As you chant, the repetition creates a rhythmic pattern that signals safety to your body, lowering cortisol and calming the fight-or-flight response. In daily life, this is the mantra you reach for when you feel weighed down by accumulated stress, resentment, or emotional residue that no longer serves you. It is a reset — not just spiritually, but physiologically. The vibration loosens what is held tight in the chest and throat, making space for clarity.',
  'Healing': 'When the body is under stress or illness, the heart rate becomes erratic and the breath shallow. This mantra restores coherence. The specific sound frequencies stimulate the parasympathetic nervous system, triggering the body\'s natural repair mechanisms. Practitioners often report feeling warmth spreading through the chest — this is increased blood flow as tension releases from the cardiac region. Use this mantra when you are recovering, grieving, or simply exhausted. It does not bypass the pain; it holds you steady while you move through it.',
  'Protection': 'Fear lives in the body as chronic tension — clenched jaw, tight shoulders, shallow breath. This mantra addresses fear at its root by creating a vibrational field of stability around the practitioner. The deep tones ground the nervous system, activating the root and solar plexus energy centers. In practical terms, chant this before difficult conversations, when entering uncertain situations, or when anxiety makes the world feel unsafe. It reminds your body that you are held.',
  'Obstacle Removal': 'Every obstacle is also a teacher. This mantra does not promise that difficulties vanish — it rewires your relationship to them. The vibration stimulates the prefrontal cortex, the part of the brain responsible for creative problem-solving and perspective-taking. When you feel stuck in a loop of frustration, this mantra breaks the pattern. It is especially powerful at the start of new projects, transitions, or when procrastination has taken hold. The body responds by releasing the freeze response and restoring forward momentum.',
  'Wisdom': 'True wisdom is not information — it is the felt sense of knowing what matters. This mantra activates the third eye region and calms the default mode network of the brain, the part responsible for rumination and overthinking. As the mental chatter quiets, intuition surfaces. Use this when you are facing a decision that logic alone cannot resolve, when you need to trust yourself more deeply, or when the noise of other people\'s opinions has drowned out your own inner voice.',
  'Inner Wisdom': 'True wisdom is not information — it is the felt sense of knowing what matters. This mantra activates the third eye region and calms the default mode network of the brain, the part responsible for rumination and overthinking. As the mental chatter quiets, intuition surfaces. Use this when you are facing a decision that logic alone cannot resolve, when you need to trust yourself more deeply, or when the noise of other people\'s opinions has drowned out your own inner voice.',
  'Abundance': 'Scarcity is a nervous system state before it is a financial one. When the body is in survival mode, it cannot receive. This mantra works by shifting the body out of contraction and into expansion — the heart rate steadies, the breath deepens, and the hands literally open. Chant this not as a wish for more, but as a practice of remembering that you are already part of an abundant universe. It is especially powerful when financial anxiety, comparison, or feelings of not-enough have taken root.',
  'Prosperity': 'Scarcity is a nervous system state before it is a financial one. When the body is in survival mode, it cannot receive. This mantra works by shifting the body out of contraction and into expansion — the heart rate steadies, the breath deepens, and the hands literally open. Chant this not as a wish for more, but as a practice of remembering that you are already part of an abundant universe. It is especially powerful when financial anxiety, comparison, or feelings of not-enough have taken root.',
  'Love': 'Love is not just an emotion — it is a physiological state. When the heart is open, the body produces oxytocin, the vagus nerve fires in a pattern of connection, and the immune system strengthens. This mantra vibrates at the frequency of the heart center, literally massaging the cardiac region from the inside. Use it when you feel disconnected from others, when grief has closed you off, or when you want to deepen your capacity to give and receive love without armor.',
  'Unconditional Love': 'Love without conditions is the body\'s natural state when it feels safe. This mantra creates that safety internally. The vibration soothes the amygdala — the brain\'s fear center — and allows the heart to open without the usual protective walls. In daily life, this is for the moments when you catch yourself judging, withdrawing, or building walls. It does not make you naive; it makes you brave enough to love without guarantees.',
  'Compassion': 'Compassion begins in the body. When you witness suffering, your mirror neurons fire and your heart literally aches. This mantra channels that ache into action rather than overwhelm. It regulates the emotional flooding that can make empathy exhausting, and strengthens the neural pathways of care without burnout. Use this when you work with others\' pain, when you need to forgive someone who hurt you, or when you need to extend the same tenderness to yourself that you give so freely to others.',
  'Loving-Kindness': 'Compassion begins in the body. When you witness suffering, your mirror neurons fire and your heart literally aches. This mantra channels that ache into action rather than overwhelm. It regulates the emotional flooding that can make empathy exhausting, and strengthens the neural pathways of care without burnout. Chant this when the world feels heavy, when you need to soften toward yourself, or when you want to send genuine warmth to someone you struggle with.',
  'Peace': 'Peace is not the absence of conflict — it is the presence of regulation. This mantra activates the parasympathetic nervous system so deeply that practitioners often feel their heartbeat slow within the first few repetitions. The specific consonant sounds create a humming resonance in the chest cavity that physically calms the vagus nerve. Reach for this mantra during insomnia, after arguments, in moments of overwhelm, or whenever your body is running a program of hypervigilance that you are ready to release.',
  'Inner Peace': 'Peace is not the absence of conflict — it is the presence of regulation. This mantra activates the parasympathetic nervous system so deeply that practitioners often feel their heartbeat slow within the first few repetitions. The specific consonant sounds create a humming resonance in the chest cavity that physically calms the vagus nerve. Use this when the world outside is chaotic but you need to find stillness within.',
  'Strength': 'Real strength is not rigidity — it is the ability to stay soft and still stand. This mantra activates the solar plexus, the body\'s center of personal power, and stimulates the adrenal glands in a healthy, sustainable way. Unlike the adrenaline of panic, this is the steady fire of resolve. Use it when you are facing something that requires endurance — a difficult season, a hard conversation, a commitment you are tempted to abandon. It reminds the body that you have survived everything so far.',
  'Courage': 'Real strength is not rigidity — it is the ability to stay soft and still stand. This mantra activates the solar plexus, the body\'s center of personal power, and stimulates the adrenal glands in a healthy, sustainable way. Courage is not the absence of fear — it is action in the presence of fear. This vibration steadies the trembling and grounds you in your own backbone.',
  'Fearlessness': 'Fear is a signal, not a sentence. This mantra does not eliminate fear — it changes your relationship to it. The deep tonal vibrations activate the vagus nerve and signal to the amygdala that the threat is manageable. Your breath deepens, your shoulders drop, and the freeze response melts. Use this before public speaking, medical appointments, difficult conversations, or any moment where fear has been making decisions on your behalf.',
  'Transformation': 'Transformation is not comfortable — it is the death of who you were so that who you are becoming can emerge. This mantra supports the body through that process. Change activates the stress response, and this vibration soothes it, allowing the nervous system to stay regulated even as everything around you shifts. Use it during major life transitions — divorce, career change, relocation, loss — or whenever you feel the old version of yourself cracking open.',
  'Release': 'What we do not release, we carry. And the body keeps the score. This mantra works on the fascia, the connective tissue where emotional memory is stored. The vibration creates a subtle internal massage that helps the body let go of what the mind has been holding. Use this when you cannot stop replaying a conversation, when resentment has calcified into physical tension, or when you know it is time to put something down but your hands will not open.',
  'Liberation': 'Freedom is not a destination — it is a practice. This mantra dissolves the invisible chains of conditioning, expectation, and inherited belief that keep us small. The vibration works on the throat and crown, the energy centers of expression and connection to something larger. Use it when you feel trapped — by a relationship, a job, a pattern, or your own self-image. It does not tell you what to do next; it clears the space so you can hear your own answer.',
  'Freedom': 'Freedom is not a destination — it is a practice. This mantra dissolves the invisible chains of conditioning, expectation, and inherited belief that keep us small. The vibration works on the throat and crown, the energy centers of expression and connection to something larger.',
  'Forgiveness': 'Forgiveness is not for the other person — it is the moment you stop drinking the poison. This mantra works on the heart and liver, the organs that Traditional Chinese Medicine associates with anger and resentment. The vibration softens the hardened places, not by forcing anything, but by creating the conditions where letting go becomes possible. Use this when bitterness has become a habit, when you are ready to reclaim the energy you have been spending on someone who is not even in the room.',
  'Self-Forgiveness': 'The hardest person to forgive is always yourself. This mantra addresses the inner critic directly — the voice that replays your mistakes and insists you should have known better. The vibration soothes the shame response, which lives in the gut and the chest as a heavy, sinking feeling. Use this when guilt has become a permanent resident rather than a passing visitor, when you need to remember that growth requires making mistakes, and that you deserve the same grace you would give a friend.',
  'Gratitude': 'Gratitude is not toxic positivity — it is a neurological practice that physically rewires the brain. This mantra activates the reward centers and increases dopamine and serotonin production. The heart rate becomes more coherent, and the body shifts from deficit-scanning to appreciation. Use it in the morning to set the tone, or in difficult seasons when gratitude feels impossible — that is precisely when it is most powerful. Start with one true thing you are grateful for, and let the mantra expand it.',
  'Joy': 'Joy is your birthright, not a reward for good behavior. This mantra stimulates the release of endorphins and activates the brain\'s pleasure centers without the crash of external stimulation. The vibration lifts the chest, opens the face, and literally changes your posture. Use it when depression has flattened everything, when you have forgotten what delight feels like, or when you want to celebrate something without needing anyone else\'s permission.',
  'Bliss': 'Bliss is not happiness — it is the deep, quiet knowing that you are exactly where you need to be. This mantra accesses the state beyond pleasure and pain, where the nervous system is so deeply regulated that everything feels luminous. It is not escapism; it is presence at its most refined. Use this in meditation when you want to go deeper, or in daily life when you want to touch the sacred in the ordinary.',
  'Clarity': 'Mental fog is a nervous system response — when the body is overwhelmed, the brain conserves energy by reducing clarity. This mantra cuts through that fog by stimulating the prefrontal cortex and calming the amygdala simultaneously. The result is a state of alert calm where decisions become obvious and priorities sort themselves. Use it before important meetings, during creative blocks, or whenever you feel lost in the noise of too many options.',
  'Focus': 'Distraction is the modern epidemic. This mantra trains the attention the way a gym trains the body — through repetition. Each time the mind wanders and you return to the sound, you strengthen the neural pathways of concentration. The vibration also stimulates the pineal gland, associated with single-pointed awareness. Use it before deep work, study, or any task that requires your full presence. Over time, the focus you build on the mat follows you off it.',
  'Meditation': 'Meditation is not about stopping thoughts — it is about changing your relationship to them. This mantra gives the mind something beautiful to hold, so it stops grasping at everything else. The vibration slows brain waves from beta to alpha and eventually theta, the states associated with deep rest and insight. Use this as your anchor when sitting practice feels impossible, when the mind is especially wild, or when you want to go deeper than silence alone can take you.',
  'Devotion': 'Devotion is love with direction. This mantra opens the heart and focuses it — not on a person or outcome, but on the practice itself. The vibration creates a warmth in the chest that practitioners describe as being held from the inside. Use it when you feel spiritually dry, when practice has become mechanical, or when you want to remember why you started. Devotion is not about perfection; it is about showing up, again and again, with your whole heart.',
  'Surrender': 'Surrender is not giving up — it is giving over. It is the moment you stop white-knuckling life and let something larger carry you. This mantra relaxes the deep muscles of control — the jaw, the pelvic floor, the diaphragm — and allows the body to be held by gravity instead of fighting it. Use it when you have done everything you can and the outcome is not in your hands, when control has become exhausting, or when you are ready to trust the process.',
  'Trust': 'Trust is a body practice, not a belief. When the nervous system has been betrayed — by people, by circumstances, by life itself — it learns to brace. This mantra gently teaches the body that it is safe to soften again. The vibration works on the belly, where we hold our deepest fears about the future. Use it when hypervigilance has become your default, when you cannot relax even when everything is fine, or when you want to rebuild your relationship with uncertainty.',
  'Faith': 'Faith is not certainty — it is the willingness to take the next step without seeing the whole staircase. This mantra strengthens the heart\'s electromagnetic field, which research shows extends several feet beyond the body. When your field is strong, you move through the world differently — with more ease, more magnetism, more trust. Use it during dark nights of the soul, when doubt is louder than hope, or when you need to remember that you have been carried before.',
  'Consciousness': 'Consciousness is not something you achieve — it is what you already are, beneath the noise. This mantra strips away the layers of conditioning, habit, and reactivity to reveal the awareness that was always there. The vibration works on the crown of the head, creating a subtle tingling that practitioners associate with expanded perception. Use it when you feel asleep to your own life, when autopilot has taken over, or when you want to see the world with fresh eyes.',
  'Awareness': 'Awareness is the foundation of all change. You cannot transform what you cannot see. This mantra sharpens perception without adding judgment — it is the practice of witnessing your own thoughts, emotions, and sensations without getting swept away by them. The vibration calms the reactive mind and activates the observer. Use it when you are caught in a pattern you want to break, when emotions are running the show, or when you want to respond instead of react.',
  'Presence': 'Most of us live in the past or the future — rarely here. This mantra is an anchor to now. The vibration grounds the body through the feet and the base of the spine, activating the parasympathetic nervous system and slowing the time-traveling mind. Use it when anxiety about the future or regret about the past has stolen your attention, when you want to fully taste your food, hear your child, or feel the sun on your skin.',
  'Grounding': 'When life feels chaotic, the body loses its connection to the earth. Anxiety lives in the upper body — racing heart, tight throat, spinning thoughts. This mantra pulls energy downward, activating the legs, feet, and root. The vibration creates a sense of heaviness and stability that is deeply comforting. Use it during panic, after destabilizing news, during travel, or whenever you feel unmoored. It reminds you that you have a body, and that body is here.',
  'Stability': 'Stability is not rigidity — it is the deep root that allows the tree to bend without breaking. This mantra strengthens the energetic foundation, working on the base of the spine and the legs. The vibration creates a sense of unshakeable calm that does not depend on external circumstances. Use it during turbulent times, when everything around you is changing, or when you need to be the steady presence for others.',
  'Vitality': 'Vitality is not just energy — it is life force moving freely through the body without obstruction. This mantra clears the energy channels and stimulates the endocrine system, particularly the thyroid and adrenals. The vibration feels like a gentle electric current that wakes up dormant areas. Use it when fatigue has become chronic, when you are going through the motions without feeling alive, or when you want to remember what it feels like to be fully charged.',
  'Breath': 'The breath is the bridge between the conscious and unconscious mind. This mantra deepens and regulates the breath pattern, activating the diaphragm and expanding lung capacity. The vibration synchronizes the heartbeat with the breath, creating a state called cardiac coherence that is associated with optimal health and emotional resilience. Use it when anxiety has made your breath shallow, when you need to reset your nervous system quickly, or as a foundation for any other practice.',
  'Breath Practice': 'The breath is the bridge between the conscious and unconscious mind. This mantra deepens and regulates the breath pattern, activating the diaphragm and expanding lung capacity. Each syllable is timed to the natural rhythm of inhalation and exhalation, training the body to breathe more fully even when you are not practicing.',
  'Illumination': 'Illumination is the moment the light gets in — not from outside, but from within. This mantra activates the pineal gland and the visual cortex, creating an internal brightness that practitioners often see as light behind closed eyes. It is the mantra of insight, of sudden understanding, of seeing clearly what was hidden. Use it when you are in the dark — literally or metaphorically — and need to find your way.',
  'Transcendence': 'Transcendence is not escape — it is the expansion beyond the small self into something vast. This mantra works on the crown chakra, creating a sense of connection to the infinite that is both humbling and empowering. The vibration lifts consciousness beyond the personal story into universal awareness. Use it when you feel trapped in your own narrative, when suffering feels permanent, or when you want to touch the part of yourself that was never born and will never die.',
  'Oneness': 'Separation is the root illusion. This mantra dissolves the boundary between self and other, between inner and outer, between sacred and ordinary. The vibration harmonizes the left and right hemispheres of the brain, creating a state of integration that feels like coming home. Use it when loneliness has convinced you that you are separate, when conflict has created division, or when you want to remember that everything is connected.',
  'Unity': 'Separation is the root illusion. This mantra dissolves the boundary between self and other, creating a felt sense of belonging to the whole. The vibration harmonizes the left and right hemispheres of the brain, creating integration. Use it when division — internal or external — has become painful.',
  'Contentment': 'Contentment is not settling — it is the radical act of being enough, right now, as you are. This mantra soothes the restless seeking that keeps the nervous system in a constant state of wanting. The vibration works on the heart and belly, the places where dissatisfaction lives as a gnawing emptiness. Use it when the comparison trap has stolen your peace, when achievement has not brought the satisfaction you expected, or when you want to rest in what is rather than reaching for what is not.',
  'Self-Acceptance': 'Self-acceptance is the foundation everything else is built on. Without it, every achievement is hollow and every relationship is a performance. This mantra works on the deep shame patterns stored in the gut and the chest, gently dissolving the belief that you are fundamentally flawed. Use it when the inner critic is relentless, when you are hiding parts of yourself, or when you are ready to stop earning your own approval.',
  'Self-Love': 'Self-love is not narcissism — it is the basic maintenance your soul requires. This mantra fills the cup from the inside so you stop trying to fill it from the outside. The vibration works on the heart center, creating a warmth that feels like being held by someone who loves you completely. Use it when you have been giving too much, when boundaries feel impossible, or when you need to remember that you matter as much as everyone you take care of.',
  'Empowerment': 'Power is not domination — it is the full expression of who you are without apology. This mantra activates the solar plexus and the throat, the centers of personal authority and authentic expression. The vibration burns through the patterns of people-pleasing, self-diminishment, and playing small. Use it when you have been silencing yourself, when you need to take up space, or when you are ready to stop asking permission to be yourself.',
  'Renewal': 'Every ending contains a beginning. This mantra supports the body through the death-and-rebirth cycle that all growth requires. The vibration works on the cellular level, supporting the body\'s natural regeneration processes. Use it at the start of a new chapter, after a loss, during seasonal transitions, or whenever you need to shed an old skin and step into something new.',
  'New Beginnings': 'Every ending contains a beginning. This mantra supports the body through the death-and-rebirth cycle that all growth requires. The vibration activates the energy of dawn — fresh, clean, full of possibility. Use it on the first day of anything, or when you need to remember that it is never too late to start again.',
  'Rest': 'Rest is not laziness — it is the body\'s deepest form of productivity. This mantra activates the parasympathetic nervous system so completely that practitioners often fall into a state between waking and sleeping. The vibration works on the adrenals, which are often exhausted from chronic stress. Use it when you cannot sleep, when you feel guilty for resting, or when your body is begging you to stop and you keep pushing through.',
};

// Fallback explanation generator based on intention
function getDeepExplanation(mantra) {
  if (DEEP_EXPLANATIONS[mantra.intention]) {
    return DEEP_EXPLANATIONS[mantra.intention];
  }
  // Generate a grounded fallback based on the mantra's data
  return `This mantra carries the intention of ${mantra.intention.toLowerCase()}. ${mantra.context_note || ''} When chanted with presence, the vibration of these syllables works on the nervous system, creating a felt sense of ${mantra.intention.toLowerCase()} in the body. The repetition trains the mind to return to this quality again and again, until it becomes not just a practice but a way of being.`;
}

export default function Library() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mantras, setMantras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [expandedId, setExpandedId] = useState(null);
  const [playingId, setPlayingId] = useState(null);
  const audioRef = useRef(null);
  const searchTimeout = useRef(null);
  const isPlatinum = user?.subscription_tier === 'platinum';

  const fetchLibrary = useCallback(async (p = 1, cat = activeCategory, q = search) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: 15 });
      if (cat) params.set('category', cat);
      if (q) params.set('search', q);

      const res = await fetch(`/api/mantras/library?${params}`, { credentials: 'include' });
      if (res.status === 403) {
        setMantras([]);
        setLoading(false);
        return;
      }
      const data = await res.json();
      setMantras(data.mantras || []);
      setTotal(data.total || 0);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [activeCategory, search]);

  useEffect(() => {
    fetchLibrary(1, activeCategory, search);
  }, [activeCategory]);

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setPage(1);
      fetchLibrary(1, activeCategory, search);
    }, 400);
    return () => clearTimeout(searchTimeout.current);
  }, [search]);

  function handleCategoryClick(cat) {
    setActiveCategory(prev => prev === cat ? null : cat);
    setPage(1);
    setSearch('');
  }

  function handlePageChange(newPage) {
    setPage(newPage);
    fetchLibrary(newPage, activeCategory, search);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function toggleExpand(id) {
    setExpandedId(prev => prev === id ? null : id);
  }

  function playAudio(mantra) {
    if (playingId === mantra.id) {
      audioRef.current?.pause();
      audioRef.current = null;
      setPlayingId(null);
      return;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (!mantra.audio_url) return;
    const audio = new Audio(mantra.audio_url);
    audio.onended = () => { setPlayingId(null); audioRef.current = null; };
    audio.onerror = () => { setPlayingId(null); audioRef.current = null; };
    audioRef.current = audio;
    audio.play().then(() => setPlayingId(mantra.id)).catch(() => setPlayingId(null));
  }

  useEffect(() => {
    return () => { audioRef.current?.pause(); };
  }, []);

  async function toggleFavorite(mantraId, e) {
    e.stopPropagation();
    const res = await fetch(`/api/mantras/${mantraId}/favorite`, { method: 'POST', credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      setMantras(prev => prev.map(m => m.id === mantraId ? { ...m, is_favorited: data.favorited } : m));
    }
  }

  // Non-platinum gate
  if (!isPlatinum) {
    return (
      <div className="min-h-screen pt-safe px-4 py-6">
        <h1 className="font-serif text-2xl mb-6 text-center" style={{ color: '#FF13F0' }}>Mantra Library</h1>
        <div className="rounded-2xl p-8 text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-4xl mb-4">📚</div>
          <p className="font-serif text-lg mb-2" style={{ color: 'var(--text-primary)' }}>365 Sacred Mantras</p>
          <p className="font-sans text-sm mb-6 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Explore the full library of mantras across every tradition — with deep explanations of how each one works on your body, nervous system, and heart.
          </p>
          <button
            onClick={() => navigate('/settings/subscription')}
            className="px-6 py-3 rounded-xl font-sans text-sm font-semibold"
            style={{ background: 'linear-gradient(135deg, #b8860b, #d4a017)', color: '#fff', border: 'none', boxShadow: '0 4px 16px rgba(184,134,11,0.3)' }}
          >
            Unlock with Platinum
          </button>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(total / 15);

  return (
    <div className="min-h-screen pt-safe px-4 py-6 pb-24">
      {/* Header */}
      <div className="mb-5" style={{ paddingTop: '12px' }}>
        <h1 className="font-serif text-2xl text-center" style={{ color: '#FF13F0' }}>Mantra Library</h1>
        <p className="font-sans mt-1 text-center" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          {total} Mantras{activeCategory ? ` in ${activeCategory}` : ''}
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <MagnifyingGlass
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: 'var(--text-secondary)' }}
        />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search mantras, intentions, traditions..."
          className="w-full pl-10 pr-10 py-2.5 rounded-xl font-sans text-sm outline-none"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
          }}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--text-secondary)' }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 -mx-4 px-4 scrollbar-hide">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => handleCategoryClick(cat)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full whitespace-nowrap font-sans text-xs font-medium transition-all"
            style={{
              background: activeCategory === cat
                ? 'linear-gradient(135deg, #b8860b, #d4a017)'
                : 'var(--bg-card)',
              color: activeCategory === cat ? '#fff' : 'var(--text-secondary)',
              border: `1px solid ${activeCategory === cat ? 'transparent' : 'var(--border-color)'}`,
              boxShadow: activeCategory === cat ? '0 2px 8px rgba(184,134,11,0.25)' : 'none',
            }}
          >
            <span>{CATEGORY_ICONS[cat]}</span>
            <span>{cat}</span>
          </button>
        ))}
      </div>

      {/* Mantra cards */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="skeleton h-24 rounded-xl" />
          ))}
        </div>
      ) : mantras.length === 0 ? (
        <div className="text-center py-16">
          <p className="font-serif text-lg mb-2" style={{ color: 'var(--text-primary)' }}>No mantras found</p>
          <p className="font-sans text-sm" style={{ color: 'var(--text-secondary)' }}>
            Try a different search or category.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {mantras.map(mantra => {
            const isExpanded = expandedId === mantra.id;
            const isPlaying = playingId === mantra.id;

            return (
              <div
                key={mantra.id}
                className="rounded-xl overflow-hidden transition-all"
                style={{
                  background: 'var(--bg-card)',
                  border: `1px solid ${isExpanded ? 'var(--text-accent)' : 'var(--border-color)'}`,
                  boxShadow: isExpanded ? '0 4px 20px rgba(184,134,11,0.12)' : 'none',
                }}
              >
                {/* Card header — always visible */}
                <div
                  className="px-4 py-3.5 cursor-pointer"
                  onClick={() => toggleExpand(mantra.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p
                        className="font-serif text-base leading-snug mb-1"
                        style={{ color: '#6B2FA0', fontWeight: 600 }}
                      >
                        {mantra.transliteration}
                      </p>
                      <p className="font-sans text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {TRADITION_LABELS[mantra.tradition]} · {mantra.intention}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                      {mantra.audio_url && (
                        <button
                          onClick={(e) => { e.stopPropagation(); playAudio(mantra); }}
                          className="p-1.5 rounded-full"
                          style={{
                            background: isPlaying ? '#6B2FA0' : 'rgba(107,47,160,0.08)',
                            color: isPlaying ? '#fff' : '#6B2FA0',
                          }}
                        >
                          {isPlaying ? <Stop size={14} /> : <SpeakerHigh size={14} />}
                        </button>
                      )}
                      <button
                        onClick={(e) => toggleFavorite(mantra.id, e)}
                        className="p-1.5"
                        style={{ color: mantra.is_favorited ? '#e74c3c' : 'var(--text-secondary)' }}
                      >
                        <Heart size={16} weight={mantra.is_favorited ? 'fill' : 'regular'} />
                      </button>
                    </div>
                  </div>

                  {/* Translation preview */}
                  {!isExpanded && (
                    <p
                      className="font-sans text-sm mt-1.5 line-clamp-1"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {mantra.english_translation}
                    </p>
                  )}
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="px-4 pb-4 animate-slide-up">
                    {/* Full translation */}
                    <p
                      className="font-serif text-lg mb-2 leading-relaxed"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {mantra.english_translation}
                    </p>

                    {/* Original script */}
                    <p
                      className="text-center mb-4 text-xl"
                      style={{
                        fontFamily: mantra.tradition === 'sikh'
                          ? 'Noto Sans Gurmukhi, serif'
                          : 'Noto Sans Devanagari, serif',
                        color: '#6B2FA0',
                      }}
                    >
                      {mantra.original_script}
                    </p>

                    {/* Deep explanation */}
                    <div
                      className="rounded-lg p-4 mb-3"
                      style={{
                        background: 'rgba(107,47,160,0.04)',
                        border: '1px solid rgba(107,47,160,0.1)',
                      }}
                    >
                      <p
                        className="font-sans text-sm leading-relaxed"
                        style={{ color: '#3d2b1f' }}
                      >
                        {getDeepExplanation(mantra)}
                      </p>
                    </div>

                    {/* Phonetic guide */}
                    {mantra.phonetic_guide && (
                      <p className="font-sans text-xs mb-3 italic" style={{ color: 'var(--text-secondary)' }}>
                        Pronunciation: {mantra.phonetic_guide}
                      </p>
                    )}

                    {/* Action button */}
                    <button
                      onClick={() => navigate(`/mantra/${mantra.id}`)}
                      className="w-full py-2.5 rounded-lg font-sans text-sm font-semibold"
                      style={{
                        background: 'linear-gradient(135deg, #b8860b, #d4a017)',
                        color: '#fff',
                        border: 'none',
                      }}
                    >
                      Open & Chant
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1}
            className="px-4 py-2 rounded-lg font-sans text-sm disabled:opacity-30"
            style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
          >
            Previous
          </button>
          <span className="font-sans text-xs" style={{ color: 'var(--text-secondary)' }}>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= totalPages}
            className="px-4 py-2 rounded-lg font-sans text-sm disabled:opacity-30"
            style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

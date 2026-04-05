/**
 * Minute Mantra — Utility Functions
 */

/**
 * Get the day of year (1–365) for a given timezone.
 * Used to determine today's mantra client-side.
 */
export function getDayOfYear(timezone = Intl.DateTimeFormat().resolvedOptions().timeZone) {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
  });
  const parts = formatter.formatToParts(now);
  const month = parseInt(parts.find(p => p.type === 'month').value);
  const day = parseInt(parts.find(p => p.type === 'day').value);
  const year = parseInt(parts.find(p => p.type === 'year').value);
  const start = new Date(year, 0, 0);
  const date = new Date(year, month - 1, day);
  const diff = date - start;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/**
 * Format a tradition key into a human-readable display string.
 */
export function formatTradition(tradition) {
  const map = {
    vedic_shiva: 'Vedic / Shaivite',
    vedic_vishnu: 'Vedic / Vaishnava',
    vedic_shakti: 'Vedic / Shakta',
    vedic_ganesha: 'Vedic / Ganapatya',
    vedic_solar: 'Vedic / Saura',
    buddhist: 'Buddhist',
    sikh: 'Sikh / Gurbani',
    universal: 'Universal',
  };
  return map[tradition] || tradition;
}

/**
 * Format seconds into MM:SS display.
 */
export function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Increment session count in localStorage (for install prompt logic).
 */
export function incrementSessionCount() {
  const count = parseInt(localStorage.getItem('sessionCount') || '0');
  localStorage.setItem('sessionCount', String(count + 1));
  return count + 1;
}

/**
 * Get the CDN base URL.
 */
export const CDN_BASE = 'https://minute-mantra.b-cdn.net';

/**
 * Build a CDN URL for an asset path.
 */
export function cdnUrl(path) {
  return `${CDN_BASE}/${path.replace(/^\//, '')}`;
}

/**
 * Clamp a value between min and max.
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Debounce a function.
 */
export function debounce(fn, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        // Base sacred palette
        'deep-indigo': '#1a1a2e',
        'sacred-gold': '#b8860b',
        'warm-cream': '#faf3e0',
        'parchment': '#f5f0e1',
        'warm-amber': '#ff8f00',
        // Tradition palettes
        shiva: { primary: '#1a1a4e', secondary: '#c0c0d0', accent: '#a8d8ea' },
        vishnu: { primary: '#1e3a8a', secondary: '#d4a017', accent: '#faf3e0' },
        shakti: { primary: '#8b1a4a', secondary: '#c2185b', accent: '#f8bbd0' },
        ganesha: { primary: '#ff6f00', secondary: '#e64a19', accent: '#fff8e1' },
        solar: { primary: '#b8860b', secondary: '#ff8f00', accent: '#fff3cd' },
        buddhist: { primary: '#5d1a1a', secondary: '#c9920e', accent: '#d7ccc8' },
        sikh: { primary: '#0d47a1', secondary: '#ff6f00', accent: '#ffffff' },
        universal: { primary: '#4a6741', secondary: '#f5f0e1', accent: '#c9b458' },
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['DM Sans', 'Inter', 'system-ui', 'sans-serif'],
        devanagari: ['Noto Sans Devanagari', 'serif'],
        gurmukhi: ['Noto Sans Gurmukhi', 'serif'],
      },
      animation: {
        'flame-flicker': 'flicker 2s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'breathe-in': 'breatheIn 2.5s ease-in-out',
        'breathe-out': 'breatheOut 2.5s ease-in-out',
        'shimmer': 'shimmer 1.5s infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'heart-pop': 'heartPop 0.3s ease-out',
      },
      keyframes: {
        flicker: {
          '0%, 100%': { transform: 'scaleY(1) scaleX(1)', opacity: '1' },
          '25%': { transform: 'scaleY(1.05) scaleX(0.98)', opacity: '0.95' },
          '50%': { transform: 'scaleY(0.97) scaleX(1.02)', opacity: '1' },
          '75%': { transform: 'scaleY(1.03) scaleX(0.99)', opacity: '0.97' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(184, 134, 11, 0.3)' },
          '50%': { boxShadow: '0 0 25px rgba(184, 134, 11, 0.7)' },
        },
        breatheIn: {
          '0%': { transform: 'scale(0.7)', opacity: '0.5' },
          '100%': { transform: 'scale(1.2)', opacity: '1' },
        },
        breatheOut: {
          '0%': { transform: 'scale(1.2)', opacity: '1' },
          '100%': { transform: 'scale(0.7)', opacity: '0.5' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        heartPop: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.4)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
      },
    },
  },
  plugins: [],
};

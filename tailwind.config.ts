/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // BeatForge Design System
        forge: {
          // ─ Background layers (logo dark-navy scheme) ─
          bg:        '#14172a',
          surface:   '#1a1d2e',
          panel:     '#1e2235',
          border:    '#2a2d45',
          muted:     '#32365a',
          // ─ Brand gradient: cyan → purple (logo "BeatForge" text) ─
          accent:    '#8b5cf6',          // purple  ("Forge")
          'accent-light': '#a78bfa',
          'accent-dim':   '#3b1f8c',
          highlight: '#06b6d4',          // cyan    ("Beat")
          'highlight-light': '#22d3ee',
          // ─ Semantic ─
          success:   '#10b981',
          warning:   '#f59e0b',
          danger:    '#ef4444',
          beat:      '#f97316',
          // ─ Typography ─
          text:      '#e2e8f0',
          'text-muted': '#7c84a8',
          'text-dim':   '#3d4266',
          // ─ Glow (logo impact flash) ─
          glow:      '#ffffff',
        },
        // Track color palette
        track: {
          red:    '#ef4444',
          orange: '#f97316',
          amber:  '#f59e0b',
          yellow: '#eab308',
          lime:   '#84cc16',
          green:  '#22c55e',
          teal:   '#14b8a6',
          cyan:   '#06b6d4',
          blue:   '#3b82f6',
          indigo: '#6366f1',
          violet: '#8b5cf6',
          purple: '#a855f7',
          pink:   '#ec4899',
          rose:   '#f43f5e',
        },
      },
      fontFamily: {
        // Match logo typography — rounded modern sans + techy mono
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
        brand: ['Plus Jakarta Sans', 'Inter', 'sans-serif'], // "BeatForge" wordmark
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      spacing: {
        'track-h': '2.5rem',
        'ruler-h': '1.75rem',
        'mixer-strip': '3.5rem',
      },
      animation: {
        'pulse-beat': 'pulse-beat 0.5s ease-in-out',
        'meter-peak': 'meter-peak 0.1s ease-out',
        'slide-in-left': 'slide-in-left 0.2s ease-out',
        'slide-in-right': 'slide-in-right 0.2s ease-out',
        'fade-in': 'fade-in 0.15s ease-out',
      },
      keyframes: {
        'pulse-beat': {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.05)', opacity: '0.8' },
        },
        'meter-peak': {
          '0%': { opacity: '1' },
          '100%': { opacity: '0.3' },
        },
        'slide-in-left': {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(0)' },
        },
        'slide-in-right': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      backgroundImage: {
        'grid-pattern': `
          linear-gradient(rgba(139,92,246,0.06) 1px, transparent 1px),
          linear-gradient(90deg, rgba(6,182,212,0.04) 1px, transparent 1px)
        `,
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E\")",
      },
      boxShadow: {
        'glow-accent': '0 0 24px rgba(139,92,246,0.45)',
        'glow-highlight': '0 0 24px rgba(6,182,212,0.45)',
        'glow-success': '0 0 20px rgba(16,185,129,0.3)',
        'glow-impact': '0 0 40px rgba(255,255,255,0.6), 0 0 80px rgba(6,182,212,0.4)',
        'inner-dark': 'inset 0 2px 8px rgba(0,0,0,0.7)',
        'panel': '0 4px 32px rgba(10,10,20,0.7)',
        'panel-glow': '0 4px 32px rgba(10,10,20,0.7), 0 0 0 1px rgba(139,92,246,0.12)',
      },
      gridTemplateColumns: {
        'daw': '240px 1fr',
        'mixer': 'repeat(auto-fill, minmax(3.5rem, 1fr))',
      },
    },
  },
  plugins: [],
};

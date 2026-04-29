/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './App.tsx',
    './index.tsx',
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './layouts/**/*.{ts,tsx}',
    './context/**/*.{ts,tsx}',
    './services/**/*.{ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Manrope"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        serif: ['"Spectral"', 'serif'],
        display: ['"Sora"', '"Manrope"', 'sans-serif'],
        editor: ['var(--font-editor)'],
        mono: ['"Geist Mono"', 'monospace'],
      },
      fontSize: {
        /* App UI Fixed Scale (1.25 ratio) */
        'ui-xs': ['0.75rem', { lineHeight: '1.4' }],    /* 12px */
        'ui-sm': ['0.875rem', { lineHeight: '1.4' }],   /* 14px */
        'ui-base': ['1rem', { lineHeight: '1.5' }],     /* 16px */
        'ui-lg': ['1.25rem', { lineHeight: '1.3' }],    /* 20px */
        'ui-xl': ['1.563rem', { lineHeight: '1.2' }],   /* 25px */
        /* Marketing Fluid Scale */
        'mk-display': ['clamp(2.5rem, 5vw + 1rem, 4.5rem)', { lineHeight: '1.2', letterSpacing: '0' }],
        'mk-h1': ['clamp(2rem, 4vw + 1rem, 3.5rem)', { lineHeight: '1.2', letterSpacing: '0' }],
        'mk-h2': ['clamp(1.5rem, 3vw + 1rem, 2.5rem)', { lineHeight: '1.2', letterSpacing: '0' }],
        'mk-h3': ['clamp(1.25rem, 2vw + 1rem, 1.75rem)', { lineHeight: '1.3' }],
        'mk-body': ['clamp(1rem, 1vw + 0.875rem, 1.125rem)', { lineHeight: '1.6' }],
      },
      colors: {
        green: {
          DEFAULT: 'var(--green)',
          hover: 'var(--green-hover)',
          shadow: 'var(--green-shadow)',
        },
        blue: {
          DEFAULT: 'var(--blue)',
        },
        'dark-blue': {
          DEFAULT: 'var(--dark-blue)',
        },
        gray: {
          text: 'var(--gray-text)',
          light: 'var(--gray-light)',
          nav: 'var(--nav-text)',
        },
        border: 'var(--border-color)',
        red: 'var(--red)',
        orange: 'var(--orange)',
        golden: 'var(--golden)',
        sky: 'var(--sky)',
        honey: 'var(--honey)',
        clay: 'var(--clay)',
        surface: 'var(--panel-bg)',
        white: 'rgb(var(--panel-bg-rgb) / <alpha-value>)',
        black: 'rgb(var(--black-rgb) / <alpha-value>)',
        /* Semantic Tokens */
        'surface-muted': 'var(--color-surface-muted)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'border-soft': 'var(--color-border-soft)',
        accent: {
          DEFAULT: 'var(--color-accent)',
          soft: 'var(--color-accent-soft)',
        },
        mood: {
          happy: 'var(--color-mood-happy)',
          calm: 'var(--color-mood-calm)',
          anxious: 'var(--color-mood-anxious)',
          sad: 'var(--color-mood-sad)',
          angry: 'var(--color-mood-angry)',
          tired: 'var(--color-mood-tired)',
        },
      },
      backgroundColor: {
        body: 'var(--bg-color)',
        surface: 'var(--panel-bg)',
      },
      spacing: {
        'space-05': 'var(--space-05)',
        'space-1': 'var(--space-1)',
        'space-2': 'var(--space-2)',
        'space-3': 'var(--space-3)',
        'space-4': 'var(--space-4)',
        'space-5': 'var(--space-5)',
        'space-6': 'var(--space-6)',
        'space-8': 'var(--space-8)',
        'space-10': 'var(--space-10)',
        'space-12': 'var(--space-12)',
        'space-16': 'var(--space-16)',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/container-queries'),
  ],
};

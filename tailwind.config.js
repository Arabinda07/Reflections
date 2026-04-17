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
        sans: ['"Schibsted Grotesk"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        serif: ['"Spectral"', 'serif'],
        display: ['"Feather Bold"', '"Schibsted Grotesk"', 'sans-serif'],
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
        white: 'rgb(var(--panel-bg-rgb) / <alpha-value>)',
        black: 'var(--gray-text)',
      },
      backgroundColor: {
        body: 'var(--bg-color)',
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
        'out-quart': 'cubic-bezier(0.25, 1, 0.5, 1)',
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'out-quint': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/container-queries'),
  ],
};

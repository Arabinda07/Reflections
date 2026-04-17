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
        white: 'rgba(var(--panel-bg-rgb), <alpha-value>)',
        black: 'var(--gray-text)',
      },
      backgroundColor: {
        white: 'rgba(var(--panel-bg-rgb), <alpha-value>)',
        body: 'var(--bg-color)',
      },
      transitionTimingFunction: {
        'out-quart': 'cubic-bezier(0.25, 1, 0.5, 1)',
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'out-quint': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
};

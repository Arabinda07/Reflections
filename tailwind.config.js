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
        sans: ['Nunito', 'DIN Round Pro', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['Feather Bold', 'Nunito', 'sans-serif'],
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
      boxShadow: {
        '3d-green': '0 4px 0 0 var(--green-shadow)',
        '3d-gray': '0 4px 0 0 var(--border-color)',
        '3d-blue': '0 4px 0 0 var(--blue-shadow)',
        '3d-red': '0 4px 0 0 var(--red-shadow)',
      },
    },
  },
  plugins: [],
};

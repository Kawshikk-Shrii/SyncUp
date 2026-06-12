/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mint: {
          50:  '#f5f8ec',
          100: '#e7f2d2',
          200: '#d5ebb5',
          300: '#bce18f',
          400: '#a5d874',
          500: '#93D365',
          DEFAULT: '#93D365',
        },
        hero: '#F7ECDD',
        dark: '#1E2430',
        muted: '#5F6673',
        light: '#F8EEDF',
        card: '#FFF9F0',
        badge: '#F3DFC6',
        blue: '#6EA8FE',
        coral: '#EB5A5A',
        yellow: '#F6B93B',
        lavender: '#B59CFF',
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        heading: ['Cormorant Garamond', 'Georgia', 'serif'],
      },
      borderRadius: {
        pill: '9999px',
        xl2: '1.25rem',
        xl3: '1.5rem',
      },
      boxShadow: {
        card: '0 18px 45px rgba(31, 41, 55, 0.08)',
        'card-hover': '0 26px 60px rgba(31, 41, 55, 0.13)',
      },
      animation: {
        'fade-up': 'fadeUp 0.5s ease-out forwards',
        'float': 'float 4s ease-in-out infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}

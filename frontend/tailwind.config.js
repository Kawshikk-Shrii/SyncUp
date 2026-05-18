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
          50:  '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#6eea9a',
          500: '#5ce88a',   // brand mint (hero bg)
          DEFAULT: '#6ee89a',
        },
        hero: '#6ee89a',       // main hero/navbar background
        dark: '#1a2e1a',       // primary dark text + CTA bg
        muted: '#3d5a3d',      // secondary text
        light: '#f5f5f0',      // off-white body background
        card: '#c8f5d8',       // feature card background
        badge: '#e8f8ee',      // pill badge background
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        heading: ['Sora', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        pill: '9999px',
        xl2: '1.25rem',
        xl3: '1.5rem',
      },
      boxShadow: {
        card: '0 2px 16px 0 rgba(26,46,26,0.08)',
        'card-hover': '0 8px 32px 0 rgba(26,46,26,0.14)',
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

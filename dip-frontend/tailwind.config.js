/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        federal: {
          900: 'rgb(var(--color-federal-900) / <alpha-value>)',
          800: 'rgb(var(--color-federal-800) / <alpha-value>)',
          700: 'rgb(var(--color-federal-700) / <alpha-value>)',
          600: 'rgb(var(--color-federal-600) / <alpha-value>)',
          500: 'rgb(var(--color-federal-500) / <alpha-value>)',
          400: 'rgb(var(--color-federal-400) / <alpha-value>)',
          accent: 'rgb(var(--color-federal-accent) / <alpha-value>)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'grid-pattern': "linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)",
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.8s ease-out forwards',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}

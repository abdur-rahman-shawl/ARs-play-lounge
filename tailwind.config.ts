import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './styles/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-lexend)', 'system-ui', 'sans-serif'],
      },
      colors: {
        backdrop: '#040510',
        accent: {
          default: '#4f46e5',
          glow: '#8b5cf6',
          neon: '#22d3ee',
        },
      },
      boxShadow: {
        glow: '0 0 25px rgba(34, 211, 238, 0.35)',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(139, 92, 246, 0.35)' },
          '50%': { boxShadow: '0 0 25px rgba(34, 211, 238, 0.6)' },
        },
        spinSlow: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        pulseGlow: 'pulseGlow 2.8s ease-in-out infinite',
        spinSlow: 'spinSlow 6s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;

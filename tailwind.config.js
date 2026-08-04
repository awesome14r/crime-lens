/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        void: {
          950: '#0b0f19',
          900: '#0e1420',
          800: '#131b29',
          700: '#1a2436',
          600: '#243247',
          500: '#334257'
        },
        signal: {
          cyan: '#3fd0ff',
          amber: '#f5a623',
          crimson: '#ff5470',
          violet: '#b98bff',
          jade: '#2fe6a7'
        }
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        body: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace']
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(63,208,255,0.15), 0 0 24px rgba(63,208,255,0.12)',
        'glow-amber': '0 0 0 1px rgba(245,166,35,0.2), 0 0 20px rgba(245,166,35,0.15)',
        'glow-crimson': '0 0 0 1px rgba(255,84,112,0.2), 0 0 20px rgba(255,84,112,0.15)'
      },
      backgroundImage: {
        grid: 'linear-gradient(rgba(63,208,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(63,208,255,0.05) 1px, transparent 1px)'
      },
      backgroundSize: {
        grid: '28px 28px'
      },
      animation: {
        scan: 'scan 3.5s linear infinite',
        pulseSlow: 'pulseSlow 2.4s ease-in-out infinite'
      },
      keyframes: {
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' }
        },
        pulseSlow: {
          '0%, 100%': { opacity: 0.55 },
          '50%': { opacity: 1 }
        }
      }
    }
  },
  plugins: []
}

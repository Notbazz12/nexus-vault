/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        nexus: {
          950: '#07090E', // Deep background
          900: '#0B0E14', // Canvas background
          850: '#11151E', // Elevated container
          800: '#171C28', // Card background
          750: '#1F2636', // Card border / hover
          700: '#2A3347', // Muted border
          600: '#414D66',
          500: '#64748B',
          400: '#94A3B8',
          300: '#CBD5E1',
          200: '#E2E8F0',
          100: '#F1F5F9',
        },
        cyan: {
          accent: '#00F0FF',
          glow: 'rgba(0, 240, 255, 0.15)',
        },
        electric: {
          blue: '#0072FF',
          glow: 'rgba(0, 114, 255, 0.2)',
        },
        cyber: {
          green: '#10B981',
          amber: '#F59E0B',
          red: '#F43F5E',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'Courier New', 'monospace'],
      },
      boxShadow: {
        'cyber-cyan': '0 0 25px -5px rgba(0, 240, 255, 0.25)',
        'cyber-blue': '0 0 25px -5px rgba(0, 114, 255, 0.3)',
        'cyber-card': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
    },
  },
  plugins: [],
}

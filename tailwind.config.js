/** @type {import('tailwindcss').Config} */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;
const scale = [950, 900, 850, 800, 750, 700, 650, 600, 500, 400, 300, 200, 100];

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Semantic ramp, values live in src/styles/globals.css (light in :root, dark in .dark).
        // 950 = page ground ... 100 = primary text, in both themes.
        nexus: Object.fromEntries(scale.map((s) => [s, token(`nexus-${s}`)])),
        cyan: {
          accent: token('accent'),
        },
        electric: {
          blue: token('accent-strong'),
        },
        rail: {
          DEFAULT: token('rail'),
          ink: token('rail-ink'),
        },
        cyber: {
          green: token('ok'),
          amber: token('warn'),
          red: token('danger'),
        }
      },
      fontFamily: {
        sans: ['"Segoe UI Variable Text"', '"Segoe UI"', 'system-ui', '-apple-system', 'Ubuntu', 'Cantarell', 'sans-serif'],
        mono: ['"Cascadia Mono"', 'Consolas', '"DejaVu Sans Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        // Kept names so existing views compile; all are now soft offset shadows.
        'cyber-cyan': '0 2px 6px -1px rgb(var(--accent) / 0.35)',
        'cyber-blue': '0 2px 6px -1px rgb(var(--accent-strong) / 0.35)',
        'cyber-card': '0 1px 2px rgb(0 0 0 / 0.04), 0 4px 12px -2px rgb(0 0 0 / 0.08)',
      },
    },
  },
  plugins: [],
}

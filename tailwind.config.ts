import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'serif': ['"Playfair Display"', 'Georgia', 'serif'],
        'body': ['"Lora"', 'Georgia', 'serif'],
        // Marca 2026: usada en Home, Carta y Reservas. El admin sigue con serif/body de arriba.
        'display': ['var(--font-display)', 'system-ui', 'sans-serif'],
      },
      colors: {
        esperanza: {
          50: '#f5f7fb',
          100: '#e8ecf5',
          200: '#d4dde8',
          300: '#b8c7da',
          400: '#8fa8c9',
          500: '#1a3a52',
          600: '#152d42',
          700: '#0f2235',
          800: '#0a1820',
          900: '#050c10',
        },
        accent: {
          red: '#8b3a3a',
          gold: '#d4af37',
        },
        // Paleta 2026 (marca 2026: Home, Carta, Reservas)
        night: {
          DEFAULT: '#0e0d0b',
          2: '#161210',
          3: '#1f1a16',
        },
        sand: {
          DEFAULT: '#f6f1e7',
          dim: '#a89e8c',
          faint: '#6f6858',
        },
        brand: {
          gold: '#c9a961',
          amber: '#d9a233',
        },
      },
    },
  },
  plugins: [],
}
export default config

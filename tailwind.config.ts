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
        // Paleta del panel de admin (solo se usa en /admin). Tonos cálidos
        // alineados a la marca 2026: 50-400 papel/bordes, 500-600 bronce
        // (links/acentos), 700-900 tinta/noche (títulos, botón primario, header).
        esperanza: {
          50: '#faf6ef',
          100: '#f1eadd',
          200: '#e4d9c6',
          300: '#cdbb9c',
          400: '#b0915c',
          500: '#8c6d36',
          600: '#6f5528',
          700: '#1c1814',
          800: '#141110',
          900: '#0e0d0b',
        },
        paper: '#f4efe6',
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

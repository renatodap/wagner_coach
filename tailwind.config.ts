import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'wagner': {
          'black': '#0A0A0B',
          'orange': '#FF4500',
          'white': '#FFFFFF',
          'gray': '#4A4A4A',
          'steel': '#2C3E50',
          'gold': '#FFD700',
          'red': '#DC143C',
        }
      },
      fontFamily: {
        'heading': ['var(--font-bebas)', 'sans-serif'],
        'body': ['var(--font-inter)', 'sans-serif'],
        'mono': ['var(--font-jetbrains)', 'monospace'],
      },
      animation: {
        'barbell-spin': 'spin 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-brutal': 'pulse-brutal 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'pulse-brutal': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
      backgroundImage: {
        'concrete-texture': 'url("/textures/concrete.png")',
      },
    },
  },
  plugins: [],
};

export default config;
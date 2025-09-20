import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        iron: {
          black: '#0A0A0B',
          orange: '#FF4500',
          white: '#FFFFFF',
          gray: '#4A4A4A',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Bebas Neue', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
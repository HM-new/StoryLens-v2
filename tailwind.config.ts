import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        kalam: ['Kalam', 'cursive'],
        caveat: ['Caveat', 'cursive'],
        comic: ['"Comic Neue"', 'cursive'],
      },
      colors: {
        navy: '#1B2A4A',
        amber: '#F59E0B',
        cream: '#FAF7F2',
        terracotta: '#E07A5F',
        teal: '#0891B2',
        rose: '#FB7185',
        coral: '#FF6B6B',
        green: '#22C55E',
        pink: '#EC4899',
        slate: '#475569',
      },
    },
  },
  plugins: [],
} satisfies Config;

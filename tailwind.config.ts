import type { Config } from 'tailwindcss'

/**
 * Colours are NOT defined here. They are CSS custom properties written at runtime
 * by src/theme.ts from funnel.config, so changing the brand never touches this file.
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: 'hsl(var(--card))',
        muted: 'hsl(var(--muted))',
        border: 'hsl(var(--border))',
        primary: 'hsl(var(--primary))',
        accent: 'hsl(var(--accent))',
      },
    },
  },
  plugins: [],
} satisfies Config

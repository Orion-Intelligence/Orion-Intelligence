import type { Config } from 'tailwindcss'

export default {
  content: ['./src/app/pages/social-mapper/**/*.{html,ts}'],
  important: true,
  theme: { extend: {} },
  plugins: [],
} satisfies Config

import type { Config } from 'tailwindcss'

export default {
  content: ['./src/app/pages/social-graph/**/*.{html,ts}', './src/app/pages/graphs/**/*.{html,ts}'],
  important: true,
  theme: { extend: {} },
  plugins: [],
} satisfies Config

import type { Config } from 'tailwindcss'

export default {
  content: ['./src/app/pages/social-graph/**/*.{html,ts}', './src/app/pages/graphs/**/*.{html,ts}', './src/app/shared/partials/support/**/*.{html,ts}'],
  important: true,
  theme: { extend: {} },
  plugins: [],
} satisfies Config

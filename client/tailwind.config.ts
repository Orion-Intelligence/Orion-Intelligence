import type { Config } from 'tailwindcss';
export default {
    content: ['./src/**/*.{html,ts}'],
    important: true,
    theme: {
        extend: {
            animation: {
                'tour-loader-spin': 'tour-loader-spin 0.8s linear infinite',
                'tour-spotlight-reveal': 'tour-spotlight-reveal 140ms ease-out',
            },
            keyframes: {
                'tour-loader-spin': {
                    from: { transform: 'rotate(0deg)' },
                    to: { transform: 'rotate(360deg)' },
                },
                'tour-spotlight-reveal': {
                    from: { opacity: '0%' },
                    to: { opacity: '100%' },
                },
            },
        },
    },
    plugins: [],
} satisfies Config;

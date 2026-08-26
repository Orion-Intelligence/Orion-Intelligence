import type { Config } from 'tailwindcss';
export default {
    content: ['./src/**/*.{html,ts}'],
    safelist: ['animate-loader-indeterminate'],
    important: true,
    theme: {
        extend: {
            animation: {
                'ai-chat-dropdown-above-in': 'ai-chat-dropdown-above-in 160ms cubic-bezier(0.16, 1, 0.3, 1) both',
                'ai-chat-progress-sweep': 'ai-chat-progress-sweep 1s linear infinite',
                'ai-chat-row-in': 'ai-chat-row-in 180ms ease-out',
                'alert-card-stagger-in': 'alert-card-stagger-in 260ms ease both',
                'consolidated-scan-pulse': 'consolidated-scan-pulse 1.2s ease-in-out infinite',
                'consolidated-scan-stripe': 'consolidated-scan-stripe 900ms linear infinite',
                'loader-indeterminate': 'loader-indeterminate 1.5s linear infinite',
                'notif-stagger-in': 'notif-stagger-in 260ms ease both',
                'social-feed-card-in': 'social-feed-card-in 190ms ease-out both',
                'social-profile-overview-in': 'social-profile-overview-in 180ms ease-out both',
                'social-sidebar-platform-row-in': 'social-sidebar-platform-row-in 420ms cubic-bezier(0.16, 1, 0.3, 1) both',
                'tour-loader-spin': 'tour-loader-spin 0.8s linear infinite',
                'tour-spotlight-reveal': 'tour-spotlight-reveal 140ms ease-out',
            },
            keyframes: {
                'ai-chat-dropdown-above-in': {
                    '0%': {
                        opacity: 'var(--ui-opacity-hidden)',
                        transform: 'translate3d(0, 6px, 0) scale(0.98)',
                    },
                    '100%': {
                        opacity: '100%',
                        transform: 'translate3d(0, 0, 0) scale(1)',
                    },
                },
                'ai-chat-progress-sweep': {
                    '0%': {
                        opacity: 'var(--ui-opacity-hidden)',
                        transform: 'translate3d(-120%, 0, 0)',
                    },
                    '8%': { opacity: '100%' },
                    '92%': { opacity: '100%' },
                    '100%': {
                        opacity: 'var(--ui-opacity-hidden)',
                        transform: 'translate3d(310%, 0, 0)',
                    },
                },
                'ai-chat-row-in': {
                    from: {
                        opacity: 'var(--ui-opacity-hidden)',
                        transform: 'translateY(8px)',
                    },
                    to: {
                        opacity: '100%',
                        transform: 'translateY(0)',
                    },
                },
                'alert-card-stagger-in': {
                    from: { opacity: '0%', transform: 'translateY(10px)' },
                    to: { opacity: '100%', transform: 'translateY(0)' },
                },
                'consolidated-scan-pulse': {
                    '0%, 100%': {
                        opacity: '45%',
                        transform: 'scale(.88)',
                    },
                    '50%': {
                        opacity: '100%',
                        transform: 'scale(1)',
                    },
                },
                'consolidated-scan-stripe': {
                    '0%': { backgroundPosition: '0 0' },
                    '100%': { backgroundPosition: '32px 0' },
                },
                'loader-indeterminate': {
                    '0%': {
                        opacity: '80%',
                        transform: 'translateX(0) scaleX(0.05)',
                    },
                    '25%': {
                        opacity: '100%',
                        transform: 'translateX(25%) scaleX(0.3)',
                    },
                    '50%': {
                        opacity: '100%',
                        transform: 'translateX(50%) scaleX(0.6)',
                    },
                    '75%': {
                        opacity: '100%',
                        transform: 'translateX(75%) scaleX(0.3)',
                    },
                    '100%': {
                        opacity: '50%',
                        transform: 'translateX(100%) scaleX(0.1)',
                    },
                },
                'notif-stagger-in': {
                    from: { opacity: '0%', transform: 'translateY(8px)' },
                    to: { opacity: '100%', transform: 'translateY(0)' },
                },
                'social-feed-card-in': {
                    '0%': {
                        opacity: 'var(--ui-opacity-hidden)',
                        transform: 'translate3d(0, -6px, 0) scale(0.994)',
                    },
                    '100%': {
                        opacity: '100%',
                        transform: 'translate3d(0, 0, 0) scale(1)',
                    },
                },
                'social-profile-overview-in': {
                    '0%': {
                        opacity: 'var(--ui-opacity-hidden)',
                        transform: 'translate3d(0, 8px, 0) scale(0.992)',
                    },
                    '100%': {
                        opacity: '100%',
                        transform: 'translate3d(0, 0, 0) scale(1)',
                    },
                },
                'social-sidebar-platform-row-in': {
                    '0%': {
                        filter: 'blur(3px)',
                        opacity: 'var(--ui-opacity-hidden)',
                        transform: 'translate3d(-10px, 8px, 0) scale(0.98)',
                    },
                    '100%': {
                        filter: 'blur(0)',
                        opacity: '100%',
                        transform: 'translate3d(0, 0, 0) scale(1)',
                    },
                },
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

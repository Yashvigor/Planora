/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        fontFamily: {
            sans: ['Inter', 'sans-serif'],
            serif: ['Playfair Display', 'serif'],
        },
        colors: {
            // Preserving existing 'enola' for backward compatibility but adding 'planora'
            enola: {
                beige: '#ECE5DD',
                sand: '#D8CFC4',
                taupe: '#B8AFA5',
                brown: '#8C7B70',
                'dark-brown': '#5D4037',
                cream: '#F9F7F2',
            },
            planora: {
                cream: '#F5F2EB',    // Main Background
                beige: '#E6DDD0',    // Secondary Background
                sand: '#D4C5B5',     // Borders / Accents
                terracotta: '#A65D3B', // Primary Action / Highlight
                clay: '#8C7060',     // Secondary Text
                cocoa: '#5D4037',     // Dark Accents
                charcoal: '#2C2420', // Main Text
                black: '#1A1614',    // Deep headers
            }
        },
        animation: {
            'fade-in': 'fadeIn 0.5s ease-out',
            'slide-up': 'slideUp 0.5s ease-out',
        },
        keyframes: {
            fadeIn: {
                '0%': { opacity: '0' },
                '100%': { opacity: '1' },
            },
            slideUp: {
                '0%': { transform: 'translateY(20px)', opacity: '0' },
                '100%': { transform: 'translateY(0)', opacity: '1' },
            },
        },
    },
    plugins: [],
}

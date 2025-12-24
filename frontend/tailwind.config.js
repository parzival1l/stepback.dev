/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'claude': {
                    'primary': '#c15f3c',      // Reddish-brown/burnt orange
                    'secondary': '#b1ada1',    // Light greyish-brown/taupe
                    'light': '#f4f3ee',         // Very light off-white/cream
                    'white': '#ffffff',         // Pure white
                },
            },
            fontFamily: {
                'serif': ['Anthropic Serif', 'Lora', 'Georgia', 'serif'],
                'sans': ['Anthropic Serif', 'Lora', 'Georgia', 'serif'],
            },
        },
    },
    plugins: [],
}

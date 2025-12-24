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
                    'primary': 'var(--claude-primary)',
                    'secondary': 'var(--claude-secondary)',
                    'light': 'var(--claude-light)',
                    'white': 'var(--claude-white)',
                    'text': 'var(--claude-text)',
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

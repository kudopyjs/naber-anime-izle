/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#06f9f9',
        'primary-magenta': '#FF00FF',
        'background-light': '#f5f8f8',
        'background-dark': '#0d0d0f',
        'card-dark': '#1b2727',
        'cyan-glow': '#00FFFF',
        'magenta-glow': '#FF00FF',
      },
      fontFamily: {
        display: ['Poppins', 'Inter', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        lg: '1rem',
        xl: '1.5rem',
      },
      boxShadow: {
        'neon-cyan': '0 0 15px rgba(6, 249, 249, 0.3), 0 0 5px rgba(6, 249, 249, 0.2)',
        'neon-magenta': '0 0 15px rgba(255, 0, 255, 0.3), 0 0 5px rgba(255, 0, 255, 0.2)',
        'glow-cyan': '0 0 15px 5px rgba(6, 249, 249, 0.3)',
        'glow-magenta': '0 0 15px 5px rgba(255, 0, 255, 0.3)',
      },
    },
  },
  plugins: [],
}

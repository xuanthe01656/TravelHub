/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./client/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#007bff',
        secondary: '#27ae60',
        error: '#e74c3c',
        blue: {
          ...require('tailwindcss/colors').blue,
          400: '#4facfe',
        },
        purple: {
          ...require('tailwindcss/colors').purple,
          300: '#e1c6f7',
        },
      },
      boxShadow: {
        card: '0 6px 20px rgba(0, 0, 0, 0.1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0, transform: 'translateY(20px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.5s ease-in-out',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}

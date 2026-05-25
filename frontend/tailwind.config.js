/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#00f5d4',
        dark: '#0a0f1e',
        card: '#111827',
      }
    },
  },
  plugins: [],
}
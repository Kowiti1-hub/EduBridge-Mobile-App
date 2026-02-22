/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./App.tsx",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        whatsapp: {
          green: '#075e54',
          light: '#25d366',
          teal: '#128c7e',
          bg: '#e5ddd5',
          bubble: {
            sent: '#dcf8c6',
            received: '#ffffff'
          }
        }
      }
    },
  },
  plugins: [],
}

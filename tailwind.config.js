/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      // Brand colors live here — change them in one place. (03-design.md)
      colors: {
        brand: "#000080",   // Chindamanee primary
        accent: "#FFD700",  // Chindamanee accent
      },
      fontFamily: {
        // Inter for Latin, Noto Sans Thai for Thai, then system fallback.
        sans: ['Inter', '"Noto Sans Thai"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

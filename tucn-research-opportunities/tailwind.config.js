/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,css}",
  ],
  theme: {
    extend: {
      colors: {
        'utcn-red': '#BB181D',
        'utcn-light-red': '#D94A4F'
      },
    },
  },
  plugins: [],
}

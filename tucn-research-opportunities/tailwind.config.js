/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,css}",
  ],
  theme: {
    extend: {
      colors: {
        'utcn-red':          '#BB181D',
        'utcn-light-red':    '#D94A4F',
        'utcn-primary':      '#18181b',
        'utcn-primary-dark': '#000000',
        'utcn-navy':         '#0b0b0d',
        'utcn-navy-light':   '#26262b',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
        display: ['Newsreader', 'ui-serif', 'Georgia', 'Cambria', '"Times New Roman"', 'serif'],
      },
    },
  },
  plugins: [],
}

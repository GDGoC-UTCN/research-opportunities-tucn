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
        'utcn-primary':      '#1664d3',
        'utcn-primary-dark': '#1255b5',
        'utcn-navy':         '#0c2461',
        'utcn-navy-light':   '#1a3a7c',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

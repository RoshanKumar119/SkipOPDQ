/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // SkipOPDQ brand colours
        primary: {
          50: '#E7F5F4',
          100: '#C8E9E7',
          200: '#93D3CF',
          300: '#5DBDB7',
          400: '#2E9F99',
          500: '#0B7A75',
          600: '#09665F',
          700: '#07514C',
          800: '#053D39',
          900: '#032826',
        },
        coral: {
          50: '#FEF0EE',
          100: '#FDDCD8',
          400: '#F5887B',
          500: '#F26B5B',
          600: '#D9503F',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        forest: {
          50:  '#f0f7f4',
          100: '#dcede5',
          200: '#bbdacc',
          300: '#8dc0ab',
          400: '#5ba086',
          500: '#3a846b',
          600: '#2b6a56',
          700: '#245547',
          800: '#1e443a',
          900: '#1a3930',
          950: '#0d201b',
        }
      },
      fontFamily: {
        sans: ['"Noto Sans KR"', 'sans-serif'],
      },
      screens: {
        xs: '375px',
      }
    }
  },
  plugins: []
}

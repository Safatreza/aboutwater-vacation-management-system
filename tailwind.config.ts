import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'aboutwater': {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#1c5975',
          700: '#164962',
          800: '#2a7da2',
          900: '#0c4a6e',
          DEFAULT: '#1c5975',
          primary: '#1c5975',
          'primary-dark': '#164962',
          'primary-light': '#2a7da2',
          secondary: '#e0f2fe',
          accent: '#0ea5e9'
        }
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'inter': ['Inter', 'sans-serif'],
        'asap': ['Inter', 'sans-serif'] // Fallback for existing asap classes
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms')
  ],
}
export default config

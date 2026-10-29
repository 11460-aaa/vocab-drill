/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#fbfaf6',
          100: '#f5f2ea',
          200: '#ebe5d8',
          300: '#ddd4c3',
        },
        ink: {
          950: '#14201c',
          900: '#1c2a25',
          800: '#2a3a34',
          700: '#40534c',
          600: '#52645b',
          500: '#5f7269',
          400: '#66776f',
          300: '#9ca9a2',
        },
        moss: {
          50: '#eff7f2',
          100: '#dceee3',
          200: '#beddcb',
          300: '#8fc4a6',
          400: '#5ea680',
          500: '#368a61',
          600: '#256e4c',
          700: '#1d573d',
          800: '#194532',
          900: '#15392b',
        },
        papaya: {
          50: '#fff8ed',
          100: '#ffefd2',
          300: '#f8c777',
          500: '#e59a33',
          700: '#ac681d',
        },
        coral: {
          50: '#fff3f1',
          100: '#ffe2dd',
          500: '#d95d4d',
          600: '#bd4739',
          700: '#9c3a2f',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '"Noto Sans SC"',
          '"PingFang SC"',
          '"Hiragino Sans GB"',
          '"Microsoft YaHei"',
          'system-ui',
          'sans-serif',
        ],
        display: ['Georgia', '"Times New Roman"', '"Songti SC"', 'serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(28, 42, 37, 0.04), 0 18px 45px -28px rgba(28, 42, 37, 0.28)',
        lift: '0 2px 4px rgba(28, 42, 37, 0.04), 0 24px 60px -30px rgba(28, 42, 37, 0.35)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.97) translateY(6px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-4px)' },
          '40%, 80%': { transform: 'translateX(4px)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.35s ease-out both',
        'pop-in': 'pop-in 0.22s ease-out both',
        shake: 'shake 0.35s ease-in-out',
      },
    },
  },
  plugins: [],
};

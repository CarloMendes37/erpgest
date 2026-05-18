/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary:   '#696cff',
        secondary: '#9155fd',
        success:   '#71dd37',
        danger:    '#ff3e1d',
        warning:   '#ffab00',
        info:      '#03c3ec',
        dark:      '#233446',
        'menu-bg': '#2b2c40',
      },
      backgroundImage: {
        'grad-brand': 'linear-gradient(135deg, #696cff 0%, #9155fd 100%)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 6px rgba(105,108,255,.18)',
        nav:  '0 4px 18px rgba(105,108,255,.22)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
};

/** @type {import('tailwindcss').Config} */
export default {
  important: '.web-revizor-container',
  content: ['./*.php', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      transitionTimingFunction: {
        bounce: 'cubic-bezier(0.68, -0.3, 0.32, 1.2)',
      },
      boxShadow: {
        'chat-shadow': '0px 0px 10px 1px rgba(0, 0, 0, 0.3)',
      },
      borderRadius: {
        2: '2px',
      },
      animation: {
        'model-message':
          'model-message 0.5s cubic-bezier(0.4, 0, 0.6, 1) forwards',
        'user-message':
          'user-message 0.5s cubic-bezier(0.4, 0, 0.6, 1) forwards',
        'shadow-pulse': 'shadow-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'add-message': 'add-message 0.5s cubic-bezier(0.4, 0, 0.6, 1) forwards',
        'remove-message':
          'remove-message 0.5s cubic-bezier(0.4, 0, 0.6, 1) forwards',
      },
      keyframes: {
        'model-message': {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'user-message': {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'shadow-pulse': {
          '0%': { boxShadow: '0px 0px 10px 1px rgba(0, 123, 255, 0.1)' },
          '50%': { boxShadow: '0px 0px 10px 1px rgba(0, 123, 255, 0.9)' },
          '100%': { boxShadow: '0px 0px 10px 1px rgba(0, 123, 255, 0.1)' },
        },
        'add-message': {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'remove-message': {
          '0%': { transform: 'translateX(0)', opacity: '1' },
          '100%': { transform: 'translateX(20px)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false,
  },
};

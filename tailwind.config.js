/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        excel: {
          green: '#217346',
          light: '#f3f2f1',
          border: '#e1dfdd',
        },
      },
    },
  },
  plugins: [],
};

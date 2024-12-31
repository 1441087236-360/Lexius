/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./frontend/templates/index.html'],
  theme: {
    extend: {
      colors: {
        'background-150': '#0c101c',
        'background-151': '#101524',
        'background-152': '#171e32',
        'background-100': '#0b0f16',
        'background-50': '#1a2b3d',
        'background-200': '#2a3c52',
        'background-250': '#3b4d67',
        'background-300': '#4c607d',

        'foreground-50': '#f2ddcc',
        'foreground-100': '#3c2f24',
        'foreground-150': '#4b4232',
        'foreground-200': '#5a5741',
        'foreground-250': '#6a6b50',
        'foreground-300': '#c79f7b',
        'foreground-350': '#d2b285',
        'foreground-400': '#ddc48e',
        'foreground-450': '#e7d99a',
        'foreground-500': '#9d7d3a',
        'foreground-550': '#b88e44',
        'foreground-600': '#d49d55',
        'foreground-650': '#e8b76f',

        'stroke-100': '#1e2a31',
        'stroke-150': '#3b4859', 
        'stroke-200': '#5a636f', 
        'stroke-250': '#1f2330'
      },
      animation: {
        'bounce-delay-200': 'bounce 1.2s infinite 0.2s',
        'bounce-delay-400': 'bounce 1.2s infinite 0.4s',
      }
    },
  },
  plugins: [],
}


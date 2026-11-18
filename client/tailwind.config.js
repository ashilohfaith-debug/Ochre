export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ochre: {
          DEFAULT: '#C7722D',
          hover: '#b56424',
          light: '#d9843e',
          dark: '#9e561f',
          transparent: 'rgba(199, 114, 45, 0.15)'
        },
        matte: {
          50: '#1e1e1e',
          100: '#181818',
          200: '#141414',
          300: '#101010',
          400: '#0c0c0c',
          border: '#2a2a2a',
          hover: '#262626',
          text: '#cccccc',
          muted: '#808080'
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
        sans: ['Inter', 'sans-serif']
      }
    },
  },
  plugins: [],
}

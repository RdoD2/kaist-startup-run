import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Pico-8 16색 + KAIST 하이브리드
        ink: {
          0: '#000000',
          1: '#1D2B53', // dark navy
          2: '#7E2553', // wine
          3: '#008751', // green
          4: '#AB5236', // brown
          5: '#5F574F', // dark gray
          6: '#C2C3C7', // light gray
          7: '#FFF1E8', // cream
          8: '#FF004D', // red
          9: '#FFA300', // orange
          10: '#FFEC27', // yellow
          11: '#00E436', // bright green
          12: '#29ADFF', // sky
          13: '#83769C', // mauve
          14: '#FF77A8', // pink
          15: '#FFCCAA', // peach
        },
        kaist: '#003875',
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', 'monospace'],
        kor: ['Galmuri11', 'sans-serif'],
        korSmall: ['Galmuri9', 'sans-serif'],
      },
      boxShadow: {
        pixel: '2px 2px 0 0 #000000',
        pixelLg: '4px 4px 0 0 #000000',
      },
      borderRadius: {
        none: '0',
      },
    },
  },
  plugins: [],
};

export default config;

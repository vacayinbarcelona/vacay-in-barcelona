import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff8ff',
          100: '#dcefff',
          200: '#b3ddff',
          300: '#7ac4ff',
          400: '#3ba4ff',
          500: '#0f83f2',
          600: '#0063cf',
          700: '#004fa8',
          800: '#02428a',
          900: '#083a70'
        },
        accent: {
          500: '#ff6b4a',
          600: '#e6522f'
        },
        sand: {
          50: '#fbf9f5',
          100: '#f5f0e6'
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif']
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,0.06), 0 1px 3px rgba(16,24,40,0.08)',
        cardHover: '0 4px 12px rgba(16,24,40,0.12)'
      }
    }
  },
  plugins: []
};

export default config;

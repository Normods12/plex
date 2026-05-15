import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          red: '#DC2127',
          darkRed: '#B71C1C',
        },
        ui: {
          charcoal: '#333333',
          nearBlack: '#1A1A1A',
          lightGray: '#F8F9FA',
          border: '#DDDDDD',
          success: '#27AE60',
          error: '#B71C1C',
        },
      },
      fontFamily: {
        sans: ['Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;

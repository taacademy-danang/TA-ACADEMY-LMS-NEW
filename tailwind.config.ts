import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FDF2F3',
          100: '#FCE7E9',
          200: '#F8C8CC',
          300: '#F19CA3',
          400: '#E46672',
          500: '#B51225', // Primary Brand Red
          600: '#A00F20',
          700: '#8C0718', // Dark Red
          800: '#750B17',
          900: '#620E18',
          DEFAULT: '#B51225',
          dark: '#8C0718',
        },
        surface: {
          50: '#F9FAFB',
          100: '#F7F7F8', // Page Background
          200: '#F3F4F6',
          border: '#E5E7EB',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;

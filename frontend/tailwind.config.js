/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Lexend"', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        primary: {
          900: "#0039A9",
          700: "#027DFF",
          600: "#1392D3",
          500: "#3399FF",
          400: "#41AADE",
          300: "#88D1F1",
          100: "#E8F4FD",
        },
        surface: {
          base: "#FFFFFF",
          card: "#F8FAFC",
          alt: "#F1F5F9",
          hover: "#E2E8F0",
        },
        border: {
          DEFAULT: "#E2E8F0",
          strong: "#CBD5E1",
        }
      },
      boxShadow: {
        'soft': '0 2px 10px rgba(0, 0, 0, 0.04)',
        'card': '0 4px 20px -2px rgba(0, 57, 169, 0.06), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 10px 25px -3px rgba(2, 125, 255, 0.12), 0 4px 10px -2px rgba(0, 0, 0, 0.04)',
        'blue-glow': '0 0 25px -4px rgba(2, 125, 255, 0.35)',
      },
      animation: {
        'spin-slow': 'spin 12s linear infinite',
      }
    },
  },
  plugins: [],
}
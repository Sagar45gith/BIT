/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neuro: {
          base: "#030712",   // Deepest background
          glass: "#111827",  // Glass panels
          cyan: "#06b6d4",   // Primary Glow (Calm)
          red: "#f43f5e",    // Alert Glow (Stress)
        }
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
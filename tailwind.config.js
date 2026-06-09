/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        lamp: {
          bg: "#0a0a12",
          panel: "rgba(20, 22, 35, 0.75)",
          border: "rgba(255, 255, 255, 0.08)",
          accent: "#ff6b3d",
          cool: "#4fc3f7",
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', '"Inter"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', '"SF Mono"', "ui-monospace", "monospace"],
      },
      boxShadow: {
        glow: "0 0 40px rgba(255, 107, 61, 0.3)",
        "glow-cool": "0 0 40px rgba(79, 195, 247, 0.25)",
      },
      animation: {
        "pulse-slow": "pulse 3s ease-in-out infinite",
        "breathe": "breathe 2.5s ease-in-out infinite",
      },
      keyframes: {
        breathe: {
          "0%, 100%": { opacity: "0.7", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.05)" },
        },
      },
    },
  },
  plugins: [],
};

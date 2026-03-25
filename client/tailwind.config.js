/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./index.tsx",
    "./App.tsx",
    "./components/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "neon-purple": "#b026ff",
        "neon-blue": "#00d2ff",
        "dark-bg": "#0f0c1a",
        "panel-bg": "#1a1625",
      },
      boxShadow: {
        "neon-purple":
          "0 0 15px rgba(176, 38, 255, 0.5), 0 0 30px rgba(176, 38, 255, 0.3)",
        "neon-blue":
          "0 0 15px rgba(0, 210, 255, 0.5), 0 0 30px rgba(0, 210, 255, 0.3)",
      },
      fontFamily: {
        sans: ["Heebo", "Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};

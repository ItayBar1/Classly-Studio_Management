/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./index.tsx",
    "./App.tsx",
    "./components/**/*.{ts,tsx}",
    "./utils/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  safelist: [
    "bg-blue-50", "dark:bg-blue-900/20", "bg-blue-500",
    "bg-emerald-50", "dark:bg-emerald-900/20", "bg-emerald-500",
    "bg-amber-50", "dark:bg-amber-900/20", "bg-amber-500",
    "bg-fuchsia-50", "dark:bg-fuchsia-900/20", "bg-fuchsia-500",
    "bg-cyan-50", "dark:bg-cyan-900/20", "bg-cyan-500",
    "bg-indigo-500", "bg-rose-500", "bg-teal-500"
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

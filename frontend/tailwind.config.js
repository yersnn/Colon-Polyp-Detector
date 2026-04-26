/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"],
        mono: ["JetBrains Mono", "ui-monospace"],
      },
      colors: {
        page:    "var(--page)",
        surface: "var(--surface)",
        fg:      "var(--fg)",
        fg2:     "var(--fg2)",
        fg3:     "var(--fg3)",
        fg4:     "var(--fg4)",
        line:    "var(--line)",
      },
    },
  },
  plugins: [],
};

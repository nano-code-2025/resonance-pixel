/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        "bg-card": "var(--bg-card)",
        accent: "var(--accent)",
        border: "var(--border)",
        "text-muted": "var(--text-muted)",
      },
      fontFamily: {
        mono: ["IBM Plex Mono", "Courier New", "monospace"],
      },
    },
  },
  plugins: [],
};

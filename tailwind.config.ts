import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fff7f3",
          100: "#ffe9df",
          200: "#ffcab6",
          300: "#ffa98b",
          400: "#ff8a63",
          500: "#e45a20",
          600: "#c24912",
          700: "#a23c0e",
          800: "#82300b",
          900: "#6b290a"
        }
      },
      boxShadow: {
        soft: "0 8px 32px rgba(0,0,0,0.07)",
      }
    },
  },
  plugins: [],
} satisfies Config;

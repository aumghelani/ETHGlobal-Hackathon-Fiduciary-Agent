import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#10B981",
          foreground: "#FAFAFA",
        },
        accent: {
          DEFAULT: "#6366F1",
          foreground: "#FAFAFA",
        },
        warning: {
          DEFAULT: "#F59E0B",
        },
        background: "#FAFAFA",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;

import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        indigo: "#1B2A4A",
        turmeric: "#E8A83C",
        salgreen: "#3D7A5C",
        sindoor: "#C74B3F",
        ricepaper: "#FAF6EE",
        ink: "#2B2420",
        topupgold: "#F2C14E",
      },
      fontFamily: {
        sans: ["Noto Sans Devanagari", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          black: "#000000",
          white: "#FFFFFF",
          gold: "#FFD97F",
          mint: "#C8DCD5",
          beige: "#ECE3D8",
          charcoal: "#2C2C2B",
        },
        accent: {
          DEFAULT: "#FFD97F",
          hover: "#FFE599",
        },
      },
    },
  },
  plugins: [],
};

export default config;

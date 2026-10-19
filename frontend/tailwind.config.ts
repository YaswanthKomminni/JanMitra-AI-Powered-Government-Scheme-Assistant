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
        // Existing component classes are re-pointed at the active theme's tokens.
        krishi: { 50: "rgb(var(--soft) / <alpha-value>)", 100: "rgb(var(--soft) / <alpha-value>)", 200: "rgb(var(--border) / <alpha-value>)", 300: "rgb(var(--primary) / <alpha-value>)", 400: "rgb(var(--primary) / <alpha-value>)", 500: "rgb(var(--primary) / <alpha-value>)", 600: "rgb(var(--primary) / <alpha-value>)", 700: "rgb(var(--primary) / <alpha-value>)", 800: "rgb(var(--primary-hover) / <alpha-value>)", 900: "rgb(var(--text) / <alpha-value>)", 950: "rgb(var(--text) / <alpha-value>)" },
        emerald: { 50: "rgb(var(--soft) / <alpha-value>)", 100: "rgb(var(--soft) / <alpha-value>)", 200: "rgb(var(--border) / <alpha-value>)", 300: "rgb(var(--primary) / <alpha-value>)", 400: "rgb(var(--primary) / <alpha-value>)", 500: "rgb(var(--primary) / <alpha-value>)", 600: "rgb(var(--primary) / <alpha-value>)", 700: "rgb(var(--primary) / <alpha-value>)", 800: "rgb(var(--primary-hover) / <alpha-value>)", 900: "rgb(var(--text) / <alpha-value>)", 950: "rgb(var(--text) / <alpha-value>)" },
        stone: { 50: "rgb(var(--bg) / <alpha-value>)", 100: "rgb(var(--muted) / <alpha-value>)", 200: "rgb(var(--border) / <alpha-value>)", 300: "rgb(var(--border) / <alpha-value>)", 400: "rgb(var(--text-2) / <alpha-value>)", 500: "rgb(var(--text-2) / <alpha-value>)", 600: "rgb(var(--text-2) / <alpha-value>)", 700: "rgb(var(--text) / <alpha-value>)", 800: "rgb(var(--text) / <alpha-value>)", 900: "rgb(var(--text) / <alpha-value>)", 950: "rgb(var(--text) / <alpha-value>)" },
        slate: { 50: "rgb(var(--bg) / <alpha-value>)", 100: "rgb(var(--muted) / <alpha-value>)", 200: "rgb(var(--border) / <alpha-value>)", 300: "rgb(var(--border) / <alpha-value>)", 400: "rgb(var(--text-2) / <alpha-value>)", 500: "rgb(var(--text-2) / <alpha-value>)", 600: "rgb(var(--text-2) / <alpha-value>)", 700: "rgb(var(--text) / <alpha-value>)", 800: "rgb(var(--text) / <alpha-value>)", 900: "rgb(var(--text) / <alpha-value>)" },
        amberGold: { 50: "rgb(var(--soft) / <alpha-value>)", 100: "rgb(var(--soft) / <alpha-value>)", 500: "rgb(var(--primary) / <alpha-value>)", 600: "rgb(var(--primary) / <alpha-value>)", 700: "rgb(var(--text) / <alpha-value>)" },
        earth: { 100: "rgb(var(--soft) / <alpha-value>)", 500: "rgb(var(--text-2) / <alpha-value>)", 700: "rgb(var(--text) / <alpha-value>)" },
        jm: { hover: "rgb(var(--primary-hover) / <alpha-value>)", primary: "rgb(var(--primary) / <alpha-value>)", onprimary: "rgb(var(--on-primary) / <alpha-value>)", bg: "rgb(var(--bg) / <alpha-value>)", surface: "rgb(var(--surface) / <alpha-value>)", muted: "rgb(var(--muted) / <alpha-value>)", text: "rgb(var(--text) / <alpha-value>)", text2: "rgb(var(--text-2) / <alpha-value>)", border: "rgb(var(--border) / <alpha-value>)", soft: "rgb(var(--soft) / <alpha-value>)" },
      },
      fontWeight: { extrabold: "700", black: "700" },
      fontFamily: {
        sans: ["Segoe UI", "Segoe UI Variable", "-apple-system", "BlinkMacSystemFont", "Helvetica Neue", "Arial", "sans-serif"],
      },
      animation: {
        "scan-laser": "scan 2s ease-in-out infinite alternate",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "bounce-subtle": "bounceSubtle 1.5s ease-in-out infinite",
      },
      keyframes: {
        scan: {
          "0%": { transform: "translateY(0%)" },
          "100%": { transform: "translateY(280px)" },
        },
        bounceSubtle: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        }
      }
    },
  },
  plugins: [],
};
export default config;

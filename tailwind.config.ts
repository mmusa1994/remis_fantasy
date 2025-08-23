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
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Enhanced theme colors for FPL Live
        'theme-card': 'var(--theme-card, #ffffff)',
        'theme-accent': 'var(--theme-accent, #f3f4f6)',
        'theme-border': 'var(--theme-border, #e5e7eb)',
        'theme-primary': 'var(--theme-primary, #111827)',
        'theme-secondary': 'var(--theme-secondary, #6b7280)',
        'theme-muted': 'var(--theme-muted, #9ca3af)',
      },
      fontFamily: {
        russo: ["Russo One", "system-ui", "sans-serif"],
        sans: ["Russo One", "system-ui", "sans-serif"],
        mono: ["monospace"],
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.5s ease-out",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;

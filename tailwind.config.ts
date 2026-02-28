import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    screens: {
      'xs': '475px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Pure black/white theme colors
        'theme-background': 'var(--theme-background)',
        'theme-foreground': 'var(--theme-foreground)',
        'theme-card': 'var(--theme-card)',
        'theme-card-secondary': 'var(--theme-card-secondary)',
        'theme-accent': 'var(--theme-accent)',
        'theme-border': 'var(--theme-border)',
        'theme-border-strong': 'var(--theme-border-strong)',
        'theme-primary': 'var(--theme-primary)',
        'theme-secondary': 'var(--theme-secondary)',
        'theme-muted': 'var(--theme-muted)',
        'theme-text-primary': 'var(--theme-text-primary)',
        'theme-text-secondary': 'var(--theme-text-secondary)',
        'theme-text-muted': 'var(--theme-text-muted)',
        'theme-heading-primary': 'var(--theme-heading-primary)',
        'theme-heading-secondary': 'var(--theme-heading-secondary)',
      },
      fontFamily: {
        anta: ["var(--font-anta)", "system-ui", "sans-serif"],
        sans: ["var(--font-anta)", "system-ui", "sans-serif"],
        mono: ["monospace"],
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.5s ease-out",
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 3s ease-in-out infinite",
        "shimmer-border": "shimmerBorder 3s ease-in-out infinite",
        "spin-slow": "spin 8s linear infinite",
        "travel-line-1": "travelLine 2.5s ease-in-out infinite",
        "travel-line-2": "travelLine 2.5s ease-in-out 0.3s infinite",
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
        shimmer: {
          "0%": { transform: "translateX(-100%) skewX(-12deg)" },
          "50%": { transform: "translateX(100%) skewX(-12deg)" },
          "100%": { transform: "translateX(100%) skewX(-12deg)" },
        },
        shimmerBorder: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        travelLine: {
          "0%": { left: "-5%", opacity: "0" },
          "10%": { opacity: "1" },
          "90%": { opacity: "1" },
          "100%": { left: "100%", opacity: "0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;

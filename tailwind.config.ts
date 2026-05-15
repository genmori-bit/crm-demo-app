import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Salesforce Lightning Design System inspired tokens
        primary: {
          50: "#e8f4fd",
          100: "#cce5fa",
          200: "#9acbf5",
          300: "#57a3e8",
          400: "#1a80d9",
          500: "#0176d3", // SF Blue
          600: "#0b5cad",
          700: "#014486",
          800: "#032d60", // SF Navy (used for sidebar)
          900: "#001639",
        },
        sf: {
          bg: "#f3f2f2",       // Page background
          surface: "#ffffff",  // Card background
          border: "#dddbda",   // Standard border
          "border-strong": "#c9c7c5",
          text: "#3e3e3c",     // Default text
          weak: "#706e6b",     // Secondary text
          placeholder: "#9a9998",
          nav: "#032d60",      // Sidebar background
          "nav-active": "#1b5297",
          "nav-hover": "#0d2f5a",
        },
        success: {
          DEFAULT: "#2e844a",
          light: "#eef6ee",
          border: "#91c98a",
        },
        warning: {
          DEFAULT: "#dd7a01",
          light: "#fef0e0",
          border: "#f8c87a",
        },
        danger: {
          DEFAULT: "#ba0517",
          light: "#fce7e9",
          border: "#e8a9ae",
        },
        info: {
          DEFAULT: "#0176d3",
          light: "#e8f4fd",
          border: "#9acbf5",
        },
      },
      fontFamily: {
        sans: [
          "Salesforce Sans",
          "Hiragino Sans",
          "Hiragino Kaku Gothic ProN",
          "Meiryo",
          "sans-serif",
        ],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0,0,0,.08), 0 1px 2px -1px rgba(0,0,0,.06)",
        "card-hover": "0 4px 8px 0 rgba(0,0,0,.12), 0 2px 4px -2px rgba(0,0,0,.08)",
        dropdown: "0 4px 16px 0 rgba(0,0,0,.15), 0 1px 4px 0 rgba(0,0,0,.08)",
        "focus-ring": "0 0 0 3px rgba(1,118,211,0.18)",
      },
      borderRadius: {
        sf: "0.25rem", // 4px
      },
      transitionDuration: {
        100: "100ms",
        120: "120ms",
      },
    },
  },
  plugins: [],
};

export default config;

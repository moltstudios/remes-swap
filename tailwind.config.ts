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
        // Banking-grade trust palette — no crypto gradients
        ink: {
          50: "#F7F8FA",
          100: "#EEF0F4",
          200: "#D9DDE6",
          300: "#B6BDCC",
          400: "#8590A6",
          500: "#5C677D",
          600: "#3D4659",
          700: "#2A3142",
          800: "#1A1F2D",
          900: "#0E1119",
        },
        // Subtle, trustworthy accent — not neon
        accent: {
          DEFAULT: "#0E1119", // near-black like a bank app
          soft: "#1A1F2D",
          muted: "#3D4659",
        },
        // Single bold accent for CTAs
        success: {
          DEFAULT: "#0E8A5F", // bank-green, not crypto-green
          soft: "#E6F4EE",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          alt: "#F7F8FA",
          elevated: "#FFFFFF",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      fontSize: {
        // Mobile-first scale — comfortable on 5" screens
        "display-lg": ["48px", { lineHeight: "1.05", letterSpacing: "-0.025em", fontWeight: "700" }],
        "display": ["36px", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "700" }],
        "heading": ["24px", { lineHeight: "1.2", letterSpacing: "-0.01em", fontWeight: "600" }],
        "subheading": ["18px", { lineHeight: "1.3", fontWeight: "600" }],
        "body": ["16px", { lineHeight: "1.5", fontWeight: "400" }],
        "small": ["14px", { lineHeight: "1.4", fontWeight: "400" }],
        "micro": ["12px", { lineHeight: "1.3", fontWeight: "500", letterSpacing: "0.02em" }],
      },
      spacing: {
        section: "64px",
        "section-sm": "40px",
      },
      borderRadius: {
        card: "20px",
        pill: "999px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(14, 17, 25, 0.04), 0 1px 3px rgba(14, 17, 25, 0.06)",
        elevated:
          "0 4px 6px rgba(14, 17, 25, 0.04), 0 12px 24px rgba(14, 17, 25, 0.08)",
      },
      maxWidth: {
        content: "640px",
      },
    },
  },
  plugins: [],
};

export default config;
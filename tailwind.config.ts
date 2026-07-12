import type { Config } from "tailwindcss";

/**
 * Remes Design Tokens — locked 2026-07-12 per Ghost/Timothy brief.
 * 5 colors. 6 font sizes. 6 spacing values. Nothing else.
 */
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // 5 colors only — the brief
        primary: {
          DEFAULT: "#0A4D8C",
          hover: "#083E70",
          pressed: "#063057",
        },
        accent: {
          DEFAULT: "#3B9EFF",
          soft: "#E8F2FF",
        },
        ink: "#1A1A2E",
        bg: "#FFFFFF",
        surface: "#F7F9FC",
        success: "#10B981",
        error: "#EF4444",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
      },
      fontSize: {
        micro: ["12px", { lineHeight: "1.4", fontWeight: "400" }],
        small: ["14px", { lineHeight: "1.4", fontWeight: "400" }],
        body: ["16px", { lineHeight: "1.5", fontWeight: "400" }],
        subhead: ["20px", { lineHeight: "1.3", fontWeight: "600" }],
        head: ["28px", { lineHeight: "1.2", fontWeight: "700" }],
        display: ["48px", { lineHeight: "1.1", fontWeight: "700", letterSpacing: "-0.02em" }],
      },
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "32px",
        "2xl": "48px",
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
        pill: "999px",
      },
      maxWidth: {
        content: "480px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(26, 26, 46, 0.04), 0 2px 8px rgba(26, 26, 46, 0.06)",
        focus: "0 0 0 4px rgba(59, 158, 255, 0.18)",
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      keyframes: {
        tickIn: {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        drawCheck: {
          "0%": { strokeDashoffset: "100" },
          "100%": { strokeDashoffset: "0" },
        },
        sheetUp: {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "tick-in": "tickIn 280ms cubic-bezier(0.22, 1, 0.36, 1)",
        pulse: "pulse 1.4s ease-in-out infinite",
        "draw-check": "drawCheck 500ms cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "sheet-up": "sheetUp 280ms cubic-bezier(0.22, 1, 0.36, 1)",
        shimmer: "shimmer 1.6s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
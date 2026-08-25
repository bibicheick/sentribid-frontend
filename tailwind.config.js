/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Page + surfaces
        canvas: "#F7F8FA",
        surface: "#FFFFFF",
        raised: "#FBFBFD",
        sunken: "#F1F2F5",

        // Lines
        line: "#E5E7EB",
        "line-soft": "#F0F1F3",

        // Text
        ink: "#101828",
        body: "#344054",
        muted: "#667085",
        faint: "#98A2B3",

        // Brand — the only accent in the product
        brand: {
          50: "#EEF2FF",
          100: "#E0E7FF",
          200: "#C7D2FE",
          300: "#A5B4FC",
          500: "#6366F1",
          600: "#4F46E5",
          700: "#4338CA",
          900: "#1E1B4B",
        },

        // Status — used only inside badges, dots and thin bars
        good: { bg: "#ECFDF3", line: "#ABEFC6", ink: "#067647", solid: "#16A34A" },
        warn: { bg: "#FFFAEB", line: "#FEDF89", ink: "#B54708", solid: "#D97706" },
        bad: { bg: "#FEF3F2", line: "#FECDCA", ink: "#B42318", solid: "#D92D20" },
        neutral: { bg: "#F2F4F7", line: "#E4E7EC", ink: "#475467", solid: "#98A2B3" },
      },

      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },

      fontSize: {
        caps: ["11px", { lineHeight: "16px", letterSpacing: "0.06em", fontWeight: "600" }],
        meta: ["13px", { lineHeight: "18px" }],
        base: ["14px", { lineHeight: "20px" }],
        lead: ["15px", { lineHeight: "22px" }],
        h3: ["15px", { lineHeight: "22px", fontWeight: "600" }],
        h2: ["16px", { lineHeight: "24px", fontWeight: "600" }],
        h1: ["24px", { lineHeight: "32px", letterSpacing: "-0.02em", fontWeight: "600" }],
        stat: ["30px", { lineHeight: "36px", letterSpacing: "-0.02em", fontWeight: "600" }],
        display: ["36px", { lineHeight: "42px", letterSpacing: "-0.025em", fontWeight: "600" }],
      },

      spacing: {
        page: "32px",
        card: "24px",
        gap: "24px",
        gutter: "16px",
        sidebar: "248px",
      },

      borderRadius: {
        control: "8px",
        card: "12px",
        panel: "16px",
      },

      boxShadow: {
        card: "0 1px 2px 0 rgba(16, 24, 40, 0.05)",
        lift: "0 4px 12px -2px rgba(16, 24, 40, 0.10), 0 2px 4px -2px rgba(16, 24, 40, 0.06)",
        pop: "0 12px 32px -8px rgba(16, 24, 40, 0.18)",
        ring: "0 0 0 4px rgba(79, 70, 229, 0.12)",
      },

      maxWidth: {
        content: "1200px",
        prose: "720px",
      },

      transitionDuration: {
        DEFAULT: "150ms",
      },

      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 200ms ease-out both",
      },
    },
  },
  plugins: [require("@tailwindcss/forms")({ strategy: "class" })],
};

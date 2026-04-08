/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#070A12",
        royal: {
          50: "#F4F1FF",
          100: "#E8E0FF",
          200: "#D4C5FF",
          300: "#B79EFF",
          400: "#9B77FF",
          500: "#7E4DFF",
          600: "#6A33FF",
          700: "#5522D6",
          800: "#3D189B",
          900: "#281166",
        },
        gold: {
          50: "#FFF8E6",
          100: "#FFEFC2",
          200: "#FFE199",
          300: "#FFD066",
          400: "#FFBD33",
          500: "#F5A200",
          600: "#CC8400",
          700: "#996300",
          800: "#664200",
          900: "#332100",
        },
      },
      boxShadow: {
        glass: "0 20px 60px rgba(0,0,0,.35)",
        soft: "0 10px 30px rgba(0,0,0,.18)",
      },
      backdropBlur: {
        glass: "14px",
      },
    },
  },
  plugins: [],
};

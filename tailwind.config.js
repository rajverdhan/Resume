/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        noir: "#050507",
        burgundy: "#6d001a",
        neonPink: "#ff3da8",
        neonPurple: "#8e5cff",
        softWhite: "#f7f8fc"
      },
      boxShadow: {
        neon: "0 0 22px rgba(255, 61, 168, 0.45), 0 0 48px rgba(142, 92, 255, 0.35)",
        glass: "0 18px 42px rgba(0, 0, 0, 0.42)",
        panel: "0 24px 80px rgba(0, 0, 0, 0.52)"
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.22, 1, 0.36, 1)"
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" }
        },
        pulseSoft: {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" }
        }
      },
      animation: {
        float: "float 4.5s ease-in-out infinite",
        pulseSoft: "pulseSoft 3.5s ease-in-out infinite"
      }
    }
  },
  plugins: []
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        crisis: {
          bg: "#0f172a",
          surface: "#0d1825",
          card: "#111f2e",
        },
        brand: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        alert: '#ef4444',
      },
      fontFamily: {
        sans: ['"Space Grotesk"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
      animation: {
        "fade-in": "fadeIn 0.8s ease-out forwards",
        "fade-in-delay": "fadeIn 0.8s ease-out 0.15s forwards",
        "fade-in-delay-2": "fadeIn 0.8s ease-out 0.3s forwards",
        earth: "earthRotate 75s linear infinite",
        float: "floaty 8s ease-in-out infinite",
        shimmer: "shimmer 2.5s ease-in-out infinite",
        "page-in": "pageIn 0.45s ease-out both",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        earthRotate: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        floaty: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
        shimmer: {
          "0%, 100%": { opacity: "0.5" },
          "50%": { opacity: "1" },
        },
        pageIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      boxShadow: {
        glow: "0 0 40px rgba(34, 211, 238, 0.2)",
        "glow-lg": "0 0 60px rgba(56, 189, 248, 0.35)",
        card: "0 8px 32px rgba(0, 0, 0, 0.35)",
      },
      backdropBlur: {
        glass: "16px",
      },
    },
  },
  plugins: [],
};

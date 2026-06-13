import type { Config } from "tailwindcss";

// Token-driven config: colors reference CSS variables (rgb channel triples) so a
// single .dark class on <html> reskins the whole app. <alpha-value> lets opacity
// utilities (bg-brand/10) work against the variable.
function withAlpha(variable: string) {
  return `rgb(var(${variable}) / <alpha-value>)`;
}

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: withAlpha("--brand"),
          strong: withAlpha("--brand-strong"),
          soft: withAlpha("--brand-soft"),
        },
        accent: {
          DEFAULT: withAlpha("--accent"),
          soft: withAlpha("--accent-soft"),
        },
        warn: {
          DEFAULT: withAlpha("--warn"),
          soft: withAlpha("--warn-soft"),
        },
        danger: withAlpha("--danger"),
        bg: withAlpha("--bg"),
        surface: {
          DEFAULT: withAlpha("--surface"),
          2: withAlpha("--surface-2"),
          3: withAlpha("--surface-3"),
        },
        line: {
          DEFAULT: withAlpha("--line"),
          strong: withAlpha("--line-strong"),
        },
        fg: {
          DEFAULT: withAlpha("--fg"),
          muted: withAlpha("--fg-muted"),
          subtle: withAlpha("--fg-subtle"),
        },
        "on-brand": withAlpha("--on-brand"),
        // Back-compat: keep `primary` aliased to brand so existing classes don't break
        // mid-migration. New code should use `brand`.
        primary: {
          DEFAULT: withAlpha("--brand"),
          foreground: withAlpha("--on-brand"),
        },
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        DEFAULT: "var(--radius)",
        md: "var(--radius)",
        lg: "var(--radius-lg)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        DEFAULT: "var(--shadow-md)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      fontSize: {
        // Tightened display scale for hero numbers
        "display-sm": ["2.25rem", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        "display": ["3rem", { lineHeight: "1.05", letterSpacing: "-0.025em" }],
        "display-lg": ["4rem", { lineHeight: "1", letterSpacing: "-0.03em" }],
      },
    },
  },
  plugins: [],
};

export default config;

import type { ThemeOverride } from "./types";

export const HEX_RE = /^#[0-9a-fA-F]{6}$/;

function toRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

const toHex = (rgb: number[]) =>
  "#" + rgb.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");

/** Mélange a→b, t = poids de b (0..1). */
export function mixHex(a: string, b: string, t: number): string {
  const ra = toRgb(a);
  const rb = toRgb(b);
  return toHex(ra.map((v, i) => v + (rb[i] - v) * t));
}

/** Luminance relative approx. (0 = noir, 1 = blanc). */
export function luminance(hex: string): number {
  const [r, g, b] = toRgb(hex).map((v) => v / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Convertit un ThemeOverride en variables CSS, tons dérivés inclus.
 * `base` fournit le fond/texte courants pour dériver les tons quand seul un
 * champ est personnalisé.
 */
export function themeToCssVars(
  theme: ThemeOverride,
  base: { background: string; foreground: string }
): Record<string, string> {
  const vars: Record<string, string> = {};
  const bg = theme.background && HEX_RE.test(theme.background) ? theme.background : base.background;
  const fg = theme.foreground && HEX_RE.test(theme.foreground) ? theme.foreground : base.foreground;

  if (theme.background && HEX_RE.test(theme.background)) {
    vars["--background"] = theme.background;
  }
  if (theme.foreground && HEX_RE.test(theme.foreground)) {
    vars["--foreground"] = fg;
    vars["--muted"] = mixHex(fg, bg, 0.42);
  }
  if (theme.card && HEX_RE.test(theme.card)) {
    vars["--card"] = theme.card;
    vars["--card-2"] = mixHex(theme.card, fg, 0.07);
  }
  if (theme.line && HEX_RE.test(theme.line)) {
    vars["--line"] = theme.line;
    vars["--line-soft"] = mixHex(theme.line, bg, 0.72);
  }
  if (theme.accent && HEX_RE.test(theme.accent)) {
    vars["--accent"] = theme.accent;
    vars["--accent-ink"] = luminance(theme.accent) > 0.5 ? "#17171a" : "#f5f5f3";
  }
  return vars;
}

export const THEME_KEYS = ["background", "card", "foreground", "line", "accent"] as const;

export const THEME_VARS: Record<(typeof THEME_KEYS)[number], string> = {
  background: "--background",
  card: "--card",
  foreground: "--foreground",
  line: "--line",
  accent: "--accent",
};

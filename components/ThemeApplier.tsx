"use client";

import { useEffect } from "react";
import { THEME_VARS, themeToCssVars } from "@/lib/color";
import { useDashboard } from "@/lib/store";

const ALL_VARS = [
  "--background",
  "--card",
  "--card-2",
  "--foreground",
  "--muted",
  "--line",
  "--line-soft",
  "--accent",
  "--accent-ink",
];

/**
 * Applique le thème utilisateur + la palette de la page active en variables
 * CSS sur <html>. Les champs non personnalisés gardent les valeurs du thème
 * de base (Nuit/Blanc, pilotées par la classe .dark).
 */
export function ThemeApplier() {
  const { theme, pages, activePageId, hydrated } = useDashboard();
  const pageTheme = pages.find((p) => p.id === activePageId)?.theme;

  useEffect(() => {
    if (!hydrated) return;
    const root = document.documentElement;

    const apply = () => {
      for (const v of ALL_VARS) root.style.removeProperty(v);
      const merged = { ...theme, ...pageTheme };
      if (Object.keys(merged).length === 0) return;
      // Fond/texte du thème de base courant, pour dériver les tons.
      const computed = getComputedStyle(root);
      const base = {
        background: computed.getPropertyValue(THEME_VARS.background).trim() || "#f4f4f2",
        foreground: computed.getPropertyValue(THEME_VARS.foreground).trim() || "#17171a",
      };
      for (const [k, v] of Object.entries(themeToCssVars(merged, base))) {
        root.style.setProperty(k, v);
      }
    };

    apply();
    // Le basculement clair/sombre change les valeurs de base : on ré-applique.
    window.addEventListener("lifeos-mode-change", apply);
    return () => {
      window.removeEventListener("lifeos-mode-change", apply);
      for (const v of ALL_VARS) root.style.removeProperty(v);
    };
  }, [theme, pageTheme, hydrated]);

  return null;
}

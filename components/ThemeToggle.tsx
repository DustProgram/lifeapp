"use client";

import { useState, useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/** Bascule Nuit/Blanc (classe .dark) et notifie les thèmes personnalisés. */
export function setThemeMode(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
  try {
    localStorage.setItem("lifeos-theme", dark ? "dark" : "light");
  } catch {}
  window.dispatchEvent(new Event("lifeos-mode-change"));
}

export function ThemeToggle() {
  // Rendu neutre côté serveur, icône réelle après hydratation.
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const [dark, setDark] = useState(
    () =>
      typeof document !== "undefined" &&
      document.documentElement.classList.contains("dark")
  );

  const toggle = () => {
    const next = !dark;
    setDark(next);
    setThemeMode(next);
  };

  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Passer en mode clair" : "Passer en mode sombre"}
      className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-line bg-card text-sm hover:bg-card-2"
    >
      {mounted ? (dark ? "☾" : "☀") : "·"}
    </button>
  );
}

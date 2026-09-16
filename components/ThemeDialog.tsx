"use client";

import { useEffect, useState } from "react";
import { setThemeMode } from "@/components/ThemeToggle";
import { THEME_KEYS, THEME_VARS } from "@/lib/color";
import { useDashboard } from "@/lib/store";
import type { ThemeOverride } from "@/lib/types";

const FIELD_LABELS: Record<(typeof THEME_KEYS)[number], string> = {
  background: "Fond",
  card: "Cartes",
  foreground: "Texte",
  line: "Lignes",
  accent: "Accent",
};

/** Nuit et Blanc = thèmes de base parfaits ; les autres sont des skins complets. */
const PRESETS: { name: string; mode?: "dark" | "light"; theme: ThemeOverride | null; chip: string }[] = [
  { name: "Nuit", mode: "dark", theme: null, chip: "#0d0d0f" },
  { name: "Blanc", mode: "light", theme: null, chip: "#f4f4f2" },
  {
    name: "Minuit",
    theme: { background: "#0a0f1e", card: "#121a33", foreground: "#e8ecf8", line: "#31406b", accent: "#7aa2ff" },
    chip: "#7aa2ff",
  },
  {
    name: "Sable",
    theme: { background: "#f3ede2", card: "#fbf7ee", foreground: "#2b2620", line: "#2b2620", accent: "#d97941" },
    chip: "#d97941",
  },
  {
    name: "Forêt",
    theme: { background: "#0f1512", card: "#17201b", foreground: "#e6efe9", line: "#31473d", accent: "#58d68d" },
    chip: "#58d68d",
  },
  {
    name: "Rose",
    theme: { background: "#faf2f4", card: "#ffffff", foreground: "#241a1e", line: "#241a1e", accent: "#ec5f8a" },
    chip: "#ec5f8a",
  },
];

function ColorRows({
  value,
  onChange,
}: {
  value: ThemeOverride | null | undefined;
  onChange: (key: keyof ThemeOverride, hex: string | undefined) => void;
}) {
  // Valeurs effectives du thème de base pour pré-remplir les pipettes.
  const [baseVals, setBaseVals] = useState<Record<string, string>>({});
  useEffect(() => {
    const computed = getComputedStyle(document.documentElement);
    const vals: Record<string, string> = {};
    for (const k of THEME_KEYS) vals[k] = computed.getPropertyValue(THEME_VARS[k]).trim();
    setBaseVals(vals);
  }, [value]);

  return (
    <div className="space-y-1.5">
      {THEME_KEYS.map((k) => {
        const overridden = Boolean(value?.[k]);
        return (
          <div key={k} className="flex items-center gap-2 rounded-lg border border-line-soft px-2.5 py-1.5">
            <span className="flex-1 text-sm font-semibold">{FIELD_LABELS[k]}</span>
            {overridden ? (
              <button
                onClick={() => onChange(k, undefined)}
                className="rounded px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase text-muted hover:bg-card-2 hover:text-danger"
                title="Revenir à la valeur du thème"
              >
                défaut
              </button>
            ) : (
              <span className="font-mono text-[10px] uppercase text-muted">hérité</span>
            )}
            <input
              type="color"
              value={value?.[k] ?? baseVals[k] ?? "#888888"}
              onChange={(e) => onChange(k, e.target.value)}
              aria-label={`Couleur : ${FIELD_LABELS[k]}`}
              className="h-8 w-11 cursor-pointer rounded-md border-2 border-line bg-card p-0.5"
            />
          </div>
        );
      })}
    </div>
  );
}

export function ThemeDialog({ onClose }: { onClose: () => void }) {
  const { theme, pages, activePageId, updateAppTheme, updatePageTheme } = useDashboard();
  const activePage = pages.find((p) => p.id === activePageId);
  const [tab, setTab] = useState<"app" | "page">("app");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Personnaliser les couleurs"
    >
      <div
        className="flex max-h-[85vh] w-full max-w-md flex-col overflow-y-auto rounded-xl border-2 border-line bg-card shadow-brutal"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-line-soft px-4 py-3">
          <h2 className="text-sm font-bold tracking-tight">Personnaliser</h2>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="rounded p-1 text-muted hover:bg-card-2 hover:text-foreground"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
              <path d="M2.5 2.5l9 9M11.5 2.5l-9 9" />
            </svg>
          </button>
        </header>

        {activePage && (
          <div className="mx-4 mt-3 grid grid-cols-2 gap-1 rounded-lg border border-line-soft bg-card-2 p-1">
            {(
              [
                ["app", "Interface"],
                ["page", `Page : ${activePage.name}`],
              ] as const
            ).map(([t, label]) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`truncate rounded-md px-2 py-1.5 text-xs font-bold ${
                  tab === t ? "border border-line bg-card shadow-brutal-sm" : "text-muted hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-4 p-4">
          {tab === "app" || !activePage ? (
            <>
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted">
                  Thèmes
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {PRESETS.map((p) => (
                    <button
                      key={p.name}
                      onClick={() => {
                        updateAppTheme(p.theme);
                        if (p.mode) setThemeMode(p.mode === "dark");
                      }}
                      className="flex items-center gap-2 rounded-lg border-2 border-line bg-card px-2 py-1.5 text-xs font-bold hover:shadow-brutal-sm"
                    >
                      <span
                        className="h-4 w-4 shrink-0 rounded-full border border-line"
                        style={{ background: p.chip }}
                        aria-hidden
                      />
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted">
                  Couleurs de l&apos;interface (pour ton compte)
                </p>
                <ColorRows value={theme} onChange={(k, v) => updateAppTheme({ [k]: v })} />
              </div>
              <button
                onClick={() => updateAppTheme(null)}
                className="self-end text-xs font-semibold text-muted underline underline-offset-2 hover:text-foreground"
              >
                Tout réinitialiser
              </button>
            </>
          ) : (
            <>
              <p className="text-xs text-muted">
                Ces couleurs ne s&apos;appliquent qu&apos;à la page{" "}
                <span className="font-semibold text-foreground">{activePage.name}</span> et
                priment sur le thème de l&apos;interface.
              </p>
              <ColorRows
                value={activePage.theme}
                onChange={(k, v) => updatePageTheme(activePage.id, { [k]: v })}
              />
              <button
                onClick={() => updatePageTheme(activePage.id, null)}
                className="self-end text-xs font-semibold text-muted underline underline-offset-2 hover:text-foreground"
              >
                Hériter du thème de l&apos;interface
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

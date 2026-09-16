"use client";

import { useState } from "react";
import { ImportDialog } from "@/components/ImportDialog";
import { useDashboard } from "@/lib/store";
import type { RoutinePage, WidgetType } from "@/lib/types";

const TYPE_GLYPH: Record<WidgetType, string> = {
  note: "📝",
  timer: "⏱",
  checklist: "☑️",
  calendar: "📅",
};

function pageSummary(page: RoutinePage): string {
  const counts = new Map<WidgetType, number>();
  for (const w of page.widgets) counts.set(w.type, (counts.get(w.type) ?? 0) + 1);
  return (
    [...counts.entries()].map(([t, n]) => `${TYPE_GLYPH[t]} ${n}`).join("  ") ||
    "Page vide"
  );
}

/** Vue d'ensemble : toutes les pages sous forme de cartes (icône ▦). */
export function PagesOverview() {
  const { pages, setActivePage, addPage, renamePage, removePage } = useDashboard();
  const [importing, setImporting] = useState(false);

  return (
    <>
      <div className="mb-4">
        <h1 className="text-lg font-black tracking-tight">Toutes les pages</h1>
        <p className="text-xs text-muted">
          Touche une carte pour ouvrir la routine.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {pages.map((p) => (
          <div
            key={p.id}
            role="button"
            tabIndex={0}
            onClick={() => setActivePage(p.id)}
            onKeyDown={(e) => e.key === "Enter" && setActivePage(p.id)}
            className="group relative flex min-h-32 cursor-pointer flex-col justify-between rounded-xl border-2 border-line bg-card p-3 text-left transition-shadow hover:shadow-brutal-sm"
          >
            <div className="flex items-start justify-between">
              <span className="text-3xl" aria-hidden>
                {p.icon ?? "▦"}
              </span>
              <span className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const name = window.prompt("Renommer la page :", p.name);
                    if (name?.trim()) renamePage(p.id, name.trim());
                  }}
                  aria-label={`Renommer ${p.name}`}
                  className="rounded p-1 text-muted hover:bg-card-2 hover:text-foreground"
                >
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                    <path d="M9.8 1.8l2.4 2.4L4.6 11.8l-3 .6.6-3z" strokeLinejoin="round" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(`Supprimer la page « ${p.name} » ?`)) {
                      removePage(p.id);
                    }
                  }}
                  aria-label={`Supprimer ${p.name}`}
                  className="rounded p-1 text-muted hover:bg-card-2 hover:text-danger"
                >
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
                    <path d="M2.5 2.5l9 9M11.5 2.5l-9 9" />
                  </svg>
                </button>
              </span>
            </div>
            <div>
              <p className="truncate text-sm font-bold">{p.name}</p>
              <p className="mt-0.5 text-[11px] text-muted">{pageSummary(p)}</p>
            </div>
          </div>
        ))}

        <button
          onClick={() => {
            const name = window.prompt("Nom de la nouvelle page :");
            if (name?.trim()) addPage(name.trim());
          }}
          className="flex min-h-32 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-line-soft text-muted hover:border-line hover:text-foreground"
        >
          <span className="text-2xl" aria-hidden>＋</span>
          <span className="text-xs font-bold">Nouvelle page</span>
        </button>

        <button
          onClick={() => setImporting(true)}
          className="flex min-h-32 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-line-soft text-muted hover:border-line hover:text-foreground"
        >
          <span className="text-2xl" aria-hidden>📥</span>
          <span className="text-xs font-bold">Importer une routine</span>
        </button>
      </div>

      {importing && <ImportDialog onClose={() => setImporting(false)} />}
    </>
  );
}

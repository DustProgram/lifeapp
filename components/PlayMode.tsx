"use client";

import { DndContext } from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";
import { useEffect, useState } from "react";
import { WidgetBody } from "@/components/grid/DashboardGrid";
import { useDashboard } from "@/lib/store";
import type { RoutinePage } from "@/lib/types";

/**
 * Mode Play : les widgets de la page défilent un par un, en grand.
 * Tous restent montés (masqués en CSS) : un timer lancé continue de tourner
 * quand on passe au bloc suivant, et les médias hors du bloc courant se
 * coupent d'eux-mêmes (IntersectionObserver).
 */
export function PlayMode({ page }: { page: RoutinePage }) {
  const { setPlaying } = useDashboard();
  const [idx, setIdx] = useState(0);
  const total = page.widgets.length;
  const clamped = Math.min(idx, total - 1);

  const prev = () => setIdx((i) => Math.max(0, i - 1));
  const next = () => setIdx((i) => Math.min(total - 1, i + 1));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "Escape") setPlaying(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  if (total === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <header className="flex items-center gap-3 border-b-2 border-line px-4 py-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-line bg-accent text-accent-ink">
          ▶
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">
            {page.icon && <span aria-hidden>{page.icon} </span>}
            {page.name}
          </p>
          <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted">
            Bloc {clamped + 1} / {total} — {page.widgets[clamped].title}
          </p>
        </div>
        <button
          onClick={() => setPlaying(false)}
          aria-label="Quitter le mode Play"
          className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-line bg-card hover:bg-card-2"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
            <path d="M2.5 2.5l9 9M11.5 2.5l-9 9" />
          </svg>
        </button>
      </header>

      {/* Barre de progression */}
      <div className="h-1 bg-card-2">
        <div
          className="h-full bg-accent transition-all duration-300"
          style={{ width: `${((clamped + 1) / total) * 100}%` }}
        />
      </div>

      <main className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto p-4">
        <DndContext>
          <SortableContext items={page.widgets.map((w) => w.id)}>
            {page.widgets.map((w, i) => (
              <div
                key={w.id}
                className={i === clamped ? "flex w-full max-w-xl" : "hidden"}
              >
                <div className="flex w-full flex-col [&>section]:min-h-64 [&>section]:flex-1">
                  <WidgetBody widget={w} />
                </div>
              </div>
            ))}
          </SortableContext>
        </DndContext>
      </main>

      <footer className="flex items-center gap-3 border-t-2 border-line px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <button
          onClick={prev}
          disabled={clamped === 0}
          aria-label="Bloc précédent"
          className="flex h-12 flex-1 items-center justify-center rounded-xl border-2 border-line bg-card text-xl font-bold hover:bg-card-2 disabled:opacity-30"
        >
          ←
        </button>
        <div className="flex shrink-0 gap-1">
          {page.widgets.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              aria-label={`Aller au bloc ${i + 1}`}
              className={`h-2 rounded-full transition-all ${
                i === clamped ? "w-5 bg-accent" : "w-2 bg-line-soft hover:bg-muted"
              }`}
            />
          ))}
        </div>
        {clamped === total - 1 ? (
          <button
            onClick={() => setPlaying(false)}
            className="flex h-12 flex-1 items-center justify-center rounded-xl border-2 border-line bg-accent text-sm font-bold text-accent-ink shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          >
            Terminer ✓
          </button>
        ) : (
          <button
            onClick={next}
            aria-label="Bloc suivant"
            className="flex h-12 flex-1 items-center justify-center rounded-xl border-2 border-line bg-accent text-xl font-bold text-accent-ink shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          >
            →
          </button>
        )}
      </footer>
    </div>
  );
}

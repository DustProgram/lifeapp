"use client";

import { useEffect, useState } from "react";
import { WidgetShell } from "@/components/grid/WidgetShell";
import { useActivePageLocked, useDashboard } from "@/lib/store";
import type { ChecklistConfig, Widget } from "@/lib/types";

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 10);

const todayKey = () => new Date().toISOString().slice(0, 10);

export function ChecklistWidget({ widget }: { widget: Widget & { type: "checklist" } }) {
  const { updateWidgetConfig } = useDashboard();
  const locked = useActivePageLocked();
  const cfg = widget.config;
  const [newLabel, setNewLabel] = useState("");

  const save = (patch: Partial<ChecklistConfig>) =>
    updateWidgetConfig(widget.id, { ...cfg, ...patch });

  // Routine quotidienne : décoche tout au premier affichage d'un nouveau jour.
  useEffect(() => {
    if (cfg.resetDaily && cfg.lastReset !== todayKey()) {
      save({
        items: cfg.items.map((i) => ({ ...i, done: false })),
        lastReset: todayKey(),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doneCount = cfg.items.filter((i) => i.done).length;
  const progress = cfg.items.length ? doneCount / cfg.items.length : 0;

  const addItem = () => {
    const label = newLabel.trim();
    if (!label) return;
    save({ items: [...cfg.items, { id: uid(), label, done: false }] });
    setNewLabel("");
  };

  return (
    <WidgetShell
      widget={widget}
      actions={
        locked ? undefined : (
        <button
          onClick={() => save({ resetDaily: !cfg.resetDaily })}
          title={cfg.resetDaily ? "Reset quotidien activé" : "Reset quotidien désactivé"}
          aria-label="Basculer le reset quotidien"
          className={`rounded p-1 hover:bg-card-2 ${cfg.resetDaily ? "text-accent-ink dark:text-accent" : "text-muted"}`}
        >
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
            <path d="M12 7a5 5 0 1 1-1.5-3.6" />
            <path d="M12 1v3h-3" />
          </svg>
        </button>
        )
      }
    >
      {cfg.description && (
        <p className="mb-2 text-xs leading-snug text-muted">{cfg.description}</p>
      )}
      <div className="mb-2 flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full border border-line-soft bg-card-2">
          <div
            className="h-full rounded-full bg-accent transition-all duration-300"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <span className="font-mono text-[10px] font-bold text-muted">
          {doneCount}/{cfg.items.length}
        </span>
      </div>

      <ul className="min-h-0 flex-1 space-y-0.5 overflow-y-auto">
        {cfg.items.map((item) => (
          <li key={item.id} className="group/item flex items-center gap-2 rounded-lg px-1 py-1 hover:bg-card-2">
            <button
              onClick={() =>
                save({
                  items: cfg.items.map((i) =>
                    i.id === item.id ? { ...i, done: !i.done } : i
                  ),
                })
              }
              aria-label={item.done ? "Décocher" : "Cocher"}
              className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border-2 border-line transition-colors ${
                item.done ? "bg-accent text-accent-ink" : "bg-card"
              }`}
            >
              {item.done && (
                <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
                  <path d="M1.5 5.5l2.5 2.5L8.5 2.5" />
                </svg>
              )}
            </button>
            <span
              className={`flex-1 text-sm ${item.done ? "text-muted line-through" : ""}`}
            >
              {item.label}
            </span>
            <button
              onClick={() => save({ items: cfg.items.filter((i) => i.id !== item.id) })}
              aria-label="Supprimer l'élément"
              className={`rounded p-0.5 text-muted opacity-0 hover:text-danger group-hover/item:opacity-100 ${
                locked ? "hidden" : ""
              }`}
            >
              <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
                <path d="M2.5 2.5l9 9M11.5 2.5l-9 9" />
              </svg>
            </button>
          </li>
        ))}
      </ul>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          addItem();
        }}
        className={`mt-2 flex gap-1.5 ${locked ? "hidden" : ""}`}
      >
        <input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="Ajouter…"
          className="min-w-0 flex-1 rounded-lg border border-line-soft bg-card-2 px-2 py-1 text-sm outline-none placeholder:text-muted focus:border-line"
        />
        <button
          type="submit"
          aria-label="Ajouter l'élément"
          className="rounded-lg border-2 border-line bg-card px-2.5 text-sm font-bold hover:bg-accent hover:text-accent-ink"
        >
          ＋
        </button>
      </form>
    </WidgetShell>
  );
}

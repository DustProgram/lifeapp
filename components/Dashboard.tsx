"use client";

import { useEffect, useRef } from "react";
import { DashboardGrid } from "@/components/grid/DashboardGrid";
import { PagesOverview } from "@/components/PagesOverview";
import { useDashboard } from "@/lib/store";
import type { RoutinePage } from "@/lib/types";

type SavedState = { pages: RoutinePage[]; activePageId: string | null };

/** Ancien format zustand/persist (v1) encore présent dans le navigateur. */
function readLegacyLocalState(): SavedState | null {
  try {
    const raw = localStorage.getItem("lifeos-dashboard");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: SavedState };
    if (parsed.state && Array.isArray(parsed.state.pages)) return parsed.state;
  } catch {}
  return null;
}

export function Dashboard() {
  const { hydrated, activePageId, hydrate } = useDashboard();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Chargement : le serveur est la source de vérité (un dashboard par
  // utilisateur). Au tout premier passage, l'ancien état localStorage est
  // migré vers le serveur.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let state: SavedState | null = null;
      try {
        const res = await fetch("/api/dashboard");
        if (res.ok) {
          state = ((await res.json()) as { state: SavedState | null }).state;
        }
      } catch {}
      if (cancelled) return;
      if (!state) {
        const legacy = readLegacyLocalState();
        if (legacy) {
          state = legacy;
          fetch("/api/dashboard", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(legacy),
          })
            .then(() => localStorage.removeItem("lifeos-dashboard"))
            .catch(() => {});
        }
      }
      hydrate(state);
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrate]);

  // Sauvegarde : chaque changement est poussé au serveur (debounce 800 ms).
  useEffect(() => {
    const unsubscribe = useDashboard.subscribe((s, prev) => {
      if (!s.hydrated) return;
      if (s.pages === prev.pages && s.activePageId === prev.activePageId) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      const payload: SavedState = { pages: s.pages, activePageId: s.activePageId };
      saveTimer.current = setTimeout(() => {
        fetch("/api/dashboard", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }).catch(() => {});
      }, 800);
    });
    return () => {
      unsubscribe();
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  if (!hydrated) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-40 animate-pulse rounded-xl border-2 border-line-soft bg-card sm:col-span-2 xl:col-span-1"
          />
        ))}
      </div>
    );
  }

  return activePageId === null ? <PagesOverview /> : <DashboardGrid />;
}

"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { RoutinePage, Widget, WidgetSize, WidgetType } from "./types";

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 10);

function defaultWidget(type: WidgetType): Widget {
  const base = { id: uid(), size: "md" as WidgetSize };
  switch (type) {
    case "note":
      return {
        ...base,
        type,
        title: "Note",
        config: { markdown: "## Nouvelle note\n\nÉcris en **Markdown**…" },
      };
    case "timer":
      return {
        ...base,
        type,
        title: "Chrono",
        size: "sm",
        config: { mode: "stopwatch" },
      };
    case "checklist":
      return {
        ...base,
        type,
        title: "Check-list",
        size: "sm",
        config: {
          resetDaily: true,
          items: [{ id: uid(), label: "Première étape", done: false }],
        },
      };
    case "calendar":
      return { ...base, type, title: "Aujourd'hui", config: {} };
  }
}

const welcomePage: RoutinePage = {
  id: "home",
  name: "Accueil",
  icon: "🏠",
  widgets: [
    {
      id: "welcome-note",
      type: "note",
      title: "Bienvenue",
      size: "md",
      config: {
        markdown:
          "## LifeOS\n\nTon espace personnel modulaire.\n\n- **＋ Widget** pour ajouter un bloc\n- **Importer** pour coller une routine JSON générée par une IA\n- Glisse les cartes pour réorganiser la grille",
      },
    },
    {
      id: "welcome-cal",
      type: "calendar",
      title: "Aujourd'hui",
      size: "md",
      config: {},
    },
  ],
};

interface DashboardState {
  pages: RoutinePage[];
  activePageId: string;
  setActivePage: (id: string) => void;
  addPage: (name: string, icon?: string) => void;
  addImportedPage: (page: RoutinePage) => void;
  renamePage: (id: string, name: string) => void;
  removePage: (id: string) => void;
  addWidget: (type: WidgetType) => void;
  updateWidget: (id: string, patch: Partial<Omit<Widget, "id" | "type">>) => void;
  updateWidgetConfig: (id: string, config: Widget["config"]) => void;
  removeWidget: (id: string) => void;
  /** Reorder within the active page: move widget `activeId` to `overId`'s slot. */
  moveWidget: (activeId: string, overId: string) => void;
}

const patchActivePage = (
  state: DashboardState,
  fn: (page: RoutinePage) => RoutinePage
) => ({
  pages: state.pages.map((p) => (p.id === state.activePageId ? fn(p) : p)),
});

export const useDashboard = create<DashboardState>()(
  persist(
    (set) => ({
      pages: [welcomePage],
      activePageId: welcomePage.id,

      setActivePage: (id) => set({ activePageId: id }),

      addPage: (name, icon) =>
        set((s) => {
          const page: RoutinePage = { id: uid(), name, icon, widgets: [] };
          return { pages: [...s.pages, page], activePageId: page.id };
        }),

      addImportedPage: (page) =>
        set((s) => ({ pages: [...s.pages, page], activePageId: page.id })),

      renamePage: (id, name) =>
        set((s) => ({
          pages: s.pages.map((p) => (p.id === id ? { ...p, name } : p)),
        })),

      removePage: (id) =>
        set((s) => {
          const pages = s.pages.filter((p) => p.id !== id);
          if (pages.length === 0) pages.push({ ...welcomePage, widgets: [] });
          return {
            pages,
            activePageId:
              s.activePageId === id ? pages[0].id : s.activePageId,
          };
        }),

      addWidget: (type) =>
        set((s) =>
          patchActivePage(s, (p) => ({
            ...p,
            widgets: [...p.widgets, defaultWidget(type)],
          }))
        ),

      updateWidget: (id, patch) =>
        set((s) =>
          patchActivePage(s, (p) => ({
            ...p,
            widgets: p.widgets.map((w) =>
              w.id === id ? ({ ...w, ...patch } as Widget) : w
            ),
          }))
        ),

      updateWidgetConfig: (id, config) =>
        set((s) =>
          patchActivePage(s, (p) => ({
            ...p,
            widgets: p.widgets.map((w) =>
              w.id === id ? ({ ...w, config } as Widget) : w
            ),
          }))
        ),

      removeWidget: (id) =>
        set((s) =>
          patchActivePage(s, (p) => ({
            ...p,
            widgets: p.widgets.filter((w) => w.id !== id),
          }))
        ),

      moveWidget: (activeId, overId) =>
        set((s) =>
          patchActivePage(s, (p) => {
            const from = p.widgets.findIndex((w) => w.id === activeId);
            const to = p.widgets.findIndex((w) => w.id === overId);
            if (from < 0 || to < 0 || from === to) return p;
            const widgets = [...p.widgets];
            const [moved] = widgets.splice(from, 1);
            widgets.splice(to, 0, moved);
            return { ...p, widgets };
          })
        ),
    }),
    { name: "lifeos-dashboard", version: 1 }
  )
);

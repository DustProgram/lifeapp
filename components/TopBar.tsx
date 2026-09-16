"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ImportDialog } from "@/components/ImportDialog";
import { ThemeDialog } from "@/components/ThemeDialog";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useActivePageLocked, useDashboard } from "@/lib/store";
import type { WidgetType } from "@/lib/types";

const WIDGET_TYPES: { type: WidgetType; label: string; hint: string }[] = [
  { type: "note", label: "Bloc texte", hint: "Markdown" },
  { type: "timer", label: "Timer", hint: "Chrono · minuteur · séries" },
  { type: "checklist", label: "Check-list", hint: "Routine quotidienne" },
  { type: "calendar", label: "Calendrier", hint: "Événements du jour" },
  { type: "media", label: "Média", hint: "Photo · GIF · vidéo en boucle" },
];

function useClickOutside(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | TouchEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("touchstart", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("touchstart", close);
    };
  }, [open, onClose]);
  return ref;
}

function AddWidgetMenu() {
  const { addWidget } = useDashboard();
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(open, () => setOpen(false));

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Ajouter un widget"
        className="flex h-9 items-center gap-1.5 rounded-lg border-2 border-line bg-accent px-3 text-sm font-bold text-accent-ink shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
      >
        ＋<span className="hidden sm:inline text-xs">Widget</span>
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-40 w-56 overflow-hidden rounded-xl border-2 border-line bg-card shadow-brutal">
          {WIDGET_TYPES.map((w) => (
            <button
              key={w.type}
              onClick={() => {
                addWidget(w.type);
                setOpen(false);
              }}
              className="flex w-full flex-col items-start gap-0.5 border-b border-line-soft px-3 py-2.5 text-left last:border-b-0 hover:bg-card-2"
            >
              <span className="text-sm font-semibold">{w.label}</span>
              <span className="text-[11px] text-muted">{w.hint}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PageTabs() {
  const { pages, activePageId, setActivePage, addPage, removePage, renamePage } =
    useDashboard();

  return (
    <nav className="hidden min-w-0 flex-1 items-center gap-1 overflow-x-auto md:flex">
      {pages.map((p) => {
        const active = p.id === activePageId;
        return (
          <button
            key={p.id}
            onClick={() => setActivePage(p.id)}
            onDoubleClick={() => {
              const name = window.prompt("Renommer la page :", p.name);
              if (name?.trim()) renamePage(p.id, name.trim());
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              if (p.locked) {
                window.alert("Page verrouillée : déverrouille-la (🔒) avant de la supprimer.");
                return;
              }
              if (window.confirm(`Supprimer la page « ${p.name} » ?`)) {
                removePage(p.id);
              }
            }}
            title="Double-clic : renommer · Clic droit : supprimer"
            className={`flex h-9 shrink-0 items-center gap-1.5 rounded-lg border-2 px-3 text-xs font-bold transition-colors ${
              active
                ? "border-line bg-card shadow-brutal-sm"
                : "border-transparent text-muted hover:border-line-soft hover:text-foreground"
            }`}
          >
            {p.icon && <span aria-hidden>{p.icon}</span>}
            {p.name}
            {p.locked && (
              <span className="text-[10px]" aria-label="verrouillée">
                🔒
              </span>
            )}
          </button>
        );
      })}
      <button
        onClick={() => {
          const name = window.prompt("Nom de la nouvelle page :");
          if (name?.trim()) addPage(name.trim());
        }}
        aria-label="Nouvelle page"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-line-soft text-muted hover:border-line hover:text-foreground"
      >
        ＋
      </button>
    </nav>
  );
}

/** Menu ⋮ (mobile) : les actions secondaires regroupées. */
function OverflowMenu({
  onImport,
  onCustomize,
  onLogout,
}: {
  onImport: () => void;
  onCustomize: () => void;
  onLogout: () => void;
}) {
  const { setActivePage, activePageId, togglePageLock } = useDashboard();
  const locked = useActivePageLocked();
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(open, () => setOpen(false));
  const item =
    "flex w-full items-center gap-2 border-b border-line-soft px-3 py-2.5 text-left text-sm font-semibold last:border-b-0 hover:bg-card-2";

  return (
    <div ref={ref} className="relative md:hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Menu"
        className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-line bg-card text-lg leading-none hover:bg-card-2"
      >
        ⋮
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-40 w-52 overflow-hidden rounded-xl border-2 border-line bg-card shadow-brutal">
          <button
            className={item}
            onClick={() => {
              setActivePage(null);
              setOpen(false);
            }}
          >
            ▦ Toutes les pages
          </button>
          <button
            className={item}
            onClick={() => {
              onImport();
              setOpen(false);
            }}
          >
            📥 Importer une routine
          </button>
          <button
            className={item}
            onClick={() => {
              onCustomize();
              setOpen(false);
            }}
          >
            🎨 Personnaliser
          </button>
          {activePageId !== null && (
            <button
              className={item}
              onClick={() => {
                togglePageLock(activePageId);
                setOpen(false);
              }}
            >
              {locked ? "🔓 Déverrouiller la page" : "🔒 Verrouiller la page"}
            </button>
          )}
          <button className={`${item} hover:text-danger`} onClick={onLogout}>
            ↩ Se déconnecter
          </button>
        </div>
      )}
    </div>
  );
}

export function TopBar() {
  const router = useRouter();
  const [importing, setImporting] = useState(false);
  const [theming, setTheming] = useState(false);
  const { pages, activePageId, setActivePage, togglePageLock, togglePageLayout, setPlaying } =
    useDashboard();
  const activePage = pages.find((p) => p.id === activePageId);
  const locked = Boolean(activePage?.locked);
  const column = activePage?.layout === "column";

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <>
      <header className="sticky top-0 z-30 border-b-2 border-line bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2.5 sm:gap-3 sm:py-3">
          {/* Logo → vue d'ensemble de toutes les pages */}
          <button
            onClick={() => setActivePage(null)}
            aria-label="Toutes les pages"
            className="flex shrink-0 items-center gap-2"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-line bg-accent font-mono text-sm font-black text-accent-ink shadow-brutal-sm">
              ▦
            </span>
            <span className="hidden text-sm font-black tracking-tight lg:block">
              LifeOS
            </span>
          </button>

          {/* Mobile : nom de la page courante, tape → vue d'ensemble */}
          <button
            onClick={() => setActivePage(null)}
            className="flex h-9 min-w-0 flex-1 items-center gap-1.5 rounded-lg px-2 text-left md:hidden"
          >
            <span className="truncate text-sm font-bold">
              {activePage ? (
                <>
                  {activePage.icon && <span aria-hidden>{activePage.icon} </span>}
                  {activePage.name}
                  {locked && <span aria-label="verrouillée"> 🔒</span>}
                </>
              ) : (
                "Toutes les pages"
              )}
            </span>
            {activePage && (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="shrink-0 text-muted" aria-hidden>
                <path d="M2 4l3 3 3-3" />
              </svg>
            )}
          </button>

          {/* Desktop : onglets */}
          <PageTabs />

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setImporting(true)}
              className="hidden h-9 items-center rounded-lg border-2 border-line bg-card px-3 text-xs font-bold hover:bg-card-2 md:flex"
            >
              Importer
            </button>
            {activePage && activePage.widgets.length > 0 && (
              <button
                onClick={() => setPlaying(true)}
                aria-label="Mode Play : dérouler les blocs un par un"
                title="Mode Play : dérouler les blocs un par un"
                className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-line bg-card hover:bg-accent hover:text-accent-ink"
              >
                <svg width="13" height="13" viewBox="0 0 14 14" fill="currentColor" aria-hidden>
                  <path d="M3 1.8v10.4L12 7z" />
                </svg>
              </button>
            )}
            {activePage && (
              <button
                onClick={() => togglePageLayout(activePage.id)}
                aria-label={column ? "Passer en grille libre" : "Passer en colonne ordonnée"}
                title={
                  column
                    ? "Colonne ordonnée — cliquer pour la grille libre"
                    : "Grille libre — cliquer pour la colonne ordonnée"
                }
                aria-pressed={column}
                className={`hidden h-9 w-9 items-center justify-center rounded-lg border-2 border-line sm:flex ${
                  column ? "bg-accent text-accent-ink shadow-brutal-sm" : "bg-card text-muted hover:bg-card-2 hover:text-foreground"
                }`}
              >
                {column ? (
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                    <rect x="3.5" y="2" width="9" height="3.4" rx="1" />
                    <rect x="3.5" y="6.8" width="9" height="3.4" rx="1" />
                    <rect x="3.5" y="11.6" width="9" height="2.4" rx="1" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                    <rect x="2" y="2" width="5.4" height="5.4" rx="1" />
                    <rect x="8.6" y="2" width="5.4" height="5.4" rx="1" />
                    <rect x="2" y="8.6" width="5.4" height="5.4" rx="1" />
                    <rect x="8.6" y="8.6" width="5.4" height="5.4" rx="1" />
                  </svg>
                )}
              </button>
            )}
            {activePageId !== null && !locked && <AddWidgetMenu />}
            {activePage && (
              <button
                onClick={() => togglePageLock(activePage.id)}
                aria-label={locked ? "Déverrouiller la page" : "Verrouiller la page"}
                title={
                  locked
                    ? "Page verrouillée — cliquer pour déverrouiller"
                    : "Verrouiller la page (fige les widgets)"
                }
                aria-pressed={locked}
                className={`hidden h-9 w-9 items-center justify-center rounded-lg border-2 md:flex ${
                  locked
                    ? "border-line bg-accent text-accent-ink shadow-brutal-sm"
                    : "border-line bg-card text-muted hover:bg-card-2 hover:text-foreground"
                }`}
              >
                {locked ? (
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                    <rect x="3" y="7" width="10" height="7" rx="1.5" />
                    <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                    <rect x="3" y="7" width="10" height="7" rx="1.5" />
                    <path d="M5.5 7V5a2.5 2.5 0 0 1 4.9-.7" />
                  </svg>
                )}
              </button>
            )}
            <button
              onClick={() => setTheming(true)}
              aria-label="Personnaliser les couleurs"
              title="Personnaliser les couleurs"
              className="hidden h-9 w-9 items-center justify-center rounded-lg border-2 border-line bg-card hover:bg-card-2 md:flex"
            >
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
                <path d="M8 1.5a6.5 6.5 0 1 0 0 13c.9 0 1.3-.6 1.3-1.2 0-.5-.3-.9-.6-1.2-.3-.3-.6-.7-.6-1.2 0-.9.7-1.4 1.6-1.4h1.5c1.8 0 3.3-1.2 3.3-3C14.5 4 11.6 1.5 8 1.5z" strokeLinejoin="round" />
                <circle cx="5" cy="6" r="1" fill="currentColor" stroke="none" />
                <circle cx="8.2" cy="4.4" r="1" fill="currentColor" stroke="none" />
                <circle cx="11.3" cy="6" r="1" fill="currentColor" stroke="none" />
                <circle cx="4.6" cy="9.4" r="1" fill="currentColor" stroke="none" />
              </svg>
            </button>
            <ThemeToggle />
            <button
              onClick={logout}
              aria-label="Se déconnecter"
              title="Se déconnecter"
              className="hidden h-9 w-9 items-center justify-center rounded-lg border-2 border-line bg-card text-sm hover:bg-card-2 hover:text-danger md:flex"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M6 14H3.5a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1H6" />
                <path d="M10.5 11.5L14 8l-3.5-3.5M14 8H6" />
              </svg>
            </button>
            <OverflowMenu
              onImport={() => setImporting(true)}
              onCustomize={() => setTheming(true)}
              onLogout={logout}
            />
          </div>
        </div>
      </header>
      {importing && <ImportDialog onClose={() => setImporting(false)} />}
      {theming && <ThemeDialog onClose={() => setTheming(false)} />}
    </>
  );
}

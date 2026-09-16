"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ImportDialog } from "@/components/ImportDialog";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useDashboard } from "@/lib/store";
import type { WidgetType } from "@/lib/types";

const WIDGET_TYPES: { type: WidgetType; label: string; hint: string }[] = [
  { type: "note", label: "Bloc texte", hint: "Markdown" },
  { type: "timer", label: "Timer", hint: "Chrono · minuteur · séries" },
  { type: "checklist", label: "Check-list", hint: "Routine quotidienne" },
  { type: "calendar", label: "Calendrier", hint: "Événements du jour" },
];

function AddWidgetMenu() {
  const { addWidget } = useDashboard();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-8 items-center gap-1.5 rounded-lg border-2 border-line bg-accent px-3 text-xs font-bold text-accent-ink shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
      >
        ＋ Widget
      </button>
      {open && (
        <div className="absolute right-0 top-10 z-40 w-56 overflow-hidden rounded-xl border-2 border-line bg-card shadow-brutal">
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
    <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
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
              if (pages.length > 1 && window.confirm(`Supprimer la page « ${p.name} » ?`)) {
                removePage(p.id);
              }
            }}
            title="Double-clic : renommer · Clic droit : supprimer"
            className={`flex h-8 shrink-0 items-center gap-1.5 rounded-lg border-2 px-3 text-xs font-bold transition-colors ${
              active
                ? "border-line bg-card shadow-brutal-sm"
                : "border-transparent text-muted hover:border-line-soft hover:text-foreground"
            }`}
          >
            {p.icon && <span aria-hidden>{p.icon}</span>}
            {p.name}
          </button>
        );
      })}
      <button
        onClick={() => {
          const name = window.prompt("Nom de la nouvelle page :");
          if (name?.trim()) addPage(name.trim());
        }}
        aria-label="Nouvelle page"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-line-soft text-muted hover:border-line hover:text-foreground"
      >
        ＋
      </button>
    </nav>
  );
}

export function TopBar() {
  const router = useRouter();
  const [importing, setImporting] = useState(false);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <>
      <header className="sticky top-0 z-30 border-b-2 border-line bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-line bg-accent font-mono text-sm font-black text-accent-ink shadow-brutal-sm">
              ▦
            </span>
            <span className="hidden text-sm font-black tracking-tight sm:block">
              LifeOS
            </span>
          </Link>

          <PageTabs />

          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => setImporting(true)}
              className="flex h-8 items-center rounded-lg border-2 border-line bg-card px-3 text-xs font-bold hover:bg-card-2"
            >
              Importer
            </button>
            <AddWidgetMenu />
            <ThemeToggle />
            <Link
              href="/logs"
              aria-label="Journal de sécurité"
              title="Journal de connexions"
              className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-line bg-card text-sm hover:bg-card-2"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
                <rect x="3" y="1.5" width="10" height="13" rx="1.5" />
                <path d="M6 5h4M6 8h4M6 11h2.5" />
              </svg>
            </Link>
            <button
              onClick={logout}
              aria-label="Se déconnecter"
              title="Se déconnecter"
              className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-line bg-card text-sm hover:bg-card-2 hover:text-danger"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M6 14H3.5a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1H6" />
                <path d="M10.5 11.5L14 8l-3.5-3.5M14 8H6" />
              </svg>
            </button>
          </div>
        </div>
      </header>
      {importing && <ImportDialog onClose={() => setImporting(false)} />}
    </>
  );
}

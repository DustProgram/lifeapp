"use client";

import { useCallback, useEffect, useState } from "react";
import { WidgetShell } from "@/components/grid/WidgetShell";
import { useActivePageLocked, useDashboard } from "@/lib/store";
import type { CalendarEvent, Widget } from "@/lib/types";

const timeFmt = new Intl.DateTimeFormat("fr-FR", {
  hour: "2-digit",
  minute: "2-digit",
});

export function CalendarWidget({ widget }: { widget: Widget & { type: "calendar" } }) {
  const { updateWidgetConfig } = useDashboard();
  const locked = useActivePageLocked();
  const cfg = widget.config;

  const [events, setEvents] = useState<CalendarEvent[] | null>(null);
  const [loadedAt, setLoadedAt] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showConfig, setShowConfig] = useState(!cfg.icsUrl);
  const [icsDraft, setIcsDraft] = useState(cfg.icsUrl ?? "");
  const [nativeDraft, setNativeDraft] = useState(cfg.nativeUrl ?? "");

  const load = useCallback(async () => {
    if (!cfg.icsUrl) return;
    setLoading(true);
    setError(null);
    try {
      const from = new Date();
      from.setHours(0, 0, 0, 0);
      const to = new Date(from.getTime() + 86400000);
      const params = new URLSearchParams({
        url: cfg.icsUrl,
        from: from.toISOString(),
        to: to.toISOString(),
      });
      const res = await fetch(`/api/calendar?${params}`);
      const data = (await res.json()) as { events?: CalendarEvent[]; error?: string };
      if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
      setEvents(data.events ?? []);
      setLoadedAt(Date.now());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de chargement.");
    } finally {
      setLoading(false);
    }
  }, [cfg.icsUrl]);

  useEffect(() => {
    // setTimeout évite un setState synchrone dans le corps de l'effet.
    const t = setTimeout(load, 0);
    // Rafraîchit toutes les 10 minutes.
    const id = setInterval(load, 10 * 60 * 1000);
    return () => {
      clearTimeout(t);
      clearInterval(id);
    };
  }, [load]);

  const nativeHref = cfg.nativeUrl || "https://calendar.google.com";

  return (
    <WidgetShell
      widget={widget}
      actions={
        <>
          <button
            onClick={load}
            aria-label="Rafraîchir"
            className="rounded p-1 text-muted hover:bg-card-2 hover:text-foreground"
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className={loading ? "animate-spin" : ""} aria-hidden>
              <path d="M12 7a5 5 0 1 1-1.5-3.6" />
              <path d="M12 1v3h-3" />
            </svg>
          </button>
          {!locked && (
            <button
              onClick={() => setShowConfig((s) => !s)}
              aria-label="Configurer le calendrier"
              className="rounded p-1 text-muted hover:bg-card-2 hover:text-foreground"
            >
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                <circle cx="7" cy="7" r="2" />
                <path d="M7 1v2M7 11v2M1 7h2M11 7h2M2.8 2.8l1.4 1.4M9.8 9.8l1.4 1.4M11.2 2.8L9.8 4.2M4.2 9.8l-1.4 1.4" />
              </svg>
            </button>
          )}
        </>
      }
    >
      {showConfig && !locked ? (
        <div className="flex flex-1 flex-col gap-2">
          <label className="flex flex-col gap-1 text-[10px] font-bold uppercase tracking-wider text-muted">
            Flux ICS (lecture seule)
            <input
              value={icsDraft}
              onChange={(e) => setIcsDraft(e.target.value)}
              placeholder="https://calendar.google.com/…/basic.ics"
              className="rounded-lg border border-line-soft bg-card-2 px-2 py-1.5 font-mono text-xs text-foreground outline-none focus:border-line"
            />
          </label>
          <p className="text-[11px] leading-snug text-muted">
            Google : Paramètres du calendrier → « Adresse secrète au format iCal ».
            Apple : partage public du calendrier iCloud (webcal://…).
          </p>
          <label className="flex flex-col gap-1 text-[10px] font-bold uppercase tracking-wider text-muted">
            Lien vers l&apos;app native (optionnel)
            <input
              value={nativeDraft}
              onChange={(e) => setNativeDraft(e.target.value)}
              placeholder="https://calendar.google.com ou calshow://"
              className="rounded-lg border border-line-soft bg-card-2 px-2 py-1.5 font-mono text-xs text-foreground outline-none focus:border-line"
            />
          </label>
          <div className="mt-auto flex justify-end gap-2">
            <button
              onClick={() => setShowConfig(false)}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-muted hover:bg-card-2"
            >
              Annuler
            </button>
            <button
              onClick={() => {
                updateWidgetConfig(widget.id, {
                  icsUrl: icsDraft.trim() || undefined,
                  nativeUrl: nativeDraft.trim() || undefined,
                });
                setShowConfig(false);
                setEvents(null);
              }}
              className="rounded-lg border-2 border-line bg-accent px-3 py-1.5 text-xs font-bold text-accent-ink shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            >
              Enregistrer
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col">
          {!cfg.icsUrl ? (
            <p className="m-auto text-center text-sm text-muted">
              Aucun flux configuré.
              <br />
              Ajoute une URL ICS via ⚙.
            </p>
          ) : error ? (
            <p className="m-auto text-center text-sm text-danger">{error}</p>
          ) : events === null ? (
            <p className="m-auto text-sm text-muted">Chargement…</p>
          ) : events.length === 0 ? (
            <p className="m-auto text-center text-sm text-muted">
              Rien aujourd&apos;hui. Journée libre ✳
            </p>
          ) : (
            <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto">
              {events.map((ev) => {
                const past = new Date(ev.end).getTime() < loadedAt;
                return (
                  <li
                    key={ev.id}
                    className={`flex items-baseline gap-2 rounded-lg border border-line-soft px-2 py-1.5 ${
                      past ? "opacity-50" : ""
                    }`}
                  >
                    <span className="shrink-0 font-mono text-[11px] font-bold tabular-nums text-muted">
                      {ev.allDay
                        ? "JOUR"
                        : `${timeFmt.format(new Date(ev.start))}`}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{ev.title}</span>
                      {ev.location && (
                        <span className="block truncate text-[11px] text-muted">
                          {ev.location}
                        </span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
          <a
            href={nativeHref}
            target="_blank"
            rel="noreferrer"
            className="mt-2 block rounded-lg border-2 border-line bg-card py-1.5 text-center text-xs font-bold hover:bg-accent hover:text-accent-ink"
          >
            Ouvrir le calendrier ↗
          </a>
        </div>
      )}
    </WidgetShell>
  );
}

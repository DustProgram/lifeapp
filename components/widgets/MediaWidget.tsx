"use client";

import { useEffect, useRef, useState } from "react";
import { WidgetShell } from "@/components/grid/WidgetShell";
import { useDashboard } from "@/lib/store";
import type { Widget } from "@/lib/types";

const VIDEO_RE = /\.(mp4|webm|mov|m4v)(\?.*)?$/i;

/** Transforme les liens de page Giphy en URL média directe. */
export function normalizeMediaUrl(raw: string): string {
  const url = raw.trim();
  const giphy = url.match(/^https?:\/\/giphy\.com\/gifs\/(?:.*-)?([a-zA-Z0-9]+)$/);
  if (giphy) return `https://media.giphy.com/media/${giphy[1]}/giphy.mp4`;
  return url;
}

const isVideo = (url: string) => VIDEO_RE.test(url);

/**
 * Ne monte le média que lorsqu'il approche de l'écran, et coupe la lecture
 * dès qu'il n'est plus visible : zéro décodage ni bande passante en fond.
 */
function useVisible<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const obs = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: "120px", threshold: 0.05 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

function MediaPlayer({
  url,
  sound,
  fit,
}: {
  url: string;
  sound: boolean;
  fit: "cover" | "contain";
}) {
  const { ref, visible } = useVisible<HTMLDivElement>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState(false);
  const objectFit = fit === "cover" ? "object-cover" : "object-contain";

  // Lecture uniquement quand le widget est à l'écran.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (visible) {
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  }, [visible, url]);

  if (error) {
    return (
      <p className="m-auto p-3 text-center text-xs text-danger">
        Média illisible. Vérifie que l&apos;URL pointe directement vers un
        fichier image, GIF ou vidéo (mp4/webm).
      </p>
    );
  }

  return (
    <div ref={ref} className="relative min-h-36 flex-1 overflow-hidden rounded-lg bg-card-2">
      {visible ? (
        isVideo(url) ? (
          <video
            ref={videoRef}
            src={url}
            loop
            muted={!sound}
            playsInline
            autoPlay
            preload="metadata"
            onError={() => setError(true)}
            className={`absolute inset-0 h-full w-full ${objectFit}`}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setError(true)}
            className={`absolute inset-0 h-full w-full ${objectFit}`}
          />
        )
      ) : (
        // Hors écran : simple aplat, le GIF/la vidéo ne consomme rien.
        <div className="absolute inset-0 flex items-center justify-center text-2xl text-muted">
          ▶
        </div>
      )}
    </div>
  );
}

export function MediaWidget({ widget }: { widget: Widget & { type: "media" } }) {
  const { updateWidgetConfig } = useDashboard();
  const cfg = widget.config;
  const [showConfig, setShowConfig] = useState(!cfg.url);
  const [draft, setDraft] = useState(cfg.url ?? "");

  return (
    <WidgetShell
      widget={widget}
      actions={
        <>
          {cfg.url && isVideo(cfg.url) && (
            <button
              onClick={() => updateWidgetConfig(widget.id, { ...cfg, sound: !cfg.sound })}
              aria-label={cfg.sound ? "Couper le son" : "Activer le son"}
              title={cfg.sound ? "Couper le son" : "Activer le son"}
              className={`rounded p-1 hover:bg-card-2 ${cfg.sound ? "text-foreground" : "text-muted"}`}
            >
              {cfg.sound ? (
                <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
                  <path d="M8 2.5L4.5 5.5H2v5h2.5L8 13.5zM10.5 5.5a3.5 3.5 0 0 1 0 5M12 3.5a6 6 0 0 1 0 9" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M8 2.5L4.5 5.5H2v5h2.5L8 13.5z" stroke="none" />
                </svg>
              ) : (
                <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
                  <path d="M8 2.5L4.5 5.5H2v5h2.5L8 13.5z" />
                  <path d="M10.5 6l4 4M14.5 6l-4 4" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" />
                </svg>
              )}
            </button>
          )}
          {cfg.url && (
            <button
              onClick={() =>
                updateWidgetConfig(widget.id, {
                  ...cfg,
                  fit: cfg.fit === "cover" ? "contain" : "cover",
                })
              }
              aria-label="Ajustement du média"
              title={cfg.fit === "cover" ? "Afficher en entier" : "Remplir la carte"}
              className="rounded p-1 text-muted hover:bg-card-2 hover:text-foreground"
            >
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
                <path d="M5 1.5H1.5V5M9 1.5h3.5V5M5 12.5H1.5V9M9 12.5h3.5V9" />
              </svg>
            </button>
          )}
          <button
            onClick={() => {
              setDraft(cfg.url ?? "");
              setShowConfig((s) => !s);
            }}
            aria-label="Configurer le média"
            className="rounded p-1 text-muted hover:bg-card-2 hover:text-foreground"
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
              <circle cx="7" cy="7" r="2" />
              <path d="M7 1v2M7 11v2M1 7h2M11 7h2M2.8 2.8l1.4 1.4M9.8 9.8l1.4 1.4M11.2 2.8L9.8 4.2M4.2 9.8l-1.4 1.4" />
            </svg>
          </button>
        </>
      }
    >
      {showConfig ? (
        <div className="flex flex-1 flex-col gap-2">
          <label className="flex flex-col gap-1 text-[10px] font-bold uppercase tracking-wider text-muted">
            URL du média (image · GIF · mp4/webm)
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="https://media.giphy.com/media/…/giphy.mp4"
              className="rounded-lg border border-line-soft bg-card-2 px-2 py-1.5 font-mono text-xs text-foreground outline-none focus:border-line"
            />
          </label>
          <p className="text-[11px] leading-snug text-muted">
            Trouve des GIF sur{" "}
            <a href="https://giphy.com" target="_blank" rel="noreferrer" className="underline underline-offset-2">giphy.com</a>{" "}
            ou{" "}
            <a href="https://tenor.com" target="_blank" rel="noreferrer" className="underline underline-offset-2">tenor.com</a>{" "}
            (clic droit sur le GIF → « Copier l&apos;adresse »). Un lien de page
            Giphy est converti automatiquement. Astuce : la version <b>.mp4</b>{" "}
            d&apos;un GIF est bien plus légère.
          </p>
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
                  ...cfg,
                  url: normalizeMediaUrl(draft) || undefined,
                });
                setShowConfig(false);
              }}
              className="rounded-lg border-2 border-line bg-accent px-3 py-1.5 text-xs font-bold text-accent-ink shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            >
              Enregistrer
            </button>
          </div>
        </div>
      ) : cfg.url ? (
        <MediaPlayer key={cfg.url} url={cfg.url} sound={cfg.sound} fit={cfg.fit} />
      ) : (
        <p className="m-auto text-center text-sm text-muted">
          Aucun média. Ajoute une URL via ⚙.
        </p>
      )}
    </WidgetShell>
  );
}

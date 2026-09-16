"use client";

import { useEffect, useRef, useState } from "react";
import { WidgetShell } from "@/components/grid/WidgetShell";
import { useActivePageLocked, useDashboard } from "@/lib/store";
import type { TimerConfig, Widget } from "@/lib/types";

function fmt(totalSec: number): string {
  const s = Math.max(0, Math.ceil(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(sec).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

function beep(times = 1) {
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    for (let i = 0; i < times; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.08, ctx.currentTime + i * 0.25);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.25 + 0.18);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.25);
      osc.stop(ctx.currentTime + i * 0.25 + 0.2);
    }
    setTimeout(() => ctx.close(), times * 250 + 400);
  } catch {
    // audio is best-effort
  }
}

/** Interval phases: work/rest alternation, no rest after the final set. */
function buildPhases(cfg: TimerConfig): { kind: "work" | "rest"; sec: number; set: number }[] {
  const sets = cfg.sets ?? 1;
  const phases: { kind: "work" | "rest"; sec: number; set: number }[] = [];
  for (let i = 1; i <= sets; i++) {
    phases.push({ kind: "work", sec: cfg.workSec ?? 30, set: i });
    if (i < sets && (cfg.restSec ?? 0) > 0) {
      phases.push({ kind: "rest", sec: cfg.restSec ?? 0, set: i });
    }
  }
  return phases;
}

export function TimerWidget({ widget }: { widget: Widget & { type: "timer" } }) {
  const { updateWidgetConfig } = useDashboard();
  const locked = useActivePageLocked();
  const cfg = widget.config;

  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [displaySec, setDisplaySec] = useState(() =>
    cfg.mode === "countdown"
      ? cfg.durationSec ?? 60
      : cfg.mode === "interval"
        ? cfg.workSec ?? 30
        : 0
  );
  const [showConfig, setShowConfig] = useState(false);

  // Timestamp-based bookkeeping so the display never drifts. The refs are
  // only touched from handlers and the tick effect, never during render.
  const endAtRef = useRef(0); // countdown / interval : end of current phase
  const accumRef = useRef(0); // stopwatch : accumulated ms when paused
  const startedAtRef = useRef(0);
  const phaseIdxRef = useRef(0); // source of truth, mirrored in phaseIdx state
  const phases = cfg.mode === "interval" ? buildPhases(cfg) : [];

  useEffect(() => {
    if (!running) return;
    const tickPhases = cfg.mode === "interval" ? buildPhases(cfg) : [];
    const id = setInterval(() => {
      const now = Date.now();
      if (cfg.mode === "stopwatch") {
        setDisplaySec((accumRef.current + now - startedAtRef.current) / 1000);
        return;
      }
      const remaining = (endAtRef.current - now) / 1000;
      if (remaining > 0) {
        setDisplaySec(remaining);
        return;
      }
      if (cfg.mode === "countdown") {
        setDisplaySec(0);
        setRunning(false);
        setDone(true);
        beep(3);
        return;
      }
      // interval: advance to next phase
      const next = phaseIdxRef.current + 1;
      const ph = tickPhases[next];
      if (!ph) {
        setDisplaySec(0);
        setRunning(false);
        setDone(true);
        beep(3);
        return;
      }
      phaseIdxRef.current = next;
      setPhaseIdx(next);
      endAtRef.current = now + ph.sec * 1000;
      setDisplaySec(ph.sec);
      beep(ph.kind === "work" ? 2 : 1);
    }, 150);
    return () => clearInterval(id);
  }, [running, cfg]);

  const reset = (c: TimerConfig = cfg) => {
    setRunning(false);
    setDone(false);
    phaseIdxRef.current = 0;
    setPhaseIdx(0);
    accumRef.current = 0;
    setDisplaySec(
      c.mode === "countdown" ? c.durationSec ?? 60 : c.mode === "interval" ? c.workSec ?? 30 : 0
    );
  };

  const toggle = () => {
    if (done) {
      reset();
      return;
    }
    if (running) {
      if (cfg.mode === "stopwatch") {
        accumRef.current += Date.now() - startedAtRef.current;
      } else {
        accumRef.current = endAtRef.current - Date.now(); // remaining ms
      }
      setRunning(false);
      return;
    }
    const now = Date.now();
    if (cfg.mode === "stopwatch") {
      startedAtRef.current = now;
    } else if (accumRef.current > 0) {
      endAtRef.current = now + accumRef.current; // resume
      accumRef.current = 0;
    } else {
      const first =
        cfg.mode === "interval" ? phases[phaseIdx]?.sec ?? 30 : cfg.durationSec ?? 60;
      endAtRef.current = now + displaySec * 1000 || now + first * 1000;
    }
    setRunning(true);
  };

  const phase = cfg.mode === "interval" ? phases[phaseIdx] : undefined;
  const isRest = phase?.kind === "rest";

  return (
    <WidgetShell
      widget={widget}
      actions={
        locked ? undefined : (
          <button
            onClick={() => setShowConfig((s) => !s)}
            aria-label="Configurer le timer"
            className="rounded p-1 text-muted hover:bg-card-2 hover:text-foreground"
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
              <circle cx="7" cy="7" r="2" />
              <path d="M7 1v2M7 11v2M1 7h2M11 7h2M2.8 2.8l1.4 1.4M9.8 9.8l1.4 1.4M11.2 2.8L9.8 4.2M4.2 9.8l-1.4 1.4" />
            </svg>
          </button>
        )
      }
    >
      {showConfig && !locked ? (
        <TimerConfigForm
          cfg={cfg}
          onSave={(c) => {
            updateWidgetConfig(widget.id, c);
            setShowConfig(false);
            reset(c);
          }}
          onCancel={() => setShowConfig(false)}
        />
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-3">
          {cfg.mode === "interval" && phase && (
            <div
              className={`rounded-full border-2 border-line px-3 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest ${
                done
                  ? "bg-accent text-accent-ink"
                  : isRest
                    ? "bg-card-2 text-muted"
                    : "bg-accent text-accent-ink"
              }`}
            >
              {done ? "Terminé" : isRest ? `Repos · série ${phase.set}` : `Série ${phase.set}/${cfg.sets ?? 1}`}
            </div>
          )}
          <div
            className={`font-mono text-5xl font-bold tabular-nums tracking-tight ${
              done ? "text-accent" : running && isRest ? "text-muted" : ""
            }`}
          >
            {fmt(displaySec)}
          </div>
          {cfg.mode === "countdown" && done && (
            <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-accent">
              Terminé
            </div>
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={toggle}
              className={`rounded-lg border-2 border-line px-5 py-1.5 text-sm font-bold shadow-brutal-sm transition-transform active:translate-x-0.5 active:translate-y-0.5 active:shadow-none ${
                running ? "bg-card-2" : "bg-accent text-accent-ink"
              }`}
            >
              {done ? "Relancer" : running ? "Pause" : "Démarrer"}
            </button>
            <button
              onClick={() => reset()}
              aria-label="Réinitialiser"
              className="rounded-lg border-2 border-line-soft px-3 py-1.5 text-sm font-semibold text-muted hover:border-line hover:text-foreground"
            >
              ↺
            </button>
          </div>
        </div>
      )}
    </WidgetShell>
  );
}

function NumField({
  label,
  value,
  onChange,
  min = 0,
  max = 5940,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <label className="flex flex-col gap-1 text-[10px] font-bold uppercase tracking-wider text-muted">
      {label}
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Math.max(min, Math.min(max, Number(e.target.value) || 0)))}
        className="w-full rounded-lg border border-line-soft bg-card-2 px-2 py-1 font-mono text-sm font-semibold text-foreground outline-none focus:border-line"
      />
    </label>
  );
}

function TimerConfigForm({
  cfg,
  onSave,
  onCancel,
}: {
  cfg: TimerConfig;
  onSave: (c: TimerConfig) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<TimerConfig>({
    mode: cfg.mode,
    durationSec: cfg.durationSec ?? 300,
    sets: cfg.sets ?? 4,
    workSec: cfg.workSec ?? 40,
    restSec: cfg.restSec ?? 60,
  });

  return (
    <div className="flex flex-1 flex-col gap-3">
      <div className="grid grid-cols-3 gap-1 rounded-lg border border-line-soft bg-card-2 p-1">
        {(
          [
            ["stopwatch", "Chrono"],
            ["countdown", "Minuteur"],
            ["interval", "Séries"],
          ] as const
        ).map(([mode, label]) => (
          <button
            key={mode}
            onClick={() => setDraft((d) => ({ ...d, mode }))}
            className={`rounded-md px-2 py-1 text-xs font-bold ${
              draft.mode === mode
                ? "border border-line bg-card shadow-brutal-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {draft.mode === "countdown" && (
        <div className="grid grid-cols-2 gap-2">
          <NumField
            label="Minutes"
            value={Math.floor((draft.durationSec ?? 0) / 60)}
            onChange={(v) => setDraft((d) => ({ ...d, durationSec: v * 60 + ((d.durationSec ?? 0) % 60) }))}
          />
          <NumField
            label="Secondes"
            max={59}
            value={(draft.durationSec ?? 0) % 60}
            onChange={(v) => setDraft((d) => ({ ...d, durationSec: Math.floor((d.durationSec ?? 0) / 60) * 60 + v }))}
          />
        </div>
      )}

      {draft.mode === "interval" && (
        <div className="grid grid-cols-3 gap-2">
          <NumField label="Séries" min={1} max={99} value={draft.sets ?? 4} onChange={(v) => setDraft((d) => ({ ...d, sets: v }))} />
          <NumField label="Effort (s)" min={1} value={draft.workSec ?? 40} onChange={(v) => setDraft((d) => ({ ...d, workSec: v }))} />
          <NumField label="Repos (s)" value={draft.restSec ?? 60} onChange={(v) => setDraft((d) => ({ ...d, restSec: v }))} />
        </div>
      )}

      <div className="mt-auto flex justify-end gap-2">
        <button onClick={onCancel} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-muted hover:bg-card-2">
          Annuler
        </button>
        <button
          onClick={() => {
            const clean: TimerConfig =
              draft.mode === "countdown"
                ? { mode: "countdown", durationSec: Math.max(1, draft.durationSec ?? 60) }
                : draft.mode === "interval"
                  ? {
                      mode: "interval",
                      sets: draft.sets ?? 1,
                      workSec: Math.max(1, draft.workSec ?? 30),
                      restSec: draft.restSec ?? 0,
                    }
                  : { mode: "stopwatch" };
            onSave(clean);
          }}
          className="rounded-lg border-2 border-line bg-accent px-3 py-1.5 text-xs font-bold text-accent-ink shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
        >
          Enregistrer
        </button>
      </div>
    </div>
  );
}

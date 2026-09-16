"use client";

import { useState } from "react";
import { parseRoutineImport } from "@/lib/routineSchema";
import { useDashboard } from "@/lib/store";

const EXAMPLE = `{
  "version": 1,
  "routine": { "name": "Push Day", "icon": "💪" },
  "widgets": [
    { "type": "note", "title": "Programme", "size": "md",
      "config": { "markdown": "## Push Day\\n1. Développé couché 4×8\\n2. Dips 3×12" } },
    { "type": "timer", "title": "Développé couché", "size": "sm",
      "config": { "mode": "interval", "sets": 4, "workSec": 40, "restSec": 90 } },
    { "type": "checklist", "title": "Fin de séance", "size": "sm",
      "config": { "items": ["Étirements", "Shaker"], "resetDaily": true } }
  ]
}`;

export function ImportDialog({ onClose }: { onClose: () => void }) {
  const { addImportedPage } = useDashboard();
  const [raw, setRaw] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  const submit = () => {
    const result = parseRoutineImport(raw);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    addImportedPage(result.page);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Importer une routine"
    >
      <div
        className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-xl border-2 border-line bg-card shadow-brutal"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-line-soft px-4 py-3">
          <div>
            <h2 className="text-sm font-bold tracking-tight">Importer une routine</h2>
            <p className="text-xs text-muted">
              Colle le JSON généré par ton IA (schéma v1 —{" "}
              <a
                href="https://github.com/DustProgram/lifeapp/blob/main/docs/ROUTINE_SCHEMA.md"
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2"
              >
                documentation
              </a>
              ). Une page complète sera créée avec les widgets configurés.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="rounded p-1 text-muted hover:bg-card-2 hover:text-foreground"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
              <path d="M2.5 2.5l9 9M11.5 2.5l-9 9" />
            </svg>
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-2 p-4">
          <textarea
            value={raw}
            onChange={(e) => {
              setRaw(e.target.value);
              setErrors([]);
            }}
            placeholder={EXAMPLE}
            spellCheck={false}
            className="min-h-64 flex-1 resize-y rounded-lg border border-line-soft bg-card-2 p-3 font-mono text-xs leading-relaxed outline-none placeholder:text-muted/60 focus:border-line"
          />
          {errors.length > 0 && (
            <div className="rounded-lg border-2 border-danger/50 bg-danger/10 p-3">
              <p className="mb-1 text-xs font-bold text-danger">JSON refusé :</p>
              <ul className="space-y-0.5 font-mono text-[11px] text-danger">
                {errors.map((e, i) => (
                  <li key={i}>• {e}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <footer className="flex items-center justify-between gap-2 border-t border-line-soft px-4 py-3">
          <button
            onClick={() => {
              setRaw(EXAMPLE);
              setErrors([]);
            }}
            className="text-xs font-semibold text-muted underline underline-offset-2 hover:text-foreground"
          >
            Charger l&apos;exemple
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-muted hover:bg-card-2"
            >
              Annuler
            </button>
            <button
              onClick={submit}
              disabled={!raw.trim()}
              className="rounded-lg border-2 border-line bg-accent px-4 py-1.5 text-xs font-bold text-accent-ink shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-40 disabled:shadow-none"
            >
              Construire la page
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

"use client";

import { useRef, useState } from "react";
import { parseRoutineImport } from "@/lib/routineSchema";
import { useDashboard } from "@/lib/store";
import type { RoutinePage } from "@/lib/types";

const EXAMPLE = `{
  "version": 1,
  "routine": { "name": "Push Day", "icon": "💪", "days": [0, 3] },
  "widgets": [
    { "type": "note", "title": "Programme", "size": "md",
      "config": { "markdown": "## Push Day\\n1. Développé couché 4×8\\n2. Dips 3×12" } },
    { "type": "timer", "title": "Développé couché", "size": "sm",
      "config": { "mode": "interval", "sets": 4, "workSec": 40, "restSec": 90,
        "description": "Coudes serrés, descente contrôlée 2 s." } },
    { "type": "checklist", "title": "Fin de séance", "size": "sm",
      "config": { "items": ["Étirements", "Shaker"], "resetDaily": true } }
  ]
}`;

type ConflictAction = "update" | "duplicate" | "skip";

interface FileEntry {
  fileName: string;
  page?: RoutinePage;
  errors?: string[];
  /** Page existante portant le même nom, s'il y en a une. */
  conflictId?: string;
  action: ConflictAction;
}

export function ImportDialog({ onClose }: { onClose: () => void }) {
  const { pages, addImportedPage, replacePage } = useDashboard();
  const [raw, setRaw] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);

  const findConflict = (name: string) =>
    pages.find((p) => p.name.trim().toLowerCase() === name.trim().toLowerCase())?.id;

  const onFilesSelected = async (list: FileList | null) => {
    if (!list) return;
    const entries: FileEntry[] = [];
    for (const file of Array.from(list)) {
      const text = await file.text();
      const result = parseRoutineImport(text);
      if (!result.ok) {
        entries.push({ fileName: file.name, errors: result.errors, action: "skip" });
      } else {
        const conflictId = findConflict(result.page.name);
        entries.push({
          fileName: file.name,
          page: result.page,
          conflictId,
          action: conflictId ? "update" : "duplicate",
        });
      }
    }
    setFiles(entries);
    if (fileInput.current) fileInput.current.value = "";
  };

  const importFiles = () => {
    for (const entry of files) {
      if (!entry.page || entry.action === "skip") continue;
      if (entry.conflictId && entry.action === "update") {
        replacePage(entry.conflictId, entry.page);
      } else {
        addImportedPage(entry.page);
      }
    }
    onClose();
  };

  const submitPaste = () => {
    const result = parseRoutineImport(raw);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    addImportedPage(result.page);
    onClose();
  };

  const validFiles = files.filter((f) => f.page && f.action !== "skip");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Importer des routines"
    >
      <div
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-y-auto rounded-xl border-2 border-line bg-card shadow-brutal"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-line-soft px-4 py-3">
          <div>
            <h2 className="text-sm font-bold tracking-tight">Importer des routines</h2>
            <p className="text-xs text-muted">
              Un ou plusieurs fichiers <code>.json</code> (schéma v1 —{" "}
              <a
                href="https://github.com/DustProgram/lifeapp/blob/main/docs/ROUTINE_SCHEMA.md"
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2"
              >
                documentation
              </a>
              ), ou un JSON collé.
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

        <div className="flex flex-col gap-4 p-4">
          {/* ---- Fichiers ---- */}
          <section>
            <input
              ref={fileInput}
              type="file"
              accept=".json,application/json"
              multiple
              className="hidden"
              onChange={(e) => onFilesSelected(e.target.files)}
            />
            <button
              onClick={() => fileInput.current?.click()}
              className="flex w-full flex-col items-center gap-1 rounded-xl border-2 border-dashed border-line-soft py-5 text-muted hover:border-line hover:text-foreground"
            >
              <span className="text-2xl" aria-hidden>📥</span>
              <span className="text-sm font-bold">Choisir des fichiers JSON</span>
              <span className="text-[11px]">plusieurs fichiers possibles</span>
            </button>

            {files.length > 0 && (
              <ul className="mt-3 space-y-2">
                {files.map((f, i) => (
                  <li
                    key={i}
                    className="rounded-lg border border-line-soft px-3 py-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="min-w-0 truncate text-sm font-semibold">
                        {f.page ? (
                          <>
                            {f.page.icon && <span aria-hidden>{f.page.icon} </span>}
                            {f.page.name}
                          </>
                        ) : (
                          f.fileName
                        )}
                        <span className="ml-2 font-mono text-[10px] text-muted">
                          {f.fileName}
                        </span>
                      </p>
                      {f.errors ? (
                        <span className="shrink-0 rounded-full border border-danger/50 bg-danger/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-danger">
                          invalide
                        </span>
                      ) : f.conflictId ? (
                        <span className="shrink-0 rounded-full border border-line bg-card-2 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-muted">
                          existe déjà
                        </span>
                      ) : (
                        <span className="shrink-0 rounded-full border border-line bg-accent/20 px-2 py-0.5 font-mono text-[10px] font-bold uppercase">
                          nouveau
                        </span>
                      )}
                    </div>
                    {f.errors && (
                      <ul className="mt-1 font-mono text-[11px] text-danger">
                        {f.errors.slice(0, 3).map((e, j) => (
                          <li key={j}>• {e}</li>
                        ))}
                      </ul>
                    )}
                    {f.conflictId && f.page && (
                      <div className="mt-2 grid grid-cols-3 gap-1 rounded-lg border border-line-soft bg-card-2 p-1">
                        {(
                          [
                            ["update", "Mettre à jour"],
                            ["duplicate", "Ajouter en double"],
                            ["skip", "Ignorer"],
                          ] as const
                        ).map(([action, label]) => (
                          <button
                            key={action}
                            onClick={() =>
                              setFiles((prev) =>
                                prev.map((x, j) => (j === i ? { ...x, action } : x))
                              )
                            }
                            className={`rounded-md px-1 py-1 text-[11px] font-bold ${
                              f.action === action
                                ? "border border-line bg-card shadow-brutal-sm"
                                : "text-muted hover:text-foreground"
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {files.length > 0 && (
              <button
                onClick={importFiles}
                disabled={validFiles.length === 0}
                className="mt-3 w-full rounded-lg border-2 border-line bg-accent py-2 text-sm font-bold text-accent-ink shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-40 disabled:shadow-none"
              >
                Importer {validFiles.length} routine{validFiles.length > 1 ? "s" : ""}
              </button>
            )}
          </section>

          {/* ---- Ou coller ---- */}
          <section className="border-t border-line-soft pt-4">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted">
              Ou colle un JSON
            </p>
            <textarea
              value={raw}
              onChange={(e) => {
                setRaw(e.target.value);
                setErrors([]);
              }}
              placeholder={EXAMPLE}
              spellCheck={false}
              rows={7}
              className="w-full resize-y rounded-lg border border-line-soft bg-card-2 p-3 font-mono text-xs leading-relaxed outline-none placeholder:text-muted/60 focus:border-line"
            />
            {errors.length > 0 && (
              <div className="mt-2 rounded-lg border-2 border-danger/50 bg-danger/10 p-3">
                <p className="mb-1 text-xs font-bold text-danger">JSON refusé :</p>
                <ul className="space-y-0.5 font-mono text-[11px] text-danger">
                  {errors.map((e, i) => (
                    <li key={i}>• {e}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="mt-2 flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  setRaw(EXAMPLE);
                  setErrors([]);
                }}
                className="text-xs font-semibold text-muted underline underline-offset-2 hover:text-foreground"
              >
                Charger l&apos;exemple
              </button>
              <button
                onClick={submitPaste}
                disabled={!raw.trim()}
                className="rounded-lg border-2 border-line bg-accent px-4 py-1.5 text-xs font-bold text-accent-ink shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-40 disabled:shadow-none"
              >
                Construire la page
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

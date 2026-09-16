"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { WidgetShell } from "@/components/grid/WidgetShell";
import { useActivePageLocked, useDashboard } from "@/lib/store";
import type { Widget } from "@/lib/types";

export function NoteWidget({ widget }: { widget: Widget & { type: "note" } }) {
  const { updateWidget, updateWidgetConfig } = useDashboard();
  const locked = useActivePageLocked();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(widget.config.markdown);
  const [titleDraft, setTitleDraft] = useState(widget.title);

  const save = () => {
    updateWidgetConfig(widget.id, { markdown: draft });
    if (titleDraft.trim()) updateWidget(widget.id, { title: titleDraft.trim() });
    setEditing(false);
  };

  return (
    <WidgetShell
      widget={widget}
      actions={
        locked ? undefined : (
        <button
          onClick={() => {
            setDraft(widget.config.markdown);
            setTitleDraft(widget.title);
            setEditing((e) => !e);
          }}
          aria-label="Modifier la note"
          className="rounded p-1 text-muted hover:bg-card-2 hover:text-foreground"
        >
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
            <path d="M9.8 1.8l2.4 2.4L4.6 11.8l-3 .6.6-3z" strokeLinejoin="round" />
          </svg>
        </button>
        )
      }
    >
      {editing && !locked ? (
        <div className="flex flex-1 flex-col gap-2">
          <input
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            placeholder="Titre"
            className="rounded-lg border border-line-soft bg-card-2 px-2 py-1 text-sm font-semibold outline-none focus:border-line"
          />
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={8}
            placeholder="Markdown…"
            className="flex-1 resize-y rounded-lg border border-line-soft bg-card-2 p-2 font-mono text-xs leading-relaxed outline-none focus:border-line"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setEditing(false)}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-muted hover:bg-card-2"
            >
              Annuler
            </button>
            <button
              onClick={save}
              className="rounded-lg border-2 border-line bg-accent px-3 py-1.5 text-xs font-bold text-accent-ink shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            >
              Enregistrer
            </button>
          </div>
        </div>
      ) : (
        <div className="prose-note min-h-0 flex-1 overflow-y-auto">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {widget.config.markdown}
          </ReactMarkdown>
        </div>
      )}
    </WidgetShell>
  );
}

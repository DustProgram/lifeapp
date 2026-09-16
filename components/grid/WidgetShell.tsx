"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ReactNode } from "react";
import { useDashboard } from "@/lib/store";
import type { Widget, WidgetSize } from "@/lib/types";

const SPAN: Record<WidgetSize, string> = {
  sm: "sm:col-span-1",
  md: "sm:col-span-2",
  lg: "sm:col-span-2 xl:col-span-4",
};

const NEXT_SIZE: Record<WidgetSize, WidgetSize> = { sm: "md", md: "lg", lg: "sm" };

export function WidgetShell({
  widget,
  children,
  actions,
}: {
  widget: Widget;
  children: ReactNode;
  /** Extra header actions injected by the widget body (e.g. a settings gear). */
  actions?: ReactNode;
}) {
  const { updateWidget, removeWidget } = useDashboard();
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id });

  return (
    <section
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`group/widget relative flex min-h-40 flex-col rounded-xl border-2 border-line bg-card transition-shadow ${
        SPAN[widget.size]
      } ${isDragging ? "z-20 opacity-80 shadow-brutal" : "hover:shadow-brutal-sm"}`}
    >
      <header className="flex items-center gap-1 border-b border-line-soft px-3 py-2">
        <button
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          aria-label="Déplacer le widget"
          className="-ml-1 cursor-grab touch-none rounded p-1 text-muted hover:bg-card-2 hover:text-foreground active:cursor-grabbing"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden>
            <circle cx="4" cy="3" r="1.4" />
            <circle cx="10" cy="3" r="1.4" />
            <circle cx="4" cy="7" r="1.4" />
            <circle cx="10" cy="7" r="1.4" />
            <circle cx="4" cy="11" r="1.4" />
            <circle cx="10" cy="11" r="1.4" />
          </svg>
        </button>
        <h2 className="min-w-0 flex-1 truncate text-sm font-semibold tracking-tight">
          {widget.title}
        </h2>
        <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover/widget:opacity-100 group-focus-within/widget:opacity-100">
          {actions}
          <button
            onClick={() => updateWidget(widget.id, { size: NEXT_SIZE[widget.size] })}
            aria-label="Changer la taille"
            title={`Taille : ${widget.size}`}
            className="rounded p-1 font-mono text-[10px] font-bold uppercase text-muted hover:bg-card-2 hover:text-foreground"
          >
            {widget.size}
          </button>
          <button
            onClick={() => {
              if (window.confirm(`Supprimer « ${widget.title} » ?`)) {
                removeWidget(widget.id);
              }
            }}
            aria-label="Supprimer le widget"
            className="rounded p-1 text-muted hover:bg-card-2 hover:text-danger"
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
              <path d="M2.5 2.5l9 9M11.5 2.5l-9 9" />
            </svg>
          </button>
        </div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col p-3">{children}</div>
    </section>
  );
}

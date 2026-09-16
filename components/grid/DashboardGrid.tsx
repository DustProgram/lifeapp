"use client";

import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { useDashboard } from "@/lib/store";
import type { Widget } from "@/lib/types";
import { CalendarWidget } from "@/components/widgets/CalendarWidget";
import { ChecklistWidget } from "@/components/widgets/ChecklistWidget";
import { NoteWidget } from "@/components/widgets/NoteWidget";
import { TimerWidget } from "@/components/widgets/TimerWidget";

function WidgetBody({ widget }: { widget: Widget }) {
  switch (widget.type) {
    case "note":
      return <NoteWidget widget={widget} />;
    case "timer":
      return <TimerWidget widget={widget} />;
    case "checklist":
      return <ChecklistWidget widget={widget} />;
    case "calendar":
      return <CalendarWidget widget={widget} />;
  }
}

export function DashboardGrid() {
  const { pages, activePageId, moveWidget } = useDashboard();
  const page = pages.find((p) => p.id === activePageId) ?? pages[0];

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (over && active.id !== over.id) {
      moveWidget(String(active.id), String(over.id));
    }
  };

  if (!page) return null;

  if (page.widgets.length === 0) {
    return (
      <div className="mt-16 flex flex-col items-center gap-3 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl border-2 border-dashed border-line-soft text-2xl">
          ▦
        </div>
        <p className="text-sm text-muted">
          Page vide. Ajoute un widget avec <span className="font-semibold text-foreground">＋ Widget</span>{" "}
          ou colle une routine avec <span className="font-semibold text-foreground">Importer</span>.
        </p>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={page.widgets.map((w) => w.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {page.widgets.map((w) => (
            <WidgetBody key={w.id} widget={w} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

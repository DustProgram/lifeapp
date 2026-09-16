"use client";

import { useSyncExternalStore } from "react";
import { DashboardGrid } from "@/components/grid/DashboardGrid";

const emptySubscribe = () => () => {};

/**
 * Client gate: the grid state lives in localStorage (zustand persist), so we
 * only render it after mount to avoid a server/client hydration mismatch.
 */
export function Dashboard() {
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!mounted) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-40 animate-pulse rounded-xl border-2 border-line-soft bg-card sm:col-span-2 xl:col-span-1"
          />
        ))}
      </div>
    );
  }

  return <DashboardGrid />;
}

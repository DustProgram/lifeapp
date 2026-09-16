// Core domain types for the LifeOS dashboard.

export type WidgetType = "note" | "timer" | "checklist" | "calendar" | "media";

/** Column span in the dashboard grid: sm = 1 col, md = 2 cols, lg = full row. */
export type WidgetSize = "sm" | "md" | "lg";

export type TimerMode = "countdown" | "stopwatch" | "interval";

export interface NoteConfig {
  markdown: string;
}

export interface TimerConfig {
  mode: TimerMode;
  /** Countdown duration in seconds (mode: countdown). */
  durationSec?: number;
  /** Number of work sets (mode: interval). */
  sets?: number;
  /** Work phase length in seconds (mode: interval). */
  workSec?: number;
  /** Rest phase length in seconds (mode: interval). */
  restSec?: number;
}

export interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

export interface ChecklistConfig {
  items: ChecklistItem[];
  /** When true, all items are unchecked again on the first open of a new day. */
  resetDaily: boolean;
  /** ISO date (YYYY-MM-DD) of the last daily reset. */
  lastReset?: string;
}

export interface MediaConfig {
  /** URL directe d'une image, d'un GIF ou d'une vidéo (mp4/webm). */
  url?: string;
  /** Lire le son de la vidéo (false = muet, valeur par défaut). */
  sound: boolean;
  /** Remplir la carte (cover) ou montrer le média entier (contain). */
  fit: "cover" | "contain";
}

export interface CalendarConfig {
  /** Private ICS feed URL (Google "secret address", iCloud public link, …). */
  icsUrl?: string;
  /** Deep link opened by the "open native app" button. */
  nativeUrl?: string;
}

interface WidgetBase {
  id: string;
  title: string;
  size: WidgetSize;
}

export type Widget = WidgetBase &
  (
    | { type: "note"; config: NoteConfig }
    | { type: "timer"; config: TimerConfig }
    | { type: "checklist"; config: ChecklistConfig }
    | { type: "calendar"; config: CalendarConfig }
    | { type: "media"; config: MediaConfig }
  );

/**
 * Couleurs personnalisables (hex #rrggbb). Tout champ absent hérite du thème
 * de base ; les tons dérivés (muted, line-soft, accent-ink…) sont calculés.
 */
export interface ThemeOverride {
  background?: string;
  card?: string;
  foreground?: string;
  line?: string;
  accent?: string;
}

export interface RoutinePage {
  id: string;
  name: string;
  icon?: string;
  /** Palette propre à la page ; prime sur le thème de l'interface. */
  theme?: ThemeOverride;
  /** Jours de la semaine où la page est planifiée (0 = lundi … 6 = dimanche). */
  days?: number[];
  /** Page verrouillée : l'usage reste possible, la structure est figée. */
  locked?: boolean;
  widgets: Widget[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO datetime
  end: string; // ISO datetime
  allDay: boolean;
  location?: string;
}

export interface AuthLogEntry {
  ts: string; // ISO datetime
  user: string;
  ip: string;
  userAgent: string;
  success: boolean;
  detail?: string;
}

import { z } from "zod";
import type { RoutinePage, Widget } from "./types";

/**
 * The "AI Import" contract (version 1).
 *
 * External AIs generate a JSON document matching this schema; pasting it into
 * the app builds a full routine page with pre-configured widgets. The
 * machine-readable copy lives in `schema/routine.schema.json`, the human docs
 * in `docs/ROUTINE_SCHEMA.md`.
 */

const sizeSchema = z.enum(["sm", "md", "lg"]).default("md");

const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "couleur hexadécimale attendue (#rrggbb)");

// Palette optionnelle de la page créée (tout champ absent hérite du thème).
const themeSchema = z.object({
  background: hexColor.optional(),
  card: hexColor.optional(),
  foreground: hexColor.optional(),
  line: hexColor.optional(),
  accent: hexColor.optional(),
});

const noteWidgetSchema = z.object({
  type: z.literal("note"),
  title: z.string().min(1).max(80),
  size: sizeSchema,
  config: z.object({
    markdown: z.string().max(20000),
  }),
});

const timerWidgetSchema = z.object({
  type: z.literal("timer"),
  title: z.string().min(1).max(80),
  size: sizeSchema.default("sm"),
  config: z
    .discriminatedUnion("mode", [
      z.object({
        mode: z.literal("countdown"),
        description: z.string().max(300).optional(),
        durationSec: z.number().int().min(1).max(86400),
      }),
      z.object({
        mode: z.literal("stopwatch"),
        description: z.string().max(300).optional(),
      }),
      z.object({
        mode: z.literal("interval"),
        description: z.string().max(300).optional(),
        sets: z.number().int().min(1).max(99),
        workSec: z.number().int().min(1).max(86400),
        restSec: z.number().int().min(0).max(86400),
      }),
    ])
    .default({ mode: "stopwatch" }),
});

// Checklist items may be plain strings (shorthand) or objects.
const checklistItemSchema = z.union([
  z.string().min(1).max(200),
  z.object({ label: z.string().min(1).max(200), done: z.boolean().default(false) }),
]);

const checklistWidgetSchema = z.object({
  type: z.literal("checklist"),
  title: z.string().min(1).max(80),
  size: sizeSchema.default("sm"),
  config: z.object({
    items: z.array(checklistItemSchema).min(1).max(100),
    resetDaily: z.boolean().default(true),
  }),
});

const mediaWidgetSchema = z.object({
  type: z.literal("media"),
  title: z.string().min(1).max(80),
  size: sizeSchema,
  config: z
    .object({
      url: z.url().optional(),
      sound: z.boolean().default(false),
      fit: z.enum(["cover", "contain"]).default("cover"),
    })
    .default({ sound: false, fit: "cover" }),
});

const calendarWidgetSchema = z.object({
  type: z.literal("calendar"),
  title: z.string().min(1).max(80),
  size: sizeSchema,
  config: z
    .object({
      icsUrl: z.url().optional(),
      nativeUrl: z.string().max(500).optional(),
    })
    .default({}),
});

export const routineImportSchema = z.object({
  version: z.literal(1),
  routine: z.object({
    name: z.string().min(1).max(60),
    icon: z.string().max(8).optional(),
    description: z.string().max(500).optional(),
    theme: themeSchema.optional(),
    days: z
      .array(z.number().int().min(0).max(6))
      .max(7)
      .optional()
      .describe("Jours de la semaine planifiés (0 = lundi … 6 = dimanche)"),
  }),
  widgets: z
    .array(
      z.discriminatedUnion("type", [
        noteWidgetSchema,
        timerWidgetSchema,
        checklistWidgetSchema,
        calendarWidgetSchema,
        mediaWidgetSchema,
      ])
    )
    .min(1)
    .max(40),
});

export type RoutineImport = z.infer<typeof routineImportSchema>;

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 10);

/** Validate a raw pasted string and convert it to a ready-to-mount RoutinePage. */
export function parseRoutineImport(raw: string):
  | { ok: true; page: RoutinePage }
  | { ok: false; errors: string[] } {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return { ok: false, errors: ["Le texte collé n'est pas un JSON valide."] };
  }

  const result = routineImportSchema.safeParse(json);
  if (!result.success) {
    const errors = result.error.issues
      .slice(0, 8)
      .map((i) => `${i.path.join(".") || "(racine)"} — ${i.message}`);
    return { ok: false, errors };
  }

  const data = result.data;
  const widgets: Widget[] = data.widgets.map((w) => {
    if (w.type === "checklist") {
      return {
        id: uid(),
        type: "checklist",
        title: w.title,
        size: w.size,
        config: {
          resetDaily: w.config.resetDaily,
          items: w.config.items.map((item) =>
            typeof item === "string"
              ? { id: uid(), label: item, done: false }
              : { id: uid(), label: item.label, done: item.done }
          ),
        },
      };
    }
    return { id: uid(), ...w } as Widget;
  });

  return {
    ok: true,
    page: {
      id: uid(),
      name: data.routine.name,
      icon: data.routine.icon,
      theme: data.routine.theme,
      days: data.routine.days?.length
        ? [...new Set(data.routine.days)].sort((a, b) => a - b)
        : undefined,
      widgets,
    },
  };
}

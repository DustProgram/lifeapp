import { mkdir, readFile, rename, writeFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";

// Un dashboard par utilisateur, stocké côté serveur : chaque compte HA a ses
// propres pages, retrouvées depuis n'importe quel appareil.
const DIR = () =>
  path.join(process.env.DATA_DIR || path.join(process.cwd(), "data"), "dashboards");

const fileFor = (user: string) =>
  path.join(DIR(), Buffer.from(user).toString("base64url") + ".json");

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  try {
    const raw = await readFile(fileFor(session.user), "utf8");
    return NextResponse.json({ state: JSON.parse(raw) });
  } catch {
    return NextResponse.json({ state: null });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  let body: { pages?: unknown; activePageId?: unknown };
  try {
    const raw = await req.text();
    if (raw.length > 2_000_000) {
      return NextResponse.json({ error: "Dashboard trop volumineux." }, { status: 413 });
    }
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }
  if (!Array.isArray(body.pages) || body.pages.length > 100) {
    return NextResponse.json({ error: "Structure invalide." }, { status: 400 });
  }

  const target = fileFor(session.user);
  try {
    await mkdir(DIR(), { recursive: true });
    // Écriture atomique : fichier temporaire puis rename.
    const tmp = target + ".tmp";
    await writeFile(
      tmp,
      JSON.stringify({ pages: body.pages, activePageId: body.activePageId ?? null }),
      "utf8"
    );
    await rename(tmp, target);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("dashboard save failed:", err);
    return NextResponse.json({ error: "Écriture impossible." }, { status: 500 });
  }
}

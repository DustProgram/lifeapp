import { NextResponse } from "next/server";
import { readAuthLog } from "@/lib/authLog";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }
  return NextResponse.json({ entries: await readAuthLog() });
}

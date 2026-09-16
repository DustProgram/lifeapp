import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { appendAuthLog } from "@/lib/authLog";
import { haConfigured, verifyHaCredentials } from "@/lib/ha";
import {
  SESSION_COOKIE,
  createSessionToken,
  sessionCookieOptions,
} from "@/lib/session";

export const runtime = "nodejs";

const safeEquals = (a: string, b: string) => {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
};

export async function POST(req: NextRequest) {
  let username = "";
  let password = "";
  try {
    const body = (await req.json()) as { username?: string; password?: string };
    username = String(body.username ?? "").trim();
    password = String(body.password ?? "");
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const userAgent = req.headers.get("user-agent") || "unknown";
  const log = (success: boolean, detail?: string) =>
    appendAuthLog({
      ts: new Date().toISOString(),
      user: username || "(vide)",
      ip,
      userAgent,
      success,
      detail,
    });

  if (!username || !password) {
    await log(false, "champs manquants");
    return NextResponse.json(
      { error: "Identifiant et mot de passe requis." },
      { status: 400 }
    );
  }

  let ok = false;
  let error = "Identifiants incorrects.";
  let detail: string | undefined;

  if (haConfigured()) {
    const result = await verifyHaCredentials(username, password);
    ok = result.ok;
    detail = result.ok ? "home-assistant" : `home-assistant: ${result.reason}`;
    if (!result.ok && result.reason === "unreachable")
      error = "Home Assistant est injoignable. Vérifie HA_URL.";
    if (!result.ok && result.reason === "mfa_required")
      error =
        "Ce compte exige le MFA, non supporté pour l'instant. Utilise un compte HA sans MFA ou APP_USER/APP_PASSWORD.";
  } else if (process.env.APP_USER && process.env.APP_PASSWORD) {
    // Standalone fallback when no Home Assistant instance is configured.
    ok =
      safeEquals(username, process.env.APP_USER) &&
      safeEquals(password, process.env.APP_PASSWORD);
    detail = "local";
  } else {
    await log(false, "aucun fournisseur d'auth configuré");
    return NextResponse.json(
      {
        error:
          "Aucune authentification configurée. Définis HA_URL (Home Assistant) ou APP_USER/APP_PASSWORD.",
      },
      { status: 503 }
    );
  }

  await log(ok, detail);

  if (!ok) {
    return NextResponse.json({ error }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true, user: username });
  res.cookies.set(SESSION_COOKIE, createSessionToken(username), sessionCookieOptions);
  return res;
}
